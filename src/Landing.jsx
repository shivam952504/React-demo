import { useEffect, useState } from "react";
import { Row, Col } from "antd";
import MetricTile from "./MetricTile";
import DashboardHeader from "./DashboardHeader";
import LoaderOverlay from "./loader/LoaderOverlay";
import ClientKpiTable from "./ClientKpiTable";
import HoverPopup from "./hoverPopup/HoverPopup";
import DashboardTicker from "./dashboardTicker/DashboardTicker";
import { apiclient } from "../auth/apiClient";
import LeftSidebar from "./sideBar/LeftSidebar";
import CategoryFilters from "./categoryFilter/CategoryFilters";

const LANDING_CACHE_KEY = "landing_api_cache_v1";

function Landing() {
  const [tiles, setTiles] = useState([]);
  const [allTiles, setAllTiles] = useState([]);
  const [metricsMap, setMetricsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [clientTableData, setClientTableData] = useState([]);
  const [allClientTableData, setAllClientTableData] = useState([]);
  const [geo, setGeo] = useState("ALL");
  const [geoOptions, setGeoOptions] = useState(["ALL"]);
  const [tileHoverMap, setTileHoverMap] = useState({});
  const [clientHoverMap, setClientHoverMap] = useState({});
  const [activeTile, setActiveTile] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("Home");
  const [highlights, setHighlights] = useState([]);

  /* ============================
     Cache helpers (SAFE)
  ============================ */
  const getCachedData = (geo) => {
    try {
      const raw = sessionStorage.getItem(LANDING_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed[geo] || null;
    } catch {
      return null;
    }
  };

  const setCachedData = (geo, data) => {
    try {
      const raw = sessionStorage.getItem(LANDING_CACHE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[geo] = data;
      sessionStorage.setItem(LANDING_CACHE_KEY, JSON.stringify(parsed));
    } catch {
      // fail silently
    }
  };

  /* ============================
     API CALL
  ============================ */
  useEffect(() => {
    const callApi = async () => {
      // ✅ 1. Try cache first
      const cached = getCachedData(geo);
      if (cached) {
        setTileHoverMap(cached.tileHoverMap);
        setClientHoverMap(cached.clientHoverMap);
        setMetricsMap(cached.metricsMap);
        setTiles(cached.tiles);
        setAllTiles(cached.tiles);
        setClientTableData(cached.tableRows);
        setAllClientTableData(cached.tableRows);
        setGeoOptions(cached.geoOptions);
        setHighlights(cached.highlights);
        setLoading(false);
        return;
      }

      // ❌ Cache miss → call API
      setLoading(true);
      try {
        const response = await apiclient("http://localhost:9009/api/", {
          method: "POST",
          body: JSON.stringify({
            geo,
            job: "ALL",
            user_id: "",
          }),
        });

        const data = await response.json();
        const result = data?.result;
        if (!result) return;

        const metricsArray = Array.isArray(result.metrics)
          ? result.metrics
          : [];
        const tilesArray = Array.isArray(result.tiles)
          ? result.tiles
          : [];
        const tableRows = Array.isArray(result.table_rows)
          ? result.table_rows
          : [];
        const geoValue = Array.isArray(result.geo_options)
          ? result.geo_options
          : [];

        const tilesHover = result?.hover_data?.tiles_hover || [];
        const clientHover = result?.hover_data?.client_hover || [];

        const metricLookup = {};
        metricsArray.forEach((m) => {
          metricLookup[m.id] = m;
        });

        const tileHoverLookup = {};
        tilesHover.forEach((item) => {
          tileHoverLookup[item.id] = {
            title: item.title,
            ...item.details.metrics,
          };
        });

        const clientHoverLookup = {};
        clientHover.forEach((item) => {
          const d = item.details || {};
          clientHoverLookup[item.id] = {
            title: item.id,
            headcount: d.head_count,
            kpi: d.KPI,
            link: d.link,
          };
        });

        // ✅ Set state
        setTileHoverMap(tileHoverLookup);
        setClientHoverMap(clientHoverLookup);
        setMetricsMap(metricLookup);
        setTiles(tilesArray);
        setAllTiles(tilesArray);
        setClientTableData(tableRows);
        setAllClientTableData(tableRows);
        setGeoOptions(["ALL", ...geoValue]);
        setHighlights(result.highlights || []);

        // ✅ Cache result
        setCachedData(geo, {
          tileHoverMap: tileHoverLookup,
          clientHoverMap: clientHoverLookup,
          metricsMap: metricLookup,
          tiles: tilesArray,
          tableRows,
          geoOptions: ["ALL", ...geoValue],
          highlights: result.highlights || [],
        });
      } catch (error) {
        console.error("API error:", error);
      } finally {
        setLoading(false);
      }
    };

    callApi();
  }, [geo]);

  /* ============================
     FILTERS
  ============================ */
  const filteredTiles =
    selectedCategory === "Home"
      ? allTiles
      : allTiles.filter((t) => t.category === selectedCategory);

  const filteredTableData =
    selectedCategory === "Home"
      ? allClientTableData
      : allClientTableData
          .filter((row) =>
            row.metrics?.some((m) => m.category === selectedCategory)
          )
          .map((row) => ({
            ...row,
            metrics: row.metrics.filter(
              (m) => m.category === selectedCategory
            ),
          }));

  /* ============================
     RENDER
  ============================ */
  return (
    <>
      <LoaderOverlay show={loading} />

      <div className="dashboard-page" style={{ maxHeight: "100vh" }}>
        <div className="dashboard-container">
          <DashboardHeader
            selectedGeo={geo}
            geoOptions={geoOptions}
            updatedAt="05 Jan 2026, 10:52"
            onGeoChange={(value) => setGeo(value)}
          />

          <div
            className="dashboard-body"
            style={{ display: "flex", width: "100%" }}
          >
            <LeftSidebar
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />

            <div
              className="dashboard-content"
              style={{
                flex: 1,
                paddingLeft: "12px",
                overflowX: "hidden",
              }}
            >
              <DashboardTicker highlights={highlights} />

              <CategoryFilters
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />

              <Row gutter={[20, 20]}>
                {filteredTiles.map((tile) => {
                  const metric = metricsMap[tile.id] || {};
                  return (
                    <Col
                      xs={24}
                      sm={12}
                      md={8}
                      lg={6}
                      xl={4}
                      key={tile.id}
                    >
                      <div
                        className="metric-tile-wrapper"
                        onMouseEnter={() => setActiveTile(tile.id)}
                        onMouseLeave={() => setActiveTile(null)}
                      >
                        <MetricTile
                          label={tile.label}
                          planned={tile.planned}
                          actual={tile.actual}
                          value={tile.value}
                          isPercent={metric.is_percent}
                          favourable={tile.favourable}
                          neutral={tile.neutral}
                          unfavourable={tile.unfavourable}
                          unit={tile.unit}
                        />

                        {activeTile === tile.id &&
                          tileHoverMap[tile.id] && (
                            <HoverPopup data={tileHoverMap[tile.id]} />
                          )}
                      </div>
                    </Col>
                  );
                })}
              </Row>

              <ClientKpiTable
                tableRows={filteredTableData}
                data={clientHoverMap}
                geo={geo}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Landing;

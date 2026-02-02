import { useEffect, useState } from "react";
import { Row, Col } from "antd";
import MetricTile from "./MetricTile";
import DashboardHeader from "./DashboardHeader";
import LoaderOverlay from "./loader/LoaderOverlay";
import ClientKpiTable from "./ClientKpiTable";
import HoverPopup from "./hoverPopup/HoverPopup";
import DashboardTicker from "./dashboardTicker/DashboardTicker";
import { apiClient } from "../auth/apiClient";
import LeftSidebar from "./sideBar/LeftSidebar";

function Landing() {
  const [tiles, setTiles] = useState([]);
  const [metricsMap, setMetricsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [clientTableData, setClientTableData] = useState([]);
  const [geo, setGeo] = useState("ALL");
  const [geoOptions, setGeoOptions] = useState(["ALL"]);
  const [tileHoverMap, setTileHoverMap] = useState({});
  const [clientHoverMap, setClientHoverMap] = useState({});
  const [activeTile, setActiveTile] = useState(null);

  // ✅ NEW: category filter
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  useEffect(() => {
    const callApi = async () => {
      setLoading(true);
      try {
        const response = await apiClient("http://localhost:9009/api/", {
          method: "POST",
          body: JSON.stringify({
            geo: geo,
            job: "ALL",
            user_id: "",
          }),
        });

        const data = await response.json();
        const result = data?.result;

        if (!result) {
          console.error("No result in API response", data);
          return;
        }

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
        metricsArray.forEach((element) => {
          metricLookup[element.id] = element;
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

        setMetricsMap(metricLookup);
        setTiles(tilesArray);
        setClientTableData(tableRows);
        setTileHoverMap(tileHoverLookup);
        setClientHoverMap(clientHoverLookup);
        setGeoOptions(["ALL", ...geoValue]);
      } catch (error) {
        console.error("API error:", error);
      } finally {
        setLoading(false);
      }
    };

    callApi();
  }, [geo]);

  // ✅ FILTER LOGIC (ONLY CHANGE)
  const filteredTiles =
    selectedCategory === "ALL"
      ? tiles
      : tiles.filter((t) => t.category === selectedCategory);

  const filteredTableData =
    selectedCategory === "ALL"
      ? clientTableData
      : clientTableData.filter((r) => r.category === selectedCategory);

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
            style={{
              display: "flex",
              width: "100%",
              minHeight: "calc(100vh - 64px)",
            }}
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
              <DashboardTicker />

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
                        onMouseEnter={() => setActiveTile(tile.id)}
                        onMouseLeave={() => setActiveTile(null)}
                        className="metric-tile-wrapper"
                      >
                        <MetricTile
                          label={tile.label}
                          planned={tile.planned}
                          actual={tile.actual}
                          value={tile.value}
                          isPercent={metric.is_percent}
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

import { useState } from "react";
import "./LeftSidebar.css";

const categories = [
  "ALL",
  "People",
  "Capacity",
  "Bill To Pay",
  "Road to Advocacy",
  "Client Sentiment",
];

function LeftSidebar({ selectedCategory, onCategoryChange }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`left-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
        ☰
      </div>

      <ul className="sidebar-list">
        {categories.map((item) => (
          <li
            key={item}
            className={selectedCategory === item ? "active" : ""}
            onClick={() => onCategoryChange(item)}
          >
            {!collapsed && item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default LeftSidebar;

  

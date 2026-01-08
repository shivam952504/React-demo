import { useEffect, useRef, useState } from "react";
import { Row, Col, Skeleton, Breadcrumb } from "antd";
import MetricTile from "./MetricTile";
import DashboardHeader from "./DashboardHeader";
import ClientKpiTable from "./ClientKpiTable";

function Landing() {
  const cacheRef = useRef({}); // ✅ CLIENT-LEVEL CACHE

  const [tiles, setTiles] = useState([]);
  const [metricsMap, setMetricsMap] = useState({});
  const [clientTableData, setClientTableData] = useState([]);
  const [geoOptions, setGeoOptions] = useState(["ALL"]);
  const [selectedGeo, setSelectedGeo] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [tableAnimating, setTableAnimating] = useState(false);

  const normalizePercent = (value) => {
    if (value == null) return "-";
    if (typeof value === "number") return `${value}%`;
    if (typeof value === "object") {
      if (value.current != null) return `${value.current}%`;
      if (value.value != null) return `${value.value}%`;
    }
    return "-";
  };

  const callApi = async (geoValue = "ALL") => {
    const cacheKey = `${geoValue}_ALL`;

    // ✅ USE CACHE
    if (cacheRef.current[cacheKey]) {
      const cached = cacheRef.current[cacheKey];
      setTiles(cached.tiles);
      setMetricsMap(cached.metricsMap);
      setClientTableData(cached.clientTableData);
      setGeoOptions(cached.geoOptions);
      return;
    }

    setLoading(true);
    setTableAnimating(true);

    try {
      const response = await fetch("http://localhost:9009/api/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geo: geoValue, job: "ALL" }),
      });

      const data = await response.json();
      const result = data?.result;

      if (!result) return;

      const tilesArray = Array.isArray(result.tiles) ? result.tiles : [];
      const metricsArray = Array.isArray(result.metrics)
        ? result.metrics
        : [];
      const tableRows = Array.isArray(result.table_rows)
        ? result.table_rows
        : [];
      const geoOpts = Array.isArray(result.geo_options)
        ? ["ALL", ...result.geo_options]
        : ["ALL"];

      const metricLookup = {};
      metricsArray.forEach((m) => {
        metricLookup[m.id] = {
          ...m,
          value: normalizePercent(m.value),
        };
      });

      const payload = {
        tiles: tilesArray,
        metricsMap: metricLookup,
        clientTableData: tableRows,
        geoOptions: geoOpts,
      };

      // ✅ SAVE TO CACHE
      cacheRef.current[cacheKey] = payload;

      setTiles(tilesArray);
      setMetricsMap(metricLookup);
      setClientTableData(tableRows);
      setGeoOptions(geoOpts);
    } catch (err) {
      console.error("API error:", err);
    } finally {
      setLoading(false);
      setTimeout(() => setTableAnimating(false), 250);
    }
  };

  // 🔹 Initial load
  useEffect(() => {
    callApi("ALL");
  }, []);

  // 🔹 GEO change
  const handleGeoChange = (value) => {
    setSelectedGeo(value);
    callApi(value);
  };

  return (
    <div className="dashboard-page" style={{ maxHeight: "100vh" }}>
      <div style={{ maxWidth: 1350, margin: "0 auto", padding: 20 }}>
        {/* ✅ Breadcrumb (no warnings) */}
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        </Breadcrumb>

        <DashboardHeader
          selectedGeo={selectedGeo}
          geoOptions={geoOptions}
          updatedAt="05 Jan 2026, 10:52"
          onGeoChange={handleGeoChange}
        />

        {/* ================= KPI TILES ================= */}
        <Row gutter={[20, 20]}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Col xs={24} sm={12} md={6} key={i}>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Col>
              ))
            : tiles.map((tile) => {
                const metric = metricsMap[tile.id] || {};
                return (
                  <Col xs={24} sm={12} md={6} key={tile.id}>
                    <MetricTile
                      label={tile.label}
                      planned={tile.planned}
                      actual={tile.actual}
                      value={normalizePercent(tile.value)}
                      isPercent={metric.is_percent}
                    />
                  </Col>
                );
              })}
        </Row>

        {/* ================= TABLE ================= */}
        <div
          style={{
            marginTop: 24,
            transition: "all 0.25s ease",
            opacity: tableAnimating ? 0.4 : 1,
            transform: tableAnimating ? "translateY(6px)" : "none",
          }}
        >
          {loading ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : (
            <ClientKpiTable tableRows={clientTableData} />
          )}
        </div>
      </div>
    </div>
  );
}

export default Landing;

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Breadcrumb, Select, Skeleton } from "antd";
import MetricTile from "./MetricTile";
import ClientKpiTable from "./ClientKpiTable";

const { Option } = Select;

function normalizePercent(value, isPercent) {
  if (value === null || value === undefined) return "-";
  return isPercent ? `${value}%` : value;
}

function normalizeESATNPS(value) {
  if (!value || typeof value !== "object") return "-";
  const { favourable = 0, neutral = 0, unfavourable = 0 } = value;
  return `Fav: ${favourable}% | Neu: ${neutral}% | Unf: ${unfavourable}%`;
}

function ClientLanding() {
  const { clientSlug } = useParams();
  const navigate = useNavigate();

  const cacheRef = useRef({}); // 🔥 CLIENT-LEVEL CACHE

  const [geo, setGeo] = useState("ALL");
  const [geoOptions, setGeoOptions] = useState(["ALL"]);

  const [tiles, setTiles] = useState([]);
  const [metricsMap, setMetricsMap] = useState({});
  const [clientTableData, setClientTableData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);

  const fetchClientData = async (selectedGeo) => {
    const cacheKey = `${clientSlug}_${selectedGeo}`;
    if (cacheRef.current[cacheKey]) {
      const cached = cacheRef.current[cacheKey];
      setTiles(cached.tiles);
      setMetricsMap(cached.metricsMap);
      setClientTableData(cached.tableRows);
      return;
    }

    try {
      selectedGeo === geo ? setLoading(true) : setTableLoading(true);

      const res = await fetch(
        `http://localhost:9009/api/client/${clientSlug}/landing`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            geo: selectedGeo,
            job: "ALL",
          }),
        }
      );

      const json = await res.json();
      const result = json?.result;

      if (!result) return;

      const tilesArray = Array.isArray(result.tiles) ? result.tiles : [];
      const metricsArray = Array.isArray(result.metrics)
        ? result.metrics
        : [];
      const tableRows = Array.isArray(result.table_rows)
        ? result.table_rows
        : [];

      const metricLookup = {};
      metricsArray.forEach((m) => {
        metricLookup[m.id] = m;
      });

      setGeoOptions(["ALL", ...(result.geo_options || [])]);
      setTiles(tilesArray);
      setMetricsMap(metricLookup);
      setClientTableData(tableRows);

      cacheRef.current[cacheKey] = {
        tiles: tilesArray,
        metricsMap: metricLookup,
        tableRows,
      };
    } catch (err) {
      console.error("API error:", err);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData("ALL");
  }, [clientSlug]);

  return (
    <div className="dashboard-page" style={{ maxHeight: "100vh" }}>
      <div style={{ maxWidth: 1350, margin: "0 auto", padding: 20 }}>
        {/* ✅ Breadcrumb (NO reload) */}
        <Breadcrumb
          items={[
            {
              title: (
                <span
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate("/")}
                >
                  Dashboard
                </span>
              ),
            },
            { title: clientSlug.replace(/-/g, " ") },
          ]}
        />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ marginTop: 16 }}>{clientSlug.replace(/-/g, " ")}</h2>
          <Select
            value={geo}
            style={{ width: 160 }}
            onChange={(value) => {
              setGeo(value);
              fetchClientData(value);
            }}
          >
            {geoOptions.map((g) => (
              <Option key={g} value={g}>
                {g}
              </Option>
            ))}
          </Select>
        </div>

        {/* Tiles */}
        <div style={{ marginTop: 20 }}>
          {loading ? (
            <Skeleton active paragraph={{ rows: 2 }} />
          ) : (
            <div className="tile-grid">
              {tiles.map((tile) => {
                const metric = metricsMap[tile.id] || {};
                let displayValue = normalizePercent(
                  tile.value ?? tile.actual,
                  metric.is_percent
                );

                if (tile.id === "esat" || tile.id === "nps") {
                  displayValue = normalizeESATNPS(tile.value);
                }

                return (
                  <MetricTile
                    key={tile.id}
                    label={tile.label}
                    planned={tile.planned}
                    actual={tile.actual}
                    value={displayValue}
                    isPercent={metric.is_percent}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Table */}
        <div
          style={{
            marginTop: 30,
            transition: "opacity 0.3s ease",
            opacity: tableLoading ? 0.5 : 1,
          }}
        >
          {tableLoading ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : (
            <ClientKpiTable tableRows={clientTableData} />
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientLanding;

import { useEffect, useMemo, useState } from "react";
import { Row, Col, Table } from "antd";
import MetricTile from "./MetricTile";
import LoaderOverlay from "../loader/LoaderOverlay";
import { apiClient } from "../../auth/apiClient";

/**
 * KPI tiles config
 * id MUST match backend tile.title exactly
 */
const KPI_TILES = [
  { id: "Production Hours", label: "Production Hours" },
  { id: "AHT (in seconds)", label: "AHT" },
  { id: "Adherence", label: "Adherence" },
  { id: "Quality", label: "Quality" },
  { id: "Quality Service", label: "Quality Service" },
  { id: "Quality Compliance", label: "Quality Compliance" },
  { id: "CSAT", label: "CSAT" },
];

function KPI({ jobCodes = ["ALL"] }) {
  const [loading, setLoading] = useState(false);
  const [selectedTileId, setSelectedTileId] = useState(null);
  const [kpiDataByTile, setKpiDataByTile] = useState({});

  /* ---------------- Normalize job codes ---------------- */
  const normalizedJobCodes = useMemo(() => {
    if (!jobCodes || jobCodes.length === 0) return ["ALL"];
    if (jobCodes.includes("ALL")) return ["ALL"];
    return jobCodes;
  }, [jobCodes]);

  /* Stable dependency key */
  const jobKey = useMemo(
    () => normalizedJobCodes.slice().sort().join(","),
    [normalizedJobCodes]
  );

  /* ---------------- Fetch KPI ---------------- */
  useEffect(() => {
    let cancelled = false;

    const fetchKpiData = async () => {
      setLoading(true);
      try {
        const res = await apiClient(
          "http://localhost:9009/api/client/concora/KPI",
          {
            method: "POST",
            body: JSON.stringify({
              geo: ["ALL"],
              job: normalizedJobCodes,
              user_id: "",
            }),
          }
        );

        const json = await res.json();
        const result = json?.result;

        if (!result || typeof result !== "object") {
          throw new Error("Invalid KPI response");
        }

        /**
         * Transform backend response into:
         * {
         *   "AHT (in seconds)": { tile, table },
         *   "Adherence": { tile, table }
         * }
         */
        const mapped = {};
        Object.values(result).forEach((block) => {
          if (block?.tile?.title) {
            mapped[block.tile.title] = block;
          }
        });

        if (!cancelled) {
          setKpiDataByTile(mapped);
          setSelectedTileId(null); // reset table on filter change
        }
      } catch (err) {
        console.error("Failed to fetch KPI data", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchKpiData();

    return () => {
      cancelled = true;
    };
  }, [jobKey, normalizedJobCodes]);

  /* ---------------- Tile click ---------------- */
  const handleTileClick = (tileId) => {
    setSelectedTileId((prev) => (prev === tileId ? null : tileId));
  };

  /* ---------------- Table columns ---------------- */
  const tableColumns = useMemo(() => {
    if (!selectedTileId) return [];

    const cols = kpiDataByTile[selectedTileId]?.table?.columns || [];
    return cols.map((col) => ({
      title: col.label,
      dataIndex: col.key === "actual" ? "value" : col.key, // 🔥 FIX
      key: col.key,
    }));
  }, [selectedTileId, kpiDataByTile]);

  /* ---------------- Render ---------------- */
  return (
    <>
      <LoaderOverlay show={loading} />

      {/* KPI Tiles */}
      <Row gutter={[20, 20]}>
        {KPI_TILES.map((tile) => {
          const tileResult = kpiDataByTile[tile.id]?.tile;

          const isActive = selectedTileId === tile.id;
          const isDimmed = selectedTileId && selectedTileId !== tile.id;

          return (
            <Col
              key={tile.id}
              xs={24}
              sm={12}
              md={8}
              lg={6}
              xl={4}
              style={{ cursor: "pointer" }}
              onClick={() => handleTileClick(tile.id)}
            >
              <MetricTile
                label={tile.label}
                overall_actual={tileResult?.overall_actual ?? null}
                overall_forecast={tileResult?.overall_forecast ?? null}
                value={
                  tileResult?.percentage ??
                  tileResult?.overall ??
                  null
                }
                isPercent
                isActive={isActive}
                isDimmed={isDimmed}
                createdAt={tileResult?.created_at}
                minHeight={185}
              />
            </Col>
          );
        })}
      </Row>

      {/* KPI Table */}
      {selectedTileId &&
        kpiDataByTile[selectedTileId]?.table?.rows && (
          <div style={{ marginTop: 24 }}>
            <Table
              loading={loading}
              columns={tableColumns}
              dataSource={kpiDataByTile[selectedTileId].table.rows}
              rowKey={(row, index) => index}
              pagination={false}
            />
          </div>
        )}
    </>
  );
}

export default KPI;

import { useEffect, useState } from "react";
import { Row, Col, Table } from "antd";
import MetricTile from "../MetricTile";
import LoaderOverlay from "../loader/LoaderOverlay";
import apiClient from "../../auth/apiClient";

/**
 * KPI tiles config
 * id MUST match backend tile.title
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

  // 🔹 Normalize job codes for API
  const normalizeJobCodes = (values) => {
    if (!values || values.length === 0) return ["ALL"];
    if (values.includes("ALL")) return ["ALL"];
    return values;
  };

  // 🔹 Fetch KPI data
  useEffect(() => {
    const fetchKpiData = async () => {
      setLoading(true);
      try {
        const res = await apiClient(
          "http://localhost:9009/api/client/concora/KPI",
          {
            method: "POST",
            body: JSON.stringify({
              geo: ["ALL"],
              job: normalizeJobCodes(jobCodes),
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
         *   "Production Hours": { tile, table },
         *   "AHT (in seconds)": { tile, table }
         * }
         */
        const mapped = {};

        Object.values(result).forEach((block) => {
          if (block?.tile?.title) {
            mapped[block.tile.title] = block;
          }
        });

        setKpiDataByTile(mapped);
        setSelectedTileId(null); // reset selection on filter change
      } catch (err) {
        console.error("Failed to fetch KPI data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchKpiData();
  }, [jobCodes]);

  // 🔹 Handle tile click
  const handleTileClick = (tileId) => {
    setSelectedTileId((prev) => (prev === tileId ? null : tileId));
  };

  // 🔹 Table columns
  const tableColumns =
    selectedTileId &&
    kpiDataByTile[selectedTileId]?.table?.columns
      ? kpiDataByTile[selectedTileId].table.columns.map((col) => ({
          title: col.label,
          dataIndex: col.key,
          key: col.key,
        }))
      : [];

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
              xs={24}
              sm={12}
              md={8}
              lg={6}
              xl={4}
              key={tile.id}
              style={{ cursor: "pointer" }}
              onClick={() => handleTileClick(tile.id)}
            >
              <MetricTile
                label={tile.label}
                overall_actual={tileResult?.overall_actual ?? null}
                overall_forecast={tileResult?.overall_forecast ?? null}
                value={tileResult?.percentage ?? tileResult?.overall ?? null}
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
      

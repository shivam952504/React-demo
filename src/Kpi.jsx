import { useEffect, useState } from "react";
import { Row, Col, Table } from "antd";
import MetricTile from "./MetricTile";
import { apiClient } from "../../auth/apiClient";
import LoaderOverlay from "../loader/LoaderOverlay";

const KPI_TILES = [
  { id: "Production Hours", label: "Production Hours" },
  { id: "AHT", label: "AHT" },
  { id: "Adherence", label: "Adherence" },
  { id: "Quality", label: "Quality" },
  { id: "Quality Service", label: "Quality Service" },
  { id: "Quality Compliance", label: "Quality Compliance" },
  { id: "CSAT", label: "CSAT" },
  { id: "Shrinkage", label: "Shrinkage" },
  { id: "Attrition", label: "Attrition" },
  { id: "Scheduled HC", label: "Scheduled HC" }
];

function KPI() {
  const [selectedTileId, setSelectedTileId] = useState(null);
  const [kpiDataByTile, setKpiDataByTile] = useState({});
  const [loading, setLoading] = useState(false);

  /* =========================
     FETCH KPI DATA ON LOAD
     ========================= */
  useEffect(() => {
    const fetchKpiData = async () => {
      setLoading(true);
      try {
        const res = await apiClient(
          "http://localhost:9009/api/client/concora/KPI",
          {
            method: "POST",
            body: JSON.stringify({
              geo: "ALL",
              job: "ALL",
              user_id: "string"
            })
          }
        );

        const json = await res.json();

        /**
         * Backend currently returns data for ONE tile
         * We store it by tile title for future scaling
         */
        const tileId = json?.result?.tile?.title;

        if (tileId) {
          setKpiDataByTile({
            [tileId]: json.result
          });
        }
      } catch (err) {
        console.error("Failed to fetch KPI data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchKpiData();
  }, []);

  /* =========================
     TILE CLICK HANDLER
     ========================= */
  const handleTileClick = (tileId) => {
    setSelectedTileId((prev) => (prev === tileId ? null : tileId));
  };

  /* =========================
     TABLE COLUMNS
     ========================= */
  const tableColumns =
    selectedTileId && kpiDataByTile[selectedTileId]?.table?.columns
      ? kpiDataByTile[selectedTileId].table.columns.map((col) => ({
          title: col.label,
          dataIndex: col.key,
          key: col.key
        }))
      : [];

  return (
    <>
      <LoaderOverlay show={loading} />

      {/* =========================
          KPI TILES
         ========================= */}
      <Row gutter={[20, 20]}>
        {KPI_TILES.map((tile) => {
          const tileResult = kpiDataByTile[tile.id]?.tile;

          const isActive = selectedTileId === tile.id;
          const isDimmed = selectedTileId && selectedTileId !== tile.id;

          return (
            <Col xs={24} sm={12} md={8} lg={6} xl={4} key={tile.id}>
              <div
                onClick={() => handleTileClick(tile.id)}
                style={{ cursor: "pointer" }}
              >
                <MetricTile
                  label={tile.label}
                  actual={tileResult?.overall_actual ?? null}
                  planned={tileResult?.overall_forecast ?? null}
                  value={tileResult?.percentage ?? null}
                  isPercent
                  isActive={isActive}
                  isDimmed={isDimmed}
                  createdAt={tileResult?.created_at}
                />
              </div>
            </Col>
          );
        })}
      </Row>

      {/* =========================
          TABLE (ONLY WHEN TILE SELECTED)
         ========================= */}
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

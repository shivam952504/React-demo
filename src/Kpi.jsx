import { useEffect, useMemo, useState } from "react";
import { Row, Col, Table } from "antd";
import MetricTile from "./MetricTile";
import LoaderOverlay from "../loader/LoaderOverlay";
import { apiClient } from "../../auth/apiClient";

/**
 * Tile config
 * MUST match backend tile.title EXACTLY
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
  const [rawKpiData, setRawKpiData] = useState(null);
  const [kpiDataByTile, setKpiDataByTile] = useState({});
  const [selectedTileId, setSelectedTileId] = useState(null);

  /* ---------------------------------------------
     NORMALIZE JOB FILTER
  --------------------------------------------- */
  const normalizedJobCodes = useMemo(() => {
    if (!jobCodes || jobCodes.length === 0) return ["ALL"];
    if (jobCodes.includes("ALL")) return ["ALL"];
    return jobCodes;
  }, [jobCodes]);

  /* ---------------------------------------------
     FETCH KPI DATA — ONLY ONCE
  --------------------------------------------- */
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
              job: ["ALL"], // ALWAYS ALL — filter happens locally
              user_id: "",
            }),
          }
        );

        const json = await res.json();
        const result = json?.result;

        if (!result || typeof result !== "object") {
          throw new Error("Invalid KPI response");
        }

        if (cancelled) return;

        setRawKpiData(result);

        /* Map by tile title */
        const mapped = {};
        Object.values(result).forEach((block) => {
          if (block?.tile?.title) {
            mapped[block.tile.title] = block;
          }
        });

        setKpiDataByTile(mapped);
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
  }, []); // 👈 NO jobCodes here

  /* ---------------------------------------------
     HANDLE TILE CLICK
  --------------------------------------------- */
  const handleTileClick = (tileId) => {
    setSelectedTileId((prev) => (prev === tileId ? null : tileId));
  };

  /* ---------------------------------------------
     FILTER TABLE ROWS (CLIENT SIDE)
  --------------------------------------------- */
  const filteredRows = useMemo(() => {
    if (!selectedTileId) return [];

    const rows = kpiDataByTile[selectedTileId]?.table?.rows || [];

    if (normalizedJobCodes.includes("ALL")) return rows;

    return rows.filter((row) =>
      normalizedJobCodes.includes(String(row.job_code))
    );
  }, [selectedTileId, normalizedJobCodes, kpiDataByTile]);

  /* ---------------------------------------------
     TABLE COLUMNS
  --------------------------------------------- */
  const tableColumns = useMemo(() => {
    if (!selectedTileId) return [];

    const cols =
      kpiDataByTile[selectedTileId]?.table?.columns || [];

    return cols.map((col) => ({
      title: col.label,
      dataIndex: col.key,
      key: col.key,
    }));
  }, [selectedTileId, kpiDataByTile]);

  /* ---------------------------------------------
     RENDER
  --------------------------------------------- */
  return (
    <>
      <LoaderOverlay show={loading} />

      {/* KPI Tiles */}
      <Row gutter={[20, 20]}>
        {KPI_TILES.map((tile) => {
          const tileResult = kpiDataByTile[tile.id];
          const isActive = selectedTileId === tile.id;
          const isDimmed = selectedTileId && !isActive;

          return (
            <Col
              key={tile.id}
              xs={24}
              sm={12}
              md={8}
              lg={6}
              xl={4}
              onClick={() => handleTileClick(tile.id)}
              style={{ cursor: "pointer" }}
            >
              <MetricTile
                label={tile.label}
                overall_actual={tileResult?.tile?.overall_actual ?? null}
                overall_forecast={tileResult?.tile?.overall_forecast ?? null}
                value={
                  tileResult?.tile?.percentage ??
                  tileResult?.tile?.overall ??
                  null
                }
                isPercent={tile.id !== "Production Hours"}
                isActive={isActive}
                isDimmed={isDimmed}
                createdAt={tileResult?.tile?.created_at}
                minHeight={185}
              />
            </Col>
          );
        })}
      </Row>

      {/* KPI Table */}
      {selectedTileId && filteredRows.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Table
            loading={loading}
            columns={tableColumns}
            dataSource={filteredRows}
            rowKey={(row, idx) => `${row.job_code}-${idx}`}
            pagination={false}
          />
        </div>
      )}
    </>
  );
}

export default KPI;

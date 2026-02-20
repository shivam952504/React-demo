import { useEffect, useMemo, useState } from "react";
import { Row, Col, Table, Select } from "antd";
import MetricTile from "../../MetricTile";
import LoaderOverlay from "../../loader/LoaderOverlay";
import { apiClient } from "../../../auth/apiClient";
import { useOutletContext } from "react-router-dom";

/**
 * KPI tiles config
 * id MUST match backend tile.title exactly
 */
const KPI_TILES = [
  { id: "Production Hours", label: "Production Hours" },
  { id: "AHT (in seconds)", label: "AHT" },
  { id: "Adherence", label: "Adherence" },
  { id: "Combined Quality Metrics", label: "Combined Quality Metrics" },
  { id: "CSAT Metrics", label: "CSAT Metrics" }
];

function KPI() {
  const [loading, setLoading] = useState(false);
  const [selectedTileId, setSelectedTileId] = useState(null);
  const [kpiDataByTile, setKpiDataByTile] = useState({});

  const { jobCodes } = useOutletContext();

  /* ---------------- Normalize job codes ---------------- */
  const normalizedJobCodes = useMemo(() => {
    if (!jobCodes || jobCodes.length === 0) return ["ALL"];
    if (jobCodes.includes("ALL")) return ["ALL"];
    return jobCodes;
  }, [jobCodes]);

  const jobKey = useMemo(
    () => normalizedJobCodes.slice().sort().join(","),
    [normalizedJobCodes]
  );

  /* ---------------- NEW FILTER STATES ---------------- */
  const [selectedLOB, setSelectedLOB] = useState("ALL");
  const [selectedFilter2, setSelectedFilter2] = useState("ALL");

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
              user_id: ""
            })
          }
        );

        const json = await res.json();
        const result = json?.result;

        if (!result || typeof result !== "object") {
          throw new Error("Invalid KPI response");
        }

        const mapped = {};
        Object.values(result).forEach(block => {
          if (block?.tile?.title) {
            mapped[block.tile.title] = block;
          }
        });

        if (!cancelled) {
          setKpiDataByTile(mapped);
          setSelectedTileId(null);
          setSelectedLOB("ALL");
          setSelectedFilter2("ALL");
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
  }, [jobKey]);

  /* ---------------- Tile click ---------------- */
  const handleTileClick = tileId => {
    setSelectedTileId(prev => (prev === tileId ? null : tileId));
    setSelectedLOB("ALL");
    setSelectedFilter2("ALL");
  };

  /* ---------------- Table Columns ---------------- */
  let tableColumns = [];

  if (selectedTileId) {
    const tile = kpiDataByTile[selectedTileId];
    const cols = tile?.table?.columns || [];
    const rows = tile?.table?.rows || [];

    tableColumns = cols.map(col => {
      let dataIndex = col.key;

      if (
        rows.length > 0 &&
        rows[0][col.key] === undefined &&
        rows[0].value !== undefined
      ) {
        dataIndex = "value";
      }

      return {
        title: col.label,
        dataIndex,
        key: col.key,
        align: "center"
      };
    });
  }

  /* ---------------- LOB Options ---------------- */
  const lobOptions = useMemo(() => {
    if (!selectedTileId) return [];

    const rows = kpiDataByTile[selectedTileId]?.table?.rows || [];
    const unique = [...new Set(rows.map(r => r.lob).filter(Boolean))];

    return ["ALL", ...unique];
  }, [selectedTileId, kpiDataByTile]);

  /* ---------------- Filtered Rows ---------------- */
  const filteredRows = useMemo(() => {
    if (!selectedTileId) return [];

    let rows = kpiDataByTile[selectedTileId]?.table?.rows || [];

    if (jobCodes && !jobCodes.includes("ALL")) {
      rows = rows.filter(row =>
        jobCodes.includes(String(row.job_code))
      );
    }

    if (selectedLOB !== "ALL") {
      rows = rows.filter(row => row.lob === selectedLOB);
    }

    if (selectedFilter2 !== "ALL") {
      rows = rows.filter(row => row.some_field === selectedFilter2);
    }

    return rows;

  }, [selectedTileId, kpiDataByTile, jobCodes, selectedLOB, selectedFilter2]);

  /* ---------------- Render ---------------- */
  return (
    <>
      <LoaderOverlay show={loading} />

      {/* KPI Tiles */}
      <Row gutter={[12, 12]} style={{ display: "flex", flexWrap: "wrap" }}>
        {KPI_TILES.map(tile => {
          const tileResult = kpiDataByTile[tile.id]?.tile;
          const isActive = selectedTileId === tile.id;
          const isDimmed = selectedTileId && selectedTileId !== tile.id;

          return (
            <Col key={tile.id}>
              <MetricTile
                label={tile.label}
                overall_actual={tileResult?.overall_actual ?? null}
                overall_forecast={tileResult?.overall_forecast ?? null}
                value={
                  tileResult?.percent ??
                  tileResult?.overall ??
                  null
                }
                unit={tileResult?.unit || ""}
                color={tileResult?.color}
                isPercent={tileResult?.is_percent}
                isActive={isActive}
                isDimmed={isDimmed}
                createdAt={tileResult?.created_at}
                minHeight={185}
                onClick={() => handleTileClick(tile.id)}
              />
            </Col>
          );
        })}
      </Row>

      {/* ===== FILTER SECTION ===== */}
      {selectedTileId && (
        <div
          style={{
            marginTop: 20,
            marginBottom: 16,
            display: "flex",
            gap: 16,
            flexWrap: "wrap"
          }}
        >
          <Select
            value={selectedLOB}
            onChange={value => setSelectedLOB(value)}
            style={{ width: 200 }}
            options={lobOptions.map(lob => ({
              label: lob,
              value: lob
            }))}
            placeholder="Select LOB"
          />

          <Select
            value={selectedFilter2}
            onChange={value => setSelectedFilter2(value)}
            style={{ width: 200 }}
            options={[{ label: "ALL", value: "ALL" }]}
            placeholder="Second Filter"
          />
        </div>
      )}

      {/* KPI Table */}
      {selectedTileId &&
        kpiDataByTile[selectedTileId]?.table?.rows && (
          <div style={{ marginTop: 24 }}>
            <Table
              bordered
              loading={loading}
              columns={tableColumns}
              dataSource={filteredRows}
              rowKey={(row, index) => index}
              pagination={false}
            />
          </div>
        )}
    </>
  );
}

export default KPI;

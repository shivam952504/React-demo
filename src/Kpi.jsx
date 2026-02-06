const [selectedTileId, setSelectedTileId] = useState(null);
const [kpiTileData, setKpiTileData] = useState(null);
const [kpiTableData, setKpiTableData] = useState(null);
const [loading, setLoading] = useState(false);

const handleTileClick = async (tileId) => {
  if (selectedTileId === tileId) {
    setSelectedTileId(null);
    setKpiTileData(null);
    setKpiTableData(null);
    return;
  }

  setSelectedTileId(tileId);
  setLoading(true);

  try {
    const res = await apiClient(
      `/api/client/concora/KPI`,
      {
        method: "POST",
        body: JSON.stringify({ tile: tileId })
      }
    );

    const json = await res.json();
    setKpiTileData(json.result.tile);
    setKpiTableData(json.result.table);
  } finally {
    setLoading(false);
  }
};

<Row gutter={[20, 20]}>
  {KPI_TILES.map((tile) => {
    const isActive = selectedTileId === tile.id;
    const isDimmed = selectedTileId && selectedTileId !== tile.id;

    return (
      <Col xs={24} sm={12} md={8} lg={6} xl={4} key={tile.id}>
        <div onClick={() => handleTileClick(tile.id)}>
          <MetricTile
            label={tile.label}
            actual={isActive ? kpiTileData?.overall_actual : null}
            planned={isActive ? kpiTileData?.overall_forecast : null}
            value={isActive ? kpiTileData?.percentage : null}
            isPercent
            isActive={isActive}
            isDimmed={isDimmed}
          />
        </div>
      </Col>
    );
  })}
</Row>

const tableColumns =
  kpiTableData?.columns?.map((col) => ({
    title: col.label,
    dataIndex: col.key,
    key: col.key,
  })) || [];

{selectedTileId && kpiTableData && (
  <div style={{ marginTop: 24 }}>
    <Table
      loading={loading}
      columns={tableColumns}
      dataSource={kpiTableData.rows}
      rowKey={(row, index) => index}
      pagination={false}
    />
  </div>
)}

let tableColumns = [];

if (selectedTileId) {
  const cols = kpiDataByTile[selectedTileId]?.table?.columns || [];

  tableColumns = cols.map((col) => {
    // 🔑 FIX: AHT & similar tiles use "value" instead of "actual"
    const dataKey =
      col.key === "actual" &&
      kpiDataByTile[selectedTileId]?.tile?.label?.includes("AHT")
        ? "value"
        : col.key;

    return {
      title: col.label,
      dataIndex: dataKey,
      key: col.key,
    };
  });
}

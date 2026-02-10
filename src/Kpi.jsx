let tableColumns = [];

if (selectedTileId) {
  const tile = kpiDataByTile[selectedTileId];
  const cols = tile?.table?.columns || [];
  const rows = tile?.table?.rows || [];

  tableColumns = cols.map((col) => {
    let dataIndex = col.key;

    // 🔥 CORE FIX
    // If row does NOT have col.key but HAS "value", use "value"
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
    };
  });
}

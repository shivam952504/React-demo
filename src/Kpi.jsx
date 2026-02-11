const filteredRows = useMemo(() => {
  if (!selectedTileId) return [];

  const rows = kpiDataByTile[selectedTileId]?.table?.rows || [];

  if (!jobCodes || jobCodes.includes("ALL")) {
    return rows;
  }

  return rows.filter(row =>
    jobCodes.includes(String(row.job_code))
  );
}, [selectedTileId, kpiDataByTile, jobCodes]);

dataSource={filteredRows}

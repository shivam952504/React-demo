const filteredRows = (() => {
  const rows = kpiDataByTile[selectedTileId]?.table?.rows || [];

  if (!jobCodes || jobCodes.includes("ALL")) {
    return rows; // show everything
  }

  return rows.filter((row) =>
    jobCodes.includes(String(row.job_code))
  );
})();

<Table
  loading={loading}
  columns={tableColumns}
  dataSource={filteredRows}   // ✅ USE FILTERED
  rowKey={(row) => row.job_code}
/>


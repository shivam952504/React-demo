const filteredTableData =
  selectedCategory === "ALL"
    ? allClientTableData
    : allClientTableData
        .filter(row =>
          row.metrics?.some(m => m.category === selectedCategory)
        )
        .map(row => ({
          ...row,
          metrics: row.metrics.filter(
            m => m.category === selectedCategory
          )
        }));

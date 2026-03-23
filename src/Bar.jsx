const safeParse = (val) => {
  if (val === null || val === undefined) return null;
  if (val === "NaN") return null;

  const num = parseFloat(String(val).replace("%", ""));
  return isNaN(num) ? null : num;
};

const series = finalGraphDates
  .map(d => {
    const row = chartDataMap[d];
    if (!row) return null;

    if (title === "AHT (CS)") return safeParse(row?.AHT);

    if (title === "CSAT (CS)") 
      return safeParse(row?.CSAT?.csat_score);

    if (title === "CASE QUALITY") 
      return safeParse(row?.case_quality?.overall_percentage);

    if (title === "ADHERENCE") 
      return safeParse(row?.Adherence);

    if (title === "PRODUCTION HOURS") 
      return safeParse(row?.ProductionHours);

    return null;
  })
  .filter(v => v !== null);


const hasGraph = series.length > 0;

if (!hasGraph) {
  return <div style={{ fontSize: 12, color: "#999" }}>No Data</div>;
}




const graphDates = chartDates.filter(d => {
  const row = chartDataMap[d];
  if (!row) return false;

  return (
    row.AHT !== undefined ||
    row.Adherence !== undefined ||
    row.ProductionHours !== undefined ||
    row?.CSAT?.csat_score ||
    row?.case_quality !== undefined
  );
});

// apply limit only for week/month
const finalGraphDates =
  viewBy === "day" ? graphDates : graphDates.slice(-limit);

const series = finalGraphDates.map(...)


{finalGraphDates.map((d,i)=>(
  <span
    key={d}
    style={{flex:1,textAlign:"center", fontSize:9, whiteSpace:"nowrap"}}
  >
    {viewBy==="day"
      ? i === Math.floor(finalGraphDates.length / 2)
        ? new Date(d).toLocaleDateString("en",{month:"short"})
        : ""
      : viewBy==="week"
      ? `W${i+1}`
      : d}
  </span>
))}

width: viewBy==="day" ? 3 : viewBy==="month" ? 5 : 8





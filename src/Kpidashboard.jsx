{graphDates.map((d,i)=>(
  <span key={d} style={{flex:1,textAlign:"center", fontSize:9, whiteSpace:"nowrap"}}>
    
    {viewBy === "day" &&
      new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short"
      })
    }

    {viewBy === "week" && `W${i+1}`}

    {viewBy === "month" && (
      typeof d === "string" && d.length <= 3
        ? d // already "Jan", "Feb"
        : isNaN(new Date(d))
          ? d // fallback (January, Feb etc)
          : new Date(d).toLocaleDateString("en-IN", { month: "short" })
    )}

  </span>
))}

const graphDates = chartDates
  .filter(d => {
    const row = chartDataMap[d];
    if (!row) return false;

    // check if any metric has value
    return (
      row.AHT > 0 ||
      row.Adherence > 0 ||
      row.ProductionHours > 0 ||
      row?.CSAT?.overall ||
      row?.CallQuality?.case_quality?.overall_percentage
    );
  })
  .slice(-limit);


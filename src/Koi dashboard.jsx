{graphDates.map((d,i)=>(
  <span key={d} style={{flex:1,textAlign:"center", fontSize:9, whiteSpace:"nowrap"}}>
    
    {/* DAY → show actual date */}
    {viewBy === "day" &&
      new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short"
      })
    }

    {/* WEEK → keep week */}
    {viewBy === "week" && `W${i+1}`}

    {/* MONTH → show Jan Feb Mar */}
    {viewBy === "month" &&
      new Date(d).toLocaleDateString("en-IN", {
        month: "short"
      })
    }

  </span>
))}

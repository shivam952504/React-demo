const CoraChart = ({ chart }) => {
  if (!chart?.xAxis?.data || !chart?.yAxis?.data) return null;
  const max = Math.max(...chart.yAxis.data);

  return (
    <div style={{ marginTop:10, background:"rgba(99,102,241,0.08)", 
      borderRadius:10, padding:"12px 8px" }}>
      
      {/* VALUES + BARS */}
      <div style={{ display:"flex", alignItems:"flex-end", gap:6, 
        height:120, padding:"0 4px" }}>
        {chart.xAxis.data.map((label, i) => (
          <div key={i} style={{ flex:1, display:"flex", 
            flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{ fontSize:10, color:"#c4b5fd", fontWeight:600 }}>
              {chart.yAxis.data[i]}
            </div>
            <div style={{
              width:"100%",
              height: `${(chart.yAxis.data[i] / max) * 90}px`,
              background:"#6366f1",
              borderRadius:"3px 3px 0 0",
              minHeight:4
            }}/>
            {/* BIGGER X-AXIS LABELS */}
            <div style={{ 
              fontSize:11,        // ← increased from 8
              color:"#94a3b8", 
              textAlign:"center",
              writingMode:"vertical-rl", 
              height:50,          // ← slightly taller
              overflow:"hidden" 
            }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* TITLE MOVED TO BOTTOM */}
      <div style={{ fontSize:11, fontWeight:600, color:"#a5b4fc", 
        textAlign:"center", marginTop:10 }}>
        {chart.title}
      </div>

    </div>
  );
};

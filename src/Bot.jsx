// REPLACE this:
setMessages(p => p.map(m => m.id === botId 
  ? { ...m, text: partial } : m
));

// WITH this:
setMessages(p => p.map(m => m.id === botId 
  ? { ...m, text: partial, chart: m.chart } : m  // ✅ preserve chart
));


const CoraChart = ({ chart }) => {
  if (!chart?.xAxis?.data || !chart?.yAxis?.data) return null;
  const max = Math.max(...chart.yAxis.data);
  const barColor = "#6366f1";
  return (
    <div style={{ marginTop:10, background:"rgba(99,102,241,0.08)", 
      borderRadius:10, padding:"12px 8px" }}>
      <div style={{ fontSize:11, fontWeight:600, color:"#a5b4fc", 
        textAlign:"center", marginBottom:8 }}>{chart.title}</div>
      <div style={{ display:"flex", alignItems:"flex-end", gap:6, 
        height:120, padding:"0 4px" }}>
        {chart.xAxis.data.map((label, i) => (
          <div key={i} style={{ flex:1, display:"flex", 
            flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{ fontSize:9, color:"#94a3b8" }}>
              {chart.yAxis.data[i]}
            </div>
            <div style={{
              width:"100%",
              height: `${(chart.yAxis.data[i] / max) * 90}px`,
              background: barColor,
              borderRadius:"3px 3px 0 0",
              minHeight:4
            }}/>
            <div style={{ fontSize:8, color:"#94a3b8", textAlign:"center",
              writingMode:"vertical-rl", height:40, overflow:"hidden" }}>
              {label}
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize:9, color:"#6366f1", textAlign:"center", 
        marginTop:4 }}>{chart.yAxis.label}</div>
    </div>
  );
};



      {msg.text}
    </ReactMarkdown>
    {isStreaming && <Cursor/>}
  </div>

  {/* ADD THIS LINE ↓ */}
  {msg.chart && <CoraChart chart={msg.chart} />}

))  {/* rest of your JSX */}






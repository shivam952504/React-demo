// REMOVE this entire wrapper with background:
return (
  <div id="cora-widget" style={{width:"100%",height:"100vh",background:"#070d1a",...}}>
    <style>...</style>
    <div style={{position:"absolute",top:"20%",...}}/> {/* ← remove ambient glow */}
    
    {/* Background mockup — REMOVE this entire block */}
    <div style={{flex:1,display:"flex",...}}>
      <div>YOUR APP CONTENT HERE</div>
      ...
    </div>

// REPLACE with just this — no background, no mockup:
return (
  <div id="cora-widget">
    <style>{`
      @keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:0.4}40%{transform:translateY(-6px);opacity:1}}
      @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      @keyframes popIn{0%{transform:scale(0.85);opacity:0}70%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes slideFromRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
      @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
      #cora-widget table{border-collapse:collapse!important;width:100%!important;margin:8px 0!important;font-size:12px!important;display:table!important;}
      #cora-widget th{padding:6px 10px!important;background:rgba(99,102,241,0.3)!important;color:#e2e8f0!important;text-align:left!important;border-bottom:1px solid rgba(99,102,241,0.3)!important;font-size:11px!important;font-weight:600!important;display:table-cell!important;}
      #cora-widget td{padding:6px 10px!important;border-bottom:1px solid rgba(99,102,241,0.1)!important;color:#cbd5e1!important;font-size:12px!important;display:table-cell!important;}
      #cora-widget tr{display:table-row!important;}
      #cora-widget thead{display:table-header-group!important;}
      #cora-widget tbody{display:table-row-group!important;}
      #cora-widget ul{padding-left:18px!important;margin:6px 0!important;list-style:disc!important;}
      #cora-widget li{display:list-item!important;margin-bottom:4px!important;color:#e2e8f0!important;}
      #cora-widget strong{font-weight:700!important;color:#a5b4fc!important;}
      #cora-widget p{margin:4px 0!important;line-height:1.65!important;}
      #cora-widget svg{display:inline-block!important;visibility:visible!important;}
    `}</style>

    {/* FAB */}
    {!open && (
      <button onClick={...}>...</button>
    )}

    {/* POPUP */}
    {open && mode==="popup" && (
      <div style={{position:"fixed",...}}>...</div>
    )}

    {/* SIDEBAR */}
    {open && mode==="sidebar" && (
      <div style={{position:"fixed",...}}>...</div>
    )}

    {/* FULLSCREEN */}
    {open && mode==="fullscreen" && (
      <div style={{position:"fixed",...}}>...</div>
    )}
  </div>
);


    // Paste your exact backend JSON responses here:
const STATIC_RESPONSES = {
  "Which agents have the highest AHT today?": {
    "query": "Which agents have the highest AHT today?",
    "type": "ranking",
    "summary": "The top 5 agents with the highest AHT today are Catherine Ruiz, Hazel Grace Zurchito, Warren Medina, Katrina Mae Ghian Sevilla, and Leo Evangelio.",
    "table": {
      "columns": ["Rank", "Agent Name", "AHT"],
      "rows": [[1,"Catherine Ruiz",11440],[2,"Hazel Grace Zurchito",11334],[3,"Warren Medina",11189],[4,"Katrina Mae Ghian Sevilla",11119],[5,"Leo Evangelio",10848]]
    },
    "insights": ["Catherine Ruiz leads with the highest AHT today","The variation between top 5 agents is minimal, indicating balanced distribution","No extreme outliers observed in AHT values"]
  },

  "How many agents are out of adherence right now?": {
    "query": "How many agents are out of adherence right now?",
    "type": "alert",
    "summary": "A total of 127 agents are currently out of adherence (below 93%). This indicates a widespread adherence gap that may require immediate attention.",
    "table": {
      "columns": ["Agent Name", "Adherence"],
      "rows": [["Rochelle Cruz","68.43%"],["Perlita de Leon","74.12%"],["Euben Ferrera Jr.","82.94%"],["Amirah Alay-ay","83.14%"],["Cezmark Pineda","84.12%"],["Mary Rose Rosario Fernandez","86.00%"],["Imelda Lata","86.47%"],["Warren Medina","87.84%"],["Showie Manansala","89.41%"],["Charlene Chao","89.80%"]]
    },
    "insights": ["127 agents are below the adherence threshold of 93%","The lowest adherence observed is 68.43%","Most underperforming agents fall between 80%-90%"]
  },

  "Which segments (30+, 60+, 90+) are underperforming?": {
    "query": "Which segments (30+, 60+, 90+) are underperforming?",
    "type": "segment_analysis",
    "summary": "No tenure segments are currently underperforming. The 61-90 and 90+ segments have sufficient data and are performing above the 93% threshold.",
    "table": {
      "columns": ["Segment", "Avg Adherence", "Agent Count", "Status"],
      "rows": [["0-30","No data",0,"No data"],["31-60","No data",0,"No data"],["61-90","96%","—","On track"],["90+","94%",123,"On track"]]
    },
    "insights": ["No agents fall within the 0-60 day tenure segments","Both active segments (61-90 and 90+) are performing above the 93% threshold","The 90+ segment has slightly lower adherence compared to 61-90 but remains within acceptable limits"]
  },
};

const formatJSONResponse = (data) => {
  let text = "";

  // Summary
  if (data.summary) text += `${data.summary}\n\n`;

  // Table
  if (data.table) {
    const { columns, rows } = data.table;
    text += "| " + columns.join(" | ") + " |\n";
    text += "| " + columns.map(() => "---").join(" | ") + " |\n";
    rows.forEach(row => {
      text += "| " + row.join(" | ") + " |\n";
    });
    text += "\n";
  }

  // Insights
  if (data.insights && data.insights.length > 0) {
    text += "**Insights:**\n";
    data.insights.forEach(insight => {
      text += `- ${insight}\n`;
    });
  }

  return text;
};

const getStaticResponse = (query) => {
  const data = STATIC_RESPONSES[query];
  if (data) return formatJSONResponse(data);

  // fuzzy match
  const key = Object.keys(STATIC_RESPONSES).find(k =>
    query.toLowerCase().includes(k.toLowerCase().split(" ").slice(0,3).join(" "))
  );
  return key
    ? formatJSONResponse(STATIC_RESPONSES[key])
    : "I can answer questions about AHT, adherence, and tenure segments. Please use the suggestion chips below.";
};


    
    

    

const callCORAApi = async (query) => {
  const payload = {
    query,
    user_id: "user_001",
    ...(currentSessionId && { session_id: currentSessionId }),
  };

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  
  const data = await res.json();
  
  if (data.session_id) currentSessionId = data.session_id;

  // ── Handle both response types ──
  // Type 1: simple { response: "text" }
  if (data.response && typeof data.response === "string") {
    return { text: data.response, chart: null };
  }

  // Type 2: rich JSON { summary, table, chart, insights }
  return formatJSONResponse(data);
};


// FIND:
if (USE_REAL_API) {
  fullText = await callCORAApi(text);
} else {
  await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
  const result = getStaticResponse(text);
  fullText = result.text;
  chartData = result.chart;
}

// REPLACE with:
if (USE_REAL_API) {
  const result = await callCORAApi(text);  // now returns { text, chart }
  fullText = result.text;
  chartData = result.chart;
} else {
  await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
  const result = getStaticResponse(text);
  fullText = result.text;
  chartData = result.chart;
}




const formatJSONResponse = (data) => {
  let text = "";
  let chart = null;

  // Summary
  if (data.summary) text += `${data.summary}\n\n`;

  // Table
  if (data.table && data.table.columns && data.table.rows) {
    const { columns, rows } = data.table;
    text += "| " + columns.join(" | ") + " |\n";
    text += "| " + columns.map(() => "---").join(" | ") + " |\n";
    rows.forEach(row => {
      // Handle both array rows and object rows safely
      const rowData = Array.isArray(row) ? row : Object.values(row);
      text += "| " + rowData.join(" | ") + " |\n";
    });
    text += "\n";
  }

  // Insights
  if (data.insights && Array.isArray(data.insights) && data.insights.length > 0) {
    text += "**Insights:**\n";
    data.insights.forEach(insight => {
      text += `- ${insight}\n`;
    });
  }

  // Chart
  if (data.chart) chart = data.chart;

  return { text, chart };
};



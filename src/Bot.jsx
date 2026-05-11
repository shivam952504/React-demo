try {
  let fullText;
  let chartData = null;

  if (USE_REAL_API) {
    // Add this logging:
    console.log("Calling API...");
    const raw = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        query: text,
        user_id: "user_001",
        ...(currentSessionId && { session_id: currentSessionId }),
      }),
    });

    console.log("Status:", raw.status);
    const data = await raw.json();
    console.log("Raw response:", JSON.stringify(data)); // ← shows exact structure

    if (data.session_id) currentSessionId = data.session_id;

    const result = formatJSONResponse(data);
    console.log("Formatted result:", result); // ← shows if formatting worked

    fullText = result.text;
    chartData = result.chart;

  } else {
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
    const result = getStaticResponse(text);
    fullText = result.text;
    chartData = result.chart;
  }

  // Add this check:
  if (!fullText || fullText.trim() === "") {
    console.log("Empty text — using fallback");
    fullText = "Received response but could not format it.";
  }

  const botId = uid();
  const botMsg = {
    id: botId,
    role: "assistant",
    text: "",
    chart: chartData,
    timestamp: new Date(),
    liked: null,
  };

  setMessages(p => [...p, botMsg]);
  setLoading(false);
  setStreamingId(botId);

  streamIntervalRef.current = streamText(
    fullText,
    (partial) => {
      setMessages(p => p.map(m => m.id === botId ? {...m, text: partial} : m));
      bottomRef.current?.scrollIntoView({behavior:"smooth"});
    },
    () => {
      setStreamingId(null);
      if (!open || minimized) setUnread(u => u + 1);
    }
  );

} catch(e) {
  console.error("FULL ERROR:", e);       // ← shows exact error
  console.error("Error message:", e.message);
  console.error("Error stack:", e.stack);
  setLoading(false);
  setMessages(p => [...p, {
    id: uid(),
    role: "assistant",
    text: `Error: ${e.message}`, // ← show actual error in chat
    timestamp: new Date(),
    liked: null,
  }]);
}


// vite.config.js in KPI Dashboard project:
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8020',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})

// Session manager
let currentSessionId = null;

const callCORAApi = async (query) => {
  const payload = {
    query: query,
    user_id: "user_001", // swap with real user id later
    ...(currentSessionId && { session_id: currentSessionId }),
  };

  const res = await fetch("http://localhost:8020/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const data = await res.json();

  // Store session_id for all future messages
  if (data.session_id) {
    currentSessionId = data.session_id;
  }

  return {
    id: uid(),
    role: "assistant",
    text: data.response,
    timestamp: new Date(),
    liked: null,
  };
};


// Add this inside your App component, near the other handlers:
const resetChat = () => {
  currentSessionId = null;
  setMessages([{
    id: uid(),
    role: "assistant",
    text: "Hi! I'm CORA. How can I help you today? 👋",
    timestamp: new Date(),
    liked: null,
  }]);
};

// Then on your close button, call resetChat instead of just setOpen(false):
onClose: () => { setOpen(false); resetChat(); }



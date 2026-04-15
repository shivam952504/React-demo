import { useState, useRef, useEffect, useCallback } from “react”;

// ─── Inline styles (zero external deps, embeddable anywhere) ─────────────────
const FONT_URL =
“https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap”;

const injectFont = () => {
if (document.getElementById(“cw-font”)) return;
const link = document.createElement(“link”);
link.id = “cw-font”;
link.rel = “stylesheet”;
link.href = FONT_URL;
document.head.appendChild(link);
};

// ─── Tiny UUID ───────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);

// ─── Mock API — replace with real fetch calls ────────────────────────────────
const mockReply = async (text) => {
await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
return {
id: uid(),
role: “assistant”,
text: `This is a demo response to: "${text}". Connect your backend to replace this.`,
timestamp: new Date(),
liked: null,
};
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const Icon = {
Bot: () => (
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
<rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><line x1="12" y1="7" x2="12" y2="11" /><line x1="8" y1="15" x2="8" y2="17" /><line x1="16" y1="15" x2="16" y2="17" />
</svg>
),
Send: () => (
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
</svg>
),
Close: () => (
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
</svg>
),
Minus: () => (
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
<line x1="5" y1="12" x2="19" y2="12" />
</svg>
),
Expand: () => (
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
<polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
</svg>
),
Copy: () => (
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
<rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
</svg>
),
ThumbUp: ({ filled }) => (
<svg width=“13” height=“13” viewBox=“0 0 24 24” fill={filled ? “currentColor” : “none”} stroke=“currentColor” strokeWidth=“2” strokeLinecap=“round”>
<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" /><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
</svg>
),
ThumbDown: ({ filled }) => (
<svg width=“13” height=“13” viewBox=“0 0 24 24” fill={filled ? “currentColor” : “none”} stroke=“currentColor” strokeWidth=“2” strokeLinecap=“round”>
<path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" /><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
</svg>
),
Reply: () => (
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
<polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" />
</svg>
),
Refresh: () => (
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
<polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.45" />
</svg>
),
Check: () => (
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
<polyline points="20 6 9 17 4 12" />
</svg>
),
Sparkle: () => (
<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
<path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6L12 17.2 5.8 21.7l2.4-7.6L2 9.6h7.6z" />
</svg>
),
};

// ─── Typing indicator ─────────────────────────────────────────────────────────
const TypingDots = () => (

  <div style={s.typingWrap}>
    {[0, 1, 2].map((i) => (
      <span key={i} style={{ ...s.dot, animationDelay: `${i * 0.18}s` }} />
    ))}
  </div>
);

// ─── Suggestion chips ─────────────────────────────────────────────────────────
const SUGGESTIONS = [
“What can you help me with?”,
“Summarize my data”,
“Show me a report”,
“Help me analyze trends”,
];

// ─── Single message bubble ────────────────────────────────────────────────────
const MessageBubble = ({ msg, onLike, onDislike, onReply, onRetry, onCopy }) => {
const isUser = msg.role === “user”;
const [copied, setCopied] = useState(false);

const handleCopy = () => {
navigator.clipboard.writeText(msg.text).then(() => {
setCopied(true);
setTimeout(() => setCopied(false), 2000);
onCopy?.(msg);
});
};

const time = msg.timestamp
? msg.timestamp.toLocaleTimeString([], { hour: “2-digit”, minute: “2-digit” })
: “”;

return (
<div style={{ …s.msgRow, justifyContent: isUser ? “flex-end” : “flex-start” }}>
{!isUser && (
<div style={s.avatar}>
<Icon.Bot />
</div>
)}
<div style={{ maxWidth: “75%”, display: “flex”, flexDirection: “column”, alignItems: isUser ? “flex-end” : “flex-start” }}>
{/* Reply quote */}
{msg.replyTo && (
<div style={s.replyQuote}>
<span style={s.replyLabel}>Replying to</span>
<div style={s.replyText}>{msg.replyTo}</div>
</div>
)}

```
    <div style={isUser ? s.userBubble : s.botBubble}>
      <span style={s.bubbleText}>{msg.text}</span>
    </div>

    <div style={s.metaRow}>
      <span style={s.timeLabel}>{time}</span>

      {/* Action bar — only for bot messages */}
      {!isUser && (
        <div style={s.actionBar}>
          <button style={s.actionBtn} onClick={handleCopy} title="Copy">
            {copied ? <Icon.Check /> : <Icon.Copy />}
          </button>
          <button
            style={{ ...s.actionBtn, color: msg.liked === true ? "#6ee7b7" : undefined }}
            onClick={() => onLike(msg.id)}
            title="Like"
          >
            <Icon.ThumbUp filled={msg.liked === true} />
          </button>
          <button
            style={{ ...s.actionBtn, color: msg.liked === false ? "#fca5a5" : undefined }}
            onClick={() => onDislike(msg.id)}
            title="Dislike"
          >
            <Icon.ThumbDown filled={msg.liked === false} />
          </button>
          <button style={s.actionBtn} onClick={() => onReply(msg)} title="Reply">
            <Icon.Reply />
          </button>
          <button style={s.actionBtn} onClick={() => onRetry(msg)} title="Regenerate">
            <Icon.Refresh />
          </button>
        </div>
      )}
    </div>
  </div>
</div>
```

);
};

// ─── Main Widget ──────────────────────────────────────────────────────────────
export default function ChatbotWidget({
// Props for integration
title = “AI Assistant”,
subtitle = “Always here to help”,
primaryColor = “#6366f1”,
position = “bottom-right”, // bottom-right | bottom-left | inline
apiEndpoint = null,        // Pass your backend URL here
apiHeaders = {},           // Extra headers (auth token, etc.)
initialOpen = false,
onMessage = null,          // Callback (msg) => void
}) {
useEffect(() => { injectFont(); }, []);

const [open, setOpen] = useState(initialOpen);
const [minimized, setMinimized] = useState(false);
const [messages, setMessages] = useState([
{
id: uid(),
role: “assistant”,
text: “Hi! I’m your AI assistant. How can I help you today? 👋”,
timestamp: new Date(),
liked: null,
},
]);
const [input, setInput] = useState(””);
const [loading, setLoading] = useState(false);
const [replyTo, setReplyTo] = useState(null); // { id, text }
const [unread, setUnread] = useState(0);

const bottomRef = useRef(null);
const inputRef = useRef(null);
const messagesRef = useRef(null);

const accent = primaryColor;

// scroll to bottom
useEffect(() => {
if (open && !minimized) {
bottomRef.current?.scrollIntoView({ behavior: “smooth” });
}
}, [messages, open, minimized, loading]);

// focus input on open
useEffect(() => {
if (open && !minimized) {
setTimeout(() => inputRef.current?.focus(), 200);
setUnread(0);
}
}, [open, minimized]);

const sendMessage = useCallback(async (text) => {
if (!text.trim() || loading) return;

```
const userMsg = {
  id: uid(),
  role: "user",
  text: text.trim(),
  timestamp: new Date(),
  replyTo: replyTo?.text || null,
};

setMessages((prev) => [...prev, userMsg]);
setInput("");
setReplyTo(null);
setLoading(true);
onMessage?.(userMsg);

try {
  let botMsg;
  if (apiEndpoint) {
    const res = await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...apiHeaders },
      body: JSON.stringify({ message: text, replyTo: replyTo?.text }),
    });
    const data = await res.json();
    botMsg = {
      id: uid(),
      role: "assistant",
      text: data.reply || data.message || data.text || JSON.stringify(data),
      timestamp: new Date(),
      liked: null,
    };
  } else {
    botMsg = await mockReply(text);
  }
  setMessages((prev) => [...prev, botMsg]);
  if (!open || minimized) setUnread((u) => u + 1);
} catch (e) {
  setMessages((prev) => [
    ...prev,
    { id: uid(), role: "assistant", text: "Something went wrong. Please try again.", timestamp: new Date(), liked: null },
  ]);
} finally {
  setLoading(false);
}
```

}, [loading, replyTo, apiEndpoint, apiHeaders, open, minimized, onMessage]);

const handleKey = (e) => {
if (e.key === “Enter” && !e.shiftKey) {
e.preventDefault();
sendMessage(input);
}
};

const handleLike = (id) =>
setMessages((prev) =>
prev.map((m) => (m.id === id ? { …m, liked: m.liked === true ? null : true } : m))
);

const handleDislike = (id) =>
setMessages((prev) =>
prev.map((m) => (m.id === id ? { …m, liked: m.liked === false ? null : false } : m))
);

const handleReply = (msg) => {
setReplyTo({ id: msg.id, text: msg.text });
inputRef.current?.focus();
};

const handleRetry = (msg) => {
// Remove everything after the bot message being retried and resend the previous user message
const idx = messages.findIndex((m) => m.id === msg.id);
const prevUser = […messages].slice(0, idx).reverse().find((m) => m.role === “user”);
if (!prevUser) return;
setMessages((prev) => prev.slice(0, idx));
sendMessage(prevUser.text);
};

// Position styles
const posStyle =
position === “inline”
? { position: “relative”, width: “100%”, height: “100%” }
: position === “bottom-left”
? { position: “fixed”, bottom: 24, left: 24, zIndex: 99999 }
: { position: “fixed”, bottom: 24, right: 24, zIndex: 99999 };

return (
<div style={{ fontFamily: “‘DM Sans’, sans-serif”, …posStyle }}>
{/* ── FAB / Toggle button ── */}
{position !== “inline” && (
<button
style={{ …s.fab, background: accent, boxShadow: `0 8px 32px ${accent}55` }}
onClick={() => { setOpen((o) => !o); setMinimized(false); }}
aria-label=“Open chat”
>
{open ? <Icon.Close /> : <Icon.Bot />}
{!open && unread > 0 && (
<span style={s.badge}>{unread}</span>
)}
</button>
)}

```
  {/* ── Chat window ── */}
  {(open || position === "inline") && (
    <div
      style={{
        ...s.window,
        ...(position === "inline" ? s.windowInline : s.windowFloating),
        ...(minimized ? s.windowMinimized : {}),
        "--accent": accent,
      }}
    >
      {/* Header */}
      <div style={{ ...s.header, background: `linear-gradient(135deg, ${accent}ee, ${accent}bb)` }}>
        <div style={s.headerLeft}>
          <div style={s.botIcon}>
            <Icon.Bot />
            <span style={s.onlineDot} />
          </div>
          <div>
            <div style={s.headerTitle}>{title}</div>
            <div style={s.headerSub}>{subtitle}</div>
          </div>
        </div>
        <div style={s.headerActions}>
          {position !== "inline" && (
            <button style={s.iconBtn} onClick={() => setMinimized((m) => !m)} title={minimized ? "Expand" : "Minimize"}>
              {minimized ? <Icon.Expand /> : <Icon.Minus />}
            </button>
          )}
          {position !== "inline" && (
            <button style={s.iconBtn} onClick={() => setOpen(false)} title="Close">
              <Icon.Close />
            </button>
          )}
        </div>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div style={s.messagesArea} ref={messagesRef}>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                onLike={handleLike}
                onDislike={handleDislike}
                onReply={handleReply}
                onRetry={handleRetry}
                onCopy={() => {}}
              />
            ))}

            {loading && (
              <div style={{ ...s.msgRow, justifyContent: "flex-start" }}>
                <div style={s.avatar}><Icon.Bot /></div>
                <div style={s.botBubble}><TypingDots /></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions (only if no messages beyond initial) */}
          {messages.length <= 1 && (
            <div style={s.suggestions}>
              {SUGGESTIONS.map((s_) => (
                <button key={s_} style={s.chip} onClick={() => sendMessage(s_)}>
                  <Icon.Sparkle />
                  <span>{s_}</span>
                </button>
              ))}
            </div>
          )}

          {/* Reply preview */}
          {replyTo && (
            <div style={s.replyBar}>
              <div style={s.replyBarInner}>
                <Icon.Reply />
                <span style={s.replyBarText}>{replyTo.text.slice(0, 60)}{replyTo.text.length > 60 ? "…" : ""}</span>
              </div>
              <button style={s.replyBarClose} onClick={() => setReplyTo(null)}><Icon.Close /></button>
            </div>
          )}

          {/* Input */}
          <div style={s.inputArea}>
            <textarea
              ref={inputRef}
              style={s.textarea}
              rows={1}
              placeholder="Ask me anything…"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // auto grow
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKey}
              disabled={loading}
            />
            <button
              style={{
                ...s.sendBtn,
                background: input.trim() ? accent : "#334155",
                cursor: input.trim() ? "pointer" : "default",
              }}
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
            >
              <Icon.Send />
            </button>
          </div>

          {/* Footer */}
          <div style={s.footer}>
            Powered by <strong>AI Assistant</strong> · Press Enter to send
          </div>
        </>
      )}
    </div>
  )}

  {/* Keyframe injection */}
  <style>{`
    @keyframes cw-bounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
      40% { transform: translateY(-6px); opacity: 1; }
    }
    @keyframes cw-slide-up {
      from { opacity: 0; transform: translateY(16px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes cw-pop {
      0% { transform: scale(0.8); opacity: 0; }
      70% { transform: scale(1.05); }
      100% { transform: scale(1); opacity: 1; }
    }
    .cw-chip:hover { background: rgba(99,102,241,0.18) !important; border-color: rgba(99,102,241,0.4) !important; }
    .cw-action-btn:hover { background: rgba(255,255,255,0.1) !important; color: #e2e8f0 !important; }
    textarea::-webkit-scrollbar { width: 4px; }
    textarea::-webkit-scrollbar-track { background: transparent; }
    textarea::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
  `}</style>
</div>
```

);
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
fab: {
position: “relative”,
width: 56, height: 56,
borderRadius: “50%”,
border: “none”,
color: “#fff”,
cursor: “pointer”,
display: “flex”, alignItems: “center”, justifyContent: “center”,
transition: “transform 0.2s, box-shadow 0.2s”,
animation: “cw-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)”,
},
badge: {
position: “absolute”, top: 2, right: 2,
background: “#f43f5e”,
color: “#fff”,
fontSize: 10, fontWeight: 700,
width: 18, height: 18,
borderRadius: “50%”,
display: “flex”, alignItems: “center”, justifyContent: “center”,
border: “2px solid #0f172a”,
},
window: {
display: “flex”, flexDirection: “column”,
background: “#0f172a”,
border: “1px solid rgba(99,102,241,0.2)”,
borderRadius: 20,
overflow: “hidden”,
boxShadow: “0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)”,
transition: “all 0.35s cubic-bezier(0.34,1.56,0.64,1)”,
animation: “cw-slide-up 0.35s ease”,
},
windowFloating: {
position: “absolute”,
bottom: 72, right: 0,
width: 380,
height: 580,
},
windowInline: {
width: “100%”, height: “100%”,
position: “relative”,
borderRadius: 16,
},
windowMinimized: {
height: 64,
},
header: {
display: “flex”, alignItems: “center”, justifyContent: “space-between”,
padding: “14px 16px”,
flexShrink: 0,
},
headerLeft: {
display: “flex”, alignItems: “center”, gap: 10,
},
botIcon: {
position: “relative”,
width: 36, height: 36,
background: “rgba(255,255,255,0.15)”,
borderRadius: 10,
display: “flex”, alignItems: “center”, justifyContent: “center”,
color: “#fff”,
backdropFilter: “blur(4px)”,
},
onlineDot: {
position: “absolute”, bottom: 0, right: 0,
width: 9, height: 9,
background: “#4ade80”,
border: “2px solid rgba(99,102,241,0.8)”,
borderRadius: “50%”,
},
headerTitle: {
color: “#fff”,
fontSize: 14, fontWeight: 600,
letterSpacing: “0.01em”,
},
headerSub: {
color: “rgba(255,255,255,0.65)”,
fontSize: 11, fontWeight: 400,
marginTop: 1,
},
headerActions: {
display: “flex”, gap: 4,
},
iconBtn: {
background: “rgba(255,255,255,0.12)”,
border: “none”,
color: “#fff”,
width: 28, height: 28,
borderRadius: 8,
cursor: “pointer”,
display: “flex”, alignItems: “center”, justifyContent: “center”,
transition: “background 0.15s”,
},
messagesArea: {
flex: 1,
overflowY: “auto”,
padding: “16px 14px”,
display: “flex”, flexDirection: “column”, gap: 16,
scrollbarWidth: “thin”,
scrollbarColor: “#334155 transparent”,
},
msgRow: {
display: “flex”, alignItems: “flex-end”, gap: 8,
animation: “cw-slide-up 0.25s ease”,
},
avatar: {
width: 30, height: 30,
borderRadius: 9,
background: “linear-gradient(135deg, #6366f1, #8b5cf6)”,
display: “flex”, alignItems: “center”, justifyContent: “center”,
color: “#fff”,
flexShrink: 0,
fontSize: 14,
},
userBubble: {
background: “linear-gradient(135deg, #6366f1, #8b5cf6)”,
color: “#fff”,
borderRadius: “16px 16px 4px 16px”,
padding: “10px 14px”,
boxShadow: “0 4px 16px rgba(99,102,241,0.3)”,
},
botBubble: {
background: “#1e293b”,
border: “1px solid rgba(99,102,241,0.15)”,
color: “#e2e8f0”,
borderRadius: “16px 16px 16px 4px”,
padding: “10px 14px”,
},
bubbleText: {
fontSize: 13.5,
lineHeight: 1.6,
fontWeight: 400,
letterSpacing: “0.01em”,
whiteSpace: “pre-wrap”,
wordBreak: “break-word”,
},
metaRow: {
display: “flex”, alignItems: “center”, gap: 6, marginTop: 4,
flexWrap: “wrap”,
},
timeLabel: {
fontSize: 10, color: “#475569”,
fontFamily: “‘DM Mono’, monospace”,
},
actionBar: {
display: “flex”, gap: 2,
},
actionBtn: {
background: “transparent”,
border: “none”,
color: “#475569”,
cursor: “pointer”,
width: 22, height: 22,
borderRadius: 5,
display: “flex”, alignItems: “center”, justifyContent: “center”,
transition: “background 0.15s, color 0.15s”,
className: “cw-action-btn”,
},
replyQuote: {
background: “rgba(99,102,241,0.08)”,
border: “1px solid rgba(99,102,241,0.2)”,
borderLeft: “3px solid #6366f1”,
borderRadius: “6px 6px 0 0”,
padding: “6px 10px”,
marginBottom: -2,
maxWidth: “100%”,
},
replyLabel: {
fontSize: 10, color: “#6366f1”, fontWeight: 600, display: “block”, marginBottom: 2,
},
replyText: {
fontSize: 11.5, color: “#94a3b8”,
whiteSpace: “nowrap”, overflow: “hidden”, textOverflow: “ellipsis”,
maxWidth: 240,
},
suggestions: {
display: “flex”, flexWrap: “wrap”, gap: 6,
padding: “0 14px 10px”,
flexShrink: 0,
},
chip: {
display: “flex”, alignItems: “center”, gap: 5,
background: “rgba(99,102,241,0.08)”,
border: “1px solid rgba(99,102,241,0.2)”,
color: “#a5b4fc”,
borderRadius: 20,
padding: “5px 12px”,
fontSize: 12, fontWeight: 500,
cursor: “pointer”,
transition: “background 0.15s, border-color 0.15s”,
fontFamily: “‘DM Sans’, sans-serif”,
className: “cw-chip”,
},
replyBar: {
margin: “0 14px 6px”,
background: “rgba(99,102,241,0.08)”,
border: “1px solid rgba(99,102,241,0.2)”,
borderLeft: “3px solid #6366f1”,
borderRadius: 8,
padding: “6px 10px”,
display: “flex”, alignItems: “center”, justifyContent: “space-between”,
flexShrink: 0,
},
replyBarInner: {
display: “flex”, alignItems: “center”, gap: 6, color: “#94a3b8”,
},
replyBarText: {
fontSize: 12, color: “#94a3b8”,
},
replyBarClose: {
background: “transparent”, border: “none”, color: “#475569”,
cursor: “pointer”, display: “flex”, alignItems: “center”,
},
inputArea: {
display: “flex”, alignItems: “flex-end”, gap: 8,
padding: “10px 14px”,
borderTop: “1px solid rgba(99,102,241,0.1)”,
background: “#0f172a”,
flexShrink: 0,
},
textarea: {
flex: 1,
background: “#1e293b”,
border: “1px solid rgba(99,102,241,0.2)”,
borderRadius: 12,
color: “#e2e8f0”,
fontSize: 13.5,
padding: “9px 12px”,
resize: “none”,
outline: “none”,
fontFamily: “‘DM Sans’, sans-serif”,
lineHeight: 1.5,
transition: “border-color 0.15s”,
height: 40,
overflow: “hidden”,
},
sendBtn: {
width: 40, height: 40,
borderRadius: 12,
border: “none”,
color: “#fff”,
display: “flex”, alignItems: “center”, justifyContent: “center”,
transition: “background 0.2s, transform 0.15s”,
flexShrink: 0,
},
footer: {
textAlign: “center”,
fontSize: 10.5,
color: “#334155”,
padding: “6px 14px 10px”,
fontFamily: “‘DM Mono’, monospace”,
flexShrink: 0,
},
typingWrap: {
display: “flex”, gap: 4, alignItems: “center”, padding: “2px 0”,
},
dot: {
width: 7, height: 7,
borderRadius: “50%”,
background: “#6366f1”,
display: “inline-block”,
animation: “cw-bounce 1.2s infinite ease-in-out”,
},
};

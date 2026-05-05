import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from 'react-markdown';
import PERSONLOGO from "./assets/PERSONLOGO.PNG";

const uid = () => Math.random().toString(36).slice(2, 10);

let currentSessionId = null;

// ─── CONFIG: set to true for real API, false for static responses ─────────────
const USE_REAL_API = true;

// ─── Static responses (looks streamed, user can't tell) ───────────────────────
const STATIC_RESPONSES = [
  "The FY26 forecast revenue for the US is approximately **$93,080,613**, while the planned revenue is approximately **$77,450,685**.\n\n**Key Insight:** The forecast exceeds the plan by about **$15,629,928**, indicating a positive variance in expected revenue.",
  "Here are the **top 5 clients** based on FY25 revenue:\n\n| Client | Revenue |\n|--------|--------|\n| Client A | $12.4M |\n| Client B | $9.8M |\n| Client C | $8.2M |\n| Client D | $7.1M |\n| Client E | $6.5M |",
  "Based on the data available, **Q3 performance** showed:\n- Revenue up **12%** vs plan\n- Expenses under budget by **8%**\n- Net margin improved to **23.4%**",
];

// ─── Streaming effect helper ──────────────────────────────────────────────────
const streamText = (fullText, onChunk, onDone) => {
  let i = 0;
  // Stream character by character with slight randomness to feel natural
  const interval = setInterval(() => {
    if (i < fullText.length) {
      // Send 1-3 chars at a time randomly for natural feel
      const chunkSize = Math.floor(Math.random() * 3) + 1;
      i = Math.min(i + chunkSize, fullText.length);
      onChunk(fullText.slice(0, i));
    } else {
      clearInterval(interval);
      onDone();
    }
  }, 18); // speed of streaming — lower = faster
  return interval;
};

// ─── Real API call ────────────────────────────────────────────────────────────
const callCORAApi = async (query) => {
  const payload = {
    query,
    user_id: "user_001",
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
  if (data.session_id) currentSessionId = data.session_id;
  return data.response;
};

// ─── Static response picker ───────────────────────────────────────────────────
const getStaticResponse = () => {
  return STATIC_RESPONSES[Math.floor(Math.random() * STATIC_RESPONSES.length)];
};

const SUGGESTIONS = [
  "What is the FY26 forecast vs plan for US?",
  "Who are the top 5 clients based on FY25 revenue?",
];
const ACCENTS = ["#6366f1","#8b5cf6","#ec4899","#0ea5e9","#10b981","#f59e0b","#ef4444"];

// ─── Icons ────────────────────────────────────────────────────────────────────
const I = {
  Bot:()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="11"/><line x1="8" y1="15" x2="8" y2="17"/><line x1="16" y1="15" x2="16" y2="17"/></svg>,
  Send:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  X:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Minus:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Maximize:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>,
  Popup:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>,
  Sidebar:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>,
  Fullscreen:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="8 3 3 3 3 8"/><polyline points="21 8 21 3 16 3"/><polyline points="3 16 3 21 8 21"/><polyline points="16 21 21 21 21 16"/></svg>,
  Copy:()=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Check:()=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Up:({on})=><svg width="12" height="12" viewBox="0 0 24 24" fill={on?"currentColor":"none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>,
  Down:({on})=><svg width="12" height="12" viewBox="0 0 24 24" fill={on?"currentColor":"none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>,
  Reply:()=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>,
  Refresh:()=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.45"/></svg>,
  Palette:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
  Star:()=><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6L12 17.2 5.8 21.7l2.4-7.6L2 9.6h7.6z"/></svg>,
  Clear:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.45"/></svg>,
};

// ─── Typing cursor ────────────────────────────────────────────────────────────
const Cursor = () => (
  <span style={{
    display:"inline-block", width:2, height:"1em",
    background:"#6366f1", marginLeft:1, verticalAlign:"text-bottom",
    animation:"blink 0.7s infinite",
  }}/>
);

const Dots = () => (
  <div style={{display:"flex",gap:4,padding:"3px 0",alignItems:"center"}}>
    {[0,1,2].map(i=><span key={i} style={{width:7,height:7,borderRadius:"50%",background:"#6366f1",display:"inline-block",animation:"bounce 1.2s infinite ease-in-out",animationDelay:`${i*0.18}s`}}/>)}
  </div>
);

// ─── Message bubble ───────────────────────────────────────────────────────────
const Msg = ({ msg, onLike, onDislike, onReply, onRetry, accent, compact, isStreaming }) => {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);
  const time = msg.timestamp?.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
  const avatarSize = compact ? 26 : 30;
  const fontSize = compact ? 13 : 13.5;

  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:8,justifyContent:isUser?"flex-end":"flex-start",animation:"slideUp 0.22s ease"}}>
      {!isUser && (
        <div style={{width:avatarSize,height:avatarSize,borderRadius:8,overflow:"hidden",flexShrink:0,border:`1px solid ${accent}44`}}>
          <img src={PERSONLOGO} alt="CORA" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        </div>
      )}
      <div style={{maxWidth:"76%",display:"flex",flexDirection:"column",alignItems:isUser?"flex-end":"flex-start"}}>
        {msg.replyTo && (
          <div style={{background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.2)",borderLeft:`3px solid ${accent}`,borderRadius:"6px 6px 0 0",padding:"5px 10px",marginBottom:-2}}>
            <span style={{fontSize:9,color:accent,fontWeight:700,display:"block",marginBottom:2}}>REPLYING TO</span>
            <div style={{fontSize:11,color:"#94a3b8",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:240}}>{msg.replyTo}</div>
          </div>
        )}
        <div style={isUser
          ?{background:`linear-gradient(135deg,${accent},${accent}cc)`,color:"#fff",borderRadius:"14px 14px 3px 14px",padding:compact?"8px 12px":"10px 14px",boxShadow:`0 4px 16px ${accent}44`}
          :{background:"#1e293b",border:"1px solid rgba(99,102,241,0.15)",color:"#e2e8f0",borderRadius:"14px 14px 14px 3px",padding:compact?"8px 12px":"10px 14px"}
        }>
          {isUser ? (
            <span style={{fontSize,lineHeight:1.65,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{msg.text}</span>
          ) : (
            <div style={{fontSize,lineHeight:1.65,wordBreak:"break-word"}}>
              <ReactMarkdown
                components={{
                  p:({children})=><p style={{margin:"4px 0",fontSize,lineHeight:1.65,wordBreak:"break-word",textAlign:"left"}}>{children}</p>,
                  strong:({children})=><strong style={{fontWeight:700,color:"#a5b4fc",textAlign:"left"}}>{children}</strong>,
                  em:({children})=><em style={{fontStyle:"italic",opacity:0.85,textAlign:"left"}}>{children}</em>,
                  ul:({children})=><ul style={{paddingLeft:18,margin:"6px 0",textAlign:"left"}}>{children}</ul>,
                  ol:({children})=><ol style={{paddingLeft:18,margin:"6px 0",textAlign:"left"}}>{children}</ol>,
                  li:({children})=><li style={{fontSize,lineHeight:1.65,marginBottom:2}}>{children}</li>,
                  table:({children})=><div style={{overflowX:"auto",margin:"8px 0"}}><table style={{borderCollapse:"collapse",width:"100%",fontSize:12}}>{children}</table></div>,
                  th:({children})=><th style={{padding:"6px 10px",background:"rgba(99,102,241,0.3)",color:"#e2e8f0",textAlign:"left",borderBottom:"1px solid rgba(99,102,241,0.3)",fontSize:11,fontWeight:600}}>{children}</th>,
                  td:({children})=><td style={{padding:"6px 10px",borderBottom:"1px solid rgba(99,102,241,0.1)",color:"#cbd5e1",fontSize:12}}>{children}</td>,
                  code:({children})=><code style={{background:"rgba(0,0,0,0.3)",padding:"2px 6px",borderRadius:4,fontSize:12,fontFamily:"monospace",color:"#7dd3fc"}}>{children}</code>,
                  blockquote:({children})=><blockquote style={{borderLeft:"3px solid #6366f1",paddingLeft:10,margin:"6px 0",opacity:0.8}}>{children}</blockquote>,
                }}
              >
                {msg.text}
              </ReactMarkdown>
              {/* Blinking cursor while streaming */}
              {isStreaming && <Cursor/>}
            </div>
          )}
        </div>
        {!isStreaming && (
          <div style={{display:"flex",alignItems:"center",gap:4,marginTop:3,flexWrap:"wrap"}}>
            <span style={{fontSize:10,color:"#475569",fontFamily:"monospace"}}>{time}</span>
            {!isUser && (
              <div style={{display:"flex",gap:1}}>
                {[
                  {icon:<I.Copy/>,action:()=>{navigator.clipboard.writeText(msg.text);setCopied(true);setTimeout(()=>setCopied(false),2000)},alt:copied,altIcon:<I.Check/>,title:"Copy"},
                  {icon:<I.Up on={msg.liked===true}/>,action:()=>onLike(msg.id),col:msg.liked===true?"#4ade80":null,title:"Like"},
                  {icon:<I.Down on={msg.liked===false}/>,action:()=>onDislike(msg.id),col:msg.liked===false?"#f87171":null,title:"Dislike"},
                  {icon:<I.Reply/>,action:()=>onReply(msg),title:"Reply"},
                  {icon:<I.Refresh/>,action:()=>onRetry(msg),title:"Regenerate"},
                ].map((b,i)=>(
                  <button key={i} title={b.title} onClick={b.action} style={{background:"transparent",border:"none",cursor:"pointer",color:b.col||"#475569",width:22,height:22,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",transition:"color 0.15s"}}>
                    {b.alt&&b.altIcon?b.altIcon:b.icon}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Chat Panel ───────────────────────────────────────────────────────────────
const ChatPanel = ({ accent, messages, loading, input, setInput, onSend, onLike, onDislike, onReply, onRetry, replyTo, setReplyTo, inputRef, bottomRef, compact=false, streamingId }) => {
  const taRef = useRef(null);
  const handleKey = e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();onSend(input);} };

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0,overflow:"hidden"}}>
      <div style={{flex:1,overflowY:"auto",padding:compact?"12px 12px":"16px 16px",display:"flex",flexDirection:"column",gap:compact?12:16,scrollbarWidth:"thin",scrollbarColor:"#1e293b transparent"}}>
        {messages.map(m=>(
          <Msg key={m.id} msg={m} onLike={onLike} onDislike={onDislike} onReply={onReply} onRetry={onRetry} accent={accent} compact={compact} isStreaming={m.id===streamingId}/>
        ))}
        {/* Show dots only while fetching, not while streaming */}
        {loading && !streamingId && (
          <div style={{display:"flex",alignItems:"flex-end",gap:8}}>
            <div style={{width:compact?26:30,height:compact?26:30,borderRadius:8,overflow:"hidden",flexShrink:0}}>
              <img src={PERSONLOGO} alt="CORA" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            </div>
            <div style={{background:"#1e293b",border:"1px solid rgba(99,102,241,0.15)",borderRadius:"14px 14px 14px 3px",padding:"9px 13px"}}><Dots/></div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {messages.length<=1 && (
        <div style={{display:"flex",flexWrap:"wrap",gap:6,padding:"0 12px 10px",flexShrink:0}}>
          {SUGGESTIONS.map(s=>(
            <button key={s} onClick={()=>onSend(s)} style={{display:"flex",alignItems:"center",gap:5,background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.2)",color:"#a5b4fc",borderRadius:20,padding:"5px 11px",fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s"}}>
              <span style={{color:accent}}><I.Star/></span>{s}
            </button>
          ))}
        </div>
      )}

      {replyTo && (
        <div style={{margin:"0 12px 6px",background:"rgba(99,102,241,0.07)",border:"1px solid rgba(99,102,241,0.2)",borderLeft:`3px solid ${accent}`,borderRadius:8,padding:"6px 10px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:6,color:"#94a3b8"}}>
            <I.Reply/>
            <span style={{fontSize:11.5}}>{replyTo.text.slice(0,60)}{replyTo.text.length>60?"…":""}</span>
          </div>
          <button onClick={()=>setReplyTo(null)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",display:"flex"}}><I.X/></button>
        </div>
      )}

      <div style={{display:"flex",alignItems:"flex-end",gap:8,padding:"10px 12px",borderTop:"1px solid rgba(99,102,241,0.1)",background:"#0c1628",flexShrink:0}}>
        <textarea
          ref={el=>{if(inputRef)inputRef.current=el;taRef.current=el;}}
          rows={1} placeholder="Ask me anything…" value={input}
          disabled={loading}
          onChange={e=>{setInput(e.target.value);e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,110)+"px";}}
          onKeyDown={handleKey}
          style={{flex:1,background:"#1a2540",border:`1px solid ${input.trim()?accent+"55":"rgba(99,102,241,0.18)"}`,borderRadius:12,color:"#e2e8f0",fontSize:13,padding:"9px 12px",fontFamily:"'DM Sans',sans-serif",lineHeight:1.5,height:40,overflow:"hidden",outline:"none",resize:"none",transition:"border-color 0.2s"}}
        />
        <button onClick={()=>onSend(input)} disabled={!input.trim()||loading} style={{width:40,height:40,borderRadius:12,border:"none",background:input.trim()?`linear-gradient(135deg,${accent},${accent}bb)`:"#1e293b",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:input.trim()?"pointer":"default",transition:"background 0.2s",flexShrink:0}}>
          <I.Send/>
        </button>
      </div>
      <div style={{textAlign:"center",fontSize:10,color:"#1e3a5f",padding:"4px 14px 8px",fontFamily:"monospace",flexShrink:0}}>
        Enter to send · Shift+Enter for newline
      </div>
    </div>
  );
};

// ─── Header ───────────────────────────────────────────────────────────────────
const Header = ({ accent, mode, setMode, showPicker, setShowPicker, onClose, onMinimize, minimized, onClear }) => (
  <div style={{background:`linear-gradient(135deg,${accent}ee,${accent}99)`,padding:"13px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,userSelect:"none"}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:36,height:36,borderRadius:10,overflow:"hidden",position:"relative",flexShrink:0,border:"2px solid rgba(255,255,255,0.3)"}}>
        <img src={PERSONLOGO} alt="CORA" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        <span style={{position:"absolute",bottom:1,right:1,width:9,height:9,background:"#4ade80",border:"2px solid rgba(255,255,255,0.3)",borderRadius:"50%"}}/>
      </div>
      <div>
        {mode === "fullscreen"
          ? <div style={{color:"#fff",fontSize:14,fontWeight:600,letterSpacing:"0.01em"}}>CORA - Cognitive Operations & Response Assistant</div>
          : <div style={{color:"#fff",fontSize:14,fontWeight:600,letterSpacing:"0.01em"}}>CORA</div>
        }
        <div style={{color:"rgba(255,255,255,0.65)",fontSize:11}}>Online · Ready to help</div>
      </div>
    </div>
    <div style={{display:"flex",gap:3,alignItems:"center"}}>
      <button title="Clear chat" onClick={onClear} style={{background:"rgba(255,255,255,0.12)",border:"none",color:"#fff",width:28,height:28,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <I.Clear/>
      </button>
      {[
        {m:"popup",icon:<I.Popup/>,title:"Floating popup"},
        {m:"sidebar",icon:<I.Sidebar/>,title:"Sidebar panel"},
        {m:"fullscreen",icon:<I.Fullscreen/>,title:"Full screen"},
      ].map(({m,icon,title})=>(
        <button key={m} title={title} onClick={()=>setMode(m)} style={{background:mode===m?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.12)",border:"none",color:"#fff",width:28,height:28,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.15s"}}>
          {icon}
        </button>
      ))}
      <div style={{width:1,height:18,background:"rgba(255,255,255,0.2)",margin:"0 2px"}}/>
      <button title="Theme" onClick={()=>setShowPicker(p=>!p)} style={{background:"rgba(255,255,255,0.12)",border:"none",color:"#fff",width:28,height:28,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <I.Palette/>
      </button>
      {mode==="popup" && (
        <button title={minimized?"Expand":"Minimize"} onClick={onMinimize} style={{background:"rgba(255,255,255,0.12)",border:"none",color:"#fff",width:28,height:28,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          {minimized?<I.Maximize/>:<I.Minus/>}
        </button>
      )}
      <button title="Close" onClick={onClose} style={{background:"rgba(255,255,255,0.12)",border:"none",color:"#fff",width:28,height:28,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <I.X/>
      </button>
    </div>
  </div>
);

// ─── Play welcome voice ───────────────────────────────────────────────────────
const playWelcomeVoice = () => {
  const speak = () => {
    const msg = new SpeechSynthesisUtterance(
      "Hello! Welcome to CORA, your Cognitive Operations and Response Assistant. How can I help you today?"
    );
    msg.rate = 0.95; msg.pitch = 1.1; msg.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v =>
      v.name.includes("Female") || v.name.includes("Zira") ||
      v.name.includes("Samantha") || v.name.includes("Google UK English Female")
    );
    if (femaleVoice) msg.voice = femaleVoice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);
  };
  if (window.speechSynthesis.getVoices().length > 0) {
    speak();
  } else {
    window.speechSynthesis.onvoiceschanged = () => { speak(); window.speechSynthesis.onvoiceschanged = null; };
  }
};

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [accent, setAccent] = useState("#6366f1");
  const [mode, setMode] = useState("popup");
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [messages, setMessages] = useState([{id:uid(),role:"assistant",text:"Hi! How May I Help You.",timestamp:new Date(),liked:null}]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [unread, setUnread] = useState(0);
  const [streamingId, setStreamingId] = useState(null); // tracks which msg is streaming

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const hasPlayedWelcome = useRef(false);
  const streamIntervalRef = useRef(null); // to cancel stream if needed

  useEffect(()=>{
    if(open&&!minimized) bottomRef.current?.scrollIntoView({behavior:"smooth"});
  },[messages,loading,open,minimized]);

  useEffect(()=>{
    if(open&&!minimized){
      setTimeout(()=>inputRef.current?.focus(),120);
      setUnread(0);
      if(!hasPlayedWelcome.current){
        hasPlayedWelcome.current = true;
        setTimeout(()=>playWelcomeVoice(), 500);
      }
    }
  },[open,minimized,mode]);

  const clearChat = () => {
    currentSessionId = null;
    setMessages([{id:uid(),role:"assistant",text:"Hi! I'm CORA. How can I help you today? 👋",timestamp:new Date(),liked:null}]);
    setReplyTo(null);
    setInput("");
    setStreamingId(null);
    if(streamIntervalRef.current) clearInterval(streamIntervalRef.current);
  };

  // ─── Core send with streaming effect ───────────────────────────────────────
  const send = useCallback(async (text) => {
    if(!text.trim()||loading) return;

    const userMsg = {id:uid(),role:"user",text:text.trim(),timestamp:new Date(),replyTo:replyTo?.text||null};
    setMessages(p=>[...p,userMsg]);
    setInput("");
    setReplyTo(null);
    setLoading(true);

    try {
      // Step 1: get full response text (API or static)
      let fullText;
      if(USE_REAL_API) {
        fullText = await callCORAApi(text);
      } else {
        // Simulate network delay for static responses
        await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
        fullText = getStaticResponse();
      }

      // Step 2: add empty bot message to DOM
      const botId = uid();
      const botMsg = {id:botId, role:"assistant", text:"", timestamp:new Date(), liked:null};
      setMessages(p=>[...p,botMsg]);
      setLoading(false);      // hide dots
      setStreamingId(botId);  // show cursor

      // Step 3: stream characters into that message
      streamIntervalRef.current = streamText(
        fullText,
        (partial) => {
          setMessages(p => p.map(m => m.id===botId ? {...m, text:partial} : m));
          bottomRef.current?.scrollIntoView({behavior:"smooth"});
        },
        () => {
          // Done streaming
          setStreamingId(null);
          if(!open||minimized) setUnread(u=>u+1);
        }
      );

    } catch(e) {
      setLoading(false);
      setMessages(p=>[...p,{id:uid(),role:"assistant",text:"Something went wrong. Please try again.",timestamp:new Date(),liked:null}]);
    }
  }, [loading, replyTo, open, minimized]);

  const like    = id => setMessages(p=>p.map(m=>m.id===id?{...m,liked:m.liked===true?null:true}:m));
  const dislike = id => setMessages(p=>p.map(m=>m.id===id?{...m,liked:m.liked===false?null:false}:m));
  const reply   = msg => { setReplyTo({id:msg.id,text:msg.text}); inputRef.current?.focus(); };
  const retry   = msg => {
    const idx = messages.findIndex(m=>m.id===msg.id);
    const prev = [...messages].slice(0,idx).reverse().find(m=>m.role==="user");
    if(!prev) return;
    setMessages(p=>p.slice(0,idx));
    send(prev.text);
  };

  const chatProps   = { accent, messages, loading, input, setInput, onSend:send, onLike:like, onDislike:dislike, onReply:reply, onRetry:retry, replyTo, setReplyTo, inputRef, bottomRef, streamingId };
  const headerProps = {
    accent, mode, setMode, showPicker, setShowPicker,
    onClose: () => {
      window.speechSynthesis.cancel();
      hasPlayedWelcome.current = false;
      setOpen(false);
    },
    onMinimize: () => setMinimized(m=>!m),
    minimized,
    onClear: clearChat,
  };

  const Picker = ({top,right}) => showPicker ? (
    <div style={{position:"absolute",top,right,background:"#1e293b",border:"1px solid rgba(99,102,241,0.2)",borderRadius:12,padding:"10px 12px",zIndex:9999,boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
      <div style={{fontSize:10,color:"#64748b",marginBottom:8,fontFamily:"monospace",letterSpacing:"0.05em"}}>ACCENT COLOR</div>
      <div style={{display:"flex",gap:8}}>
        {ACCENTS.map(c=>(
          <button key={c} onClick={()=>{setAccent(c);setShowPicker(false);}} style={{width:22,height:22,borderRadius:"50%",background:c,border:accent===c?"3px solid #fff":"3px solid transparent",cursor:"pointer",boxShadow:`0 2px 8px ${c}66`}}/>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <div style={{width:"100%",height:"100vh",background:"#070d1a",fontFamily:"'DM Sans',sans-serif",position:"relative",overflow:"hidden",display:"flex"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:0.4}40%{transform:translateY(-6px);opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes popIn{0%{transform:scale(0.85);opacity:0}70%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideFromLeft{from{transform:translateX(-100%);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}
        button{cursor:pointer;}
      `}</style>

      <div style={{position:"absolute",top:"20%",left:"50%",transform:"translateX(-50%)",width:700,height:700,background:`radial-gradient(circle,${accent}15 0%,transparent 70%)`,pointerEvents:"none",transition:"background 0.5s",zIndex:0}}/>

      {/* Background content shifts when sidebar opens */}
      <div style={{
        flex:1, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        gap:20, padding:40, zIndex:1, transition:"all 0.35s ease",
        ...(mode==="sidebar"&&open ? {marginLeft:400} : {}),
        ...(mode==="fullscreen"&&open ? {display:"none"} : {}),
      }}>
        <div style={{color:"#1e3a5f",fontSize:12,fontFamily:"monospace",letterSpacing:"0.08em",marginBottom:8}}>YOUR APP CONTENT HERE</div>
        {[...Array(3)].map((_,i)=>(
          <div key={i} style={{width:"100%",maxWidth:600,height:60,background:"rgba(99,102,241,0.05)",border:"1px solid rgba(99,102,241,0.1)",borderRadius:12}}/>
        ))}
        <div style={{display:"flex",gap:12,width:"100%",maxWidth:600}}>
          {[...Array(3)].map((_,i)=>(
            <div key={i} style={{flex:1,height:100,background:"rgba(99,102,241,0.05)",border:"1px solid rgba(99,102,241,0.1)",borderRadius:12}}/>
          ))}
        </div>
      </div>

      {/* FAB */}
      {!open && (
        <button onClick={()=>{window.speechSynthesis.cancel();setOpen(true);setMinimized(false);}} style={{position:"fixed",bottom:28,right:28,width:58,height:58,borderRadius:"50%",border:"none",background:`linear-gradient(135deg,${accent},${accent}bb)`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 8px 32px ${accent}55`,animation:"popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",zIndex:1000,transition:"transform 0.2s"}}>
          <img src={PERSONLOGO} alt="CORA" style={{width:38,height:38,borderRadius:"50%",objectFit:"cover"}}/>
          {unread>0&&<span style={{position:"absolute",top:1,right:1,background:"#f43f5e",color:"#fff",fontSize:9,fontWeight:700,width:18,height:18,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid #070d1a"}}>{unread}</span>}
        </button>
      )}

      {/* POPUP */}
      {open && mode==="popup" && (
        <div style={{position:"fixed",bottom:24,right:24,width:390,height:minimized?64:600,background:"#0c1628",border:`1px solid ${accent}33`,borderRadius:22,display:"flex",flexDirection:"column",boxShadow:`0 32px 80px rgba(0,0,0,0.7),0 0 60px ${accent}18`,overflow:"hidden",transition:"height 0.38s cubic-bezier(0.34,1.56,0.64,1)",animation:"popIn 0.35s ease",zIndex:1000}}>
          <Header {...headerProps}/>
          <Picker top={64} right={8}/>
          {!minimized && <ChatPanel {...chatProps}/>}
        </div>
      )}

      {/* SIDEBAR — slides from LEFT */}
      {open && mode==="sidebar" && (
        <div style={{position:"fixed",top:0,left:0,width:400,height:"100vh",background:"#0c1628",borderRight:`1px solid ${accent}33`,borderRadius:"0 16px 16px 0",display:"flex",flexDirection:"column",boxShadow:`4px 0 40px rgba(0,0,0,0.5)`,animation:"slideFromLeft 0.35s ease",zIndex:1000}}>
          <Header {...headerProps}/>
          <Picker top={64} right={8}/>
          <ChatPanel {...chatProps}/>
        </div>
      )}

      {/* FULLSCREEN */}
      {open && mode==="fullscreen" && (
        <div style={{position:"fixed",inset:0,background:"#070d1a",display:"flex",flexDirection:"column",zIndex:1000,animation:"fadeIn 0.3s ease"}}>
          <div style={{position:"absolute",top:"30%",left:"50%",transform:"translateX(-50%)",width:800,height:800,background:`radial-gradient(circle,${accent}12 0%,transparent 65%)`,pointerEvents:"none"}}/>
          <Header {...headerProps}/>
          <Picker top={64} right={8}/>
          <div style={{flex:1,display:"flex",minHeight:0,maxWidth:900,width:"100%",margin:"0 auto",flexDirection:"column"}}>
            <ChatPanel {...chatProps} compact={false}/>
          </div>
        </div>
      )}
    </div>
  );
}



import ChatbotWidget from '../components/ChatbotWidget'

export default function YourPage() {
  return (
    <div>
      {/* All your existing page content stays untouched */}
      <YourExistingContent />

      {/* Just add CORA at the bottom — it floats automatically */}
    <ChatbotWidget
  defaultMode="popup"        {/* popup | sidebar | fullscreen */}
  defaultOpen={false}        {/* start closed */}
  accentColor="#6366f1"      {/* brand color */}
/>

    </div>
  )
}

export default function App({
  defaultMode = "popup",
  defaultOpen = false,
  accentColor = "#6366f1",
}) {
  const [mode, setMode] = useState(defaultMode);
  const [open, setOpen] = useState(defaultOpen);
  const [accent, setAccent] = useState(accentColor);

  // rest of your code stays exactly the same


  npm install react-markdown


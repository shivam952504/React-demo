import { useState, useRef, useEffect, useCallback } from "react";

const uid = () => Math.random().toString(36).slice(2, 10);

const REPLIES = [
  "Great question! In a real integration, your backend would return live answers here. The widget supports full-screen, sidebar, and floating popup modes.",
  "This widget is fully embeddable — Power BI, React apps, plain HTML. Switch view modes using the icons in the top-right corner.",
  "I support copy, like/dislike, reply threading, and message regeneration. Connect your `apiEndpoint` prop and I'll use your real backend.",
  "You can theme me with any accent color, change my title, and control whether I start open or closed via props.",
];

const mockReply = async (text) => {
  await new Promise(r => setTimeout(r, 800 + Math.random() * 700));
  return { id: uid(), role: "assistant", text: REPLIES[Math.floor(Math.random() * REPLIES.length)], timestamp: new Date(), liked: null };
};

const SUGGESTIONS = ["What can you help with?", "Summarize my data", "Show trends report", "Analyze Q4 results"];
const ACCENTS = ["#6366f1","#8b5cf6","#ec4899","#0ea5e9","#10b981","#f59e0b","#ef4444"];

const I = {
  Bot:()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="11"/><line x1="8" y1="15" x2="8" y2="17"/><line x1="16" y1="15" x2="16" y2="17"/></svg>,
  Send:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  X:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Minus:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Maximize:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/></svg>,
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
};

const Dots = () => (
  <div style={{display:"flex",gap:4,padding:"3px 0",alignItems:"center"}}>
    {[0,1,2].map(i=><span key={i} style={{width:7,height:7,borderRadius:"50%",background:"#6366f1",display:"inline-block",animation:"bounce 1.2s infinite ease-in-out",animationDelay:`${i*0.18}s`}}/>)}
  </div>
);

const Msg = ({ msg, onLike, onDislike, onReply, onRetry, accent, compact }) => {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);
  const time = msg.timestamp?.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
  const avatarSize = compact ? 26 : 30;
  const fontSize = compact ? 13 : 13.5;

  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:8,justifyContent:isUser?"flex-end":"flex-start",animation:"slideUp 0.22s ease"}}>
      {!isUser && (
        <div style={{width:avatarSize,height:avatarSize,borderRadius:8,background:`linear-gradient(135deg,${accent},${accent}99)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",flexShrink:0}}>
          <I.Bot/>
        </div>
      )}
      <div style={{maxWidth:"75%",display:"flex",flexDirection:"column",alignItems:isUser?"flex-end":"flex-start"}}>
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
          <span style={{fontSize,lineHeight:1.65,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{msg.text}</span>
        </div>
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
      </div>
    </div>
  );
};

const ChatPanel = ({ accent, messages, loading, input, setInput, onSend, onLike, onDislike, onReply, onRetry, replyTo, setReplyTo, inputRef, bottomRef, compact=false }) => {
  const taRef = useRef(null);
  const handleKey = e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();onSend(input);} };

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0,overflow:"hidden"}}>
      <div style={{flex:1,overflowY:"auto",padding:compact?"12px 12px":"16px 16px",display:"flex",flexDirection:"column",gap:compact?12:16,scrollbarWidth:"thin",scrollbarColor:"#1e293b transparent"}}>
        {messages.map(m=>(
          <Msg key={m.id} msg={m} onLike={onLike} onDislike={onDislike} onReply={onReply} onRetry={onRetry} accent={accent} compact={compact}/>
        ))}
        {loading && (
          <div style={{display:"flex",alignItems:"flex-end",gap:8}}>
            <div style={{width:compact?26:30,height:compact?26:30,borderRadius:8,background:`linear-gradient(135deg,${accent},${accent}99)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",flexShrink:0}}><I.Bot/></div>
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
          rows={1} placeholder="Ask me anything…" value={input} disabled={loading}
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

const Header = ({ accent, mode, setMode, showPicker, setShowPicker, onClose, onMinimize, minimized }) => (
  <div style={{background:`linear-gradient(135deg,${accent}ee,${accent}99)`,padding:"13px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,userSelect:"none"}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,0.15)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",position:"relative"}}>
        <I.Bot/>
        <span style={{position:"absolute",bottom:1,right:1,width:9,height:9,background:"#4ade80",border:"2px solid rgba(255,255,255,0.3)",borderRadius:"50%"}}/>
      </div>
      <div>
        <div style={{color:"#fff",fontSize:14,fontWeight:600,letterSpacing:"0.01em"}}>AI Assistant</div>
        <div style={{color:"rgba(255,255,255,0.65)",fontSize:11}}>Online · Ready to help</div>
      </div>
    </div>
    <div style={{display:"flex",gap:3,alignItems:"center"}}>
      {[
        {m:"popup",   icon:<I.Popup/>,      title:"Floating popup"},
        {m:"sidebar", icon:<I.Sidebar/>,    title:"Sidebar panel"},
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

export default function App() {
  const [accent, setAccent] = useState("#6366f1");
  const [mode, setMode] = useState("popup");
  const [open, setOpen] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [messages, setMessages] = useState([{id:uid(),role:"assistant",text:"Hi! I'm your AI Assistant. Try the three view-mode icons in the header to switch between Popup, Sidebar, and Full-Screen modes. 👋",timestamp:new Date(),liked:null}]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(()=>{
    if(open&&!minimized){bottomRef.current?.scrollIntoView({behavior:"smooth"});}
  },[messages,loading,open,minimized]);

  useEffect(()=>{
    if(open&&!minimized){setTimeout(()=>inputRef.current?.focus(),120);setUnread(0);}
  },[open,minimized,mode]);

  const send = useCallback(async (text)=>{
    if(!text.trim()||loading)return;
    const userMsg={id:uid(),role:"user",text:text.trim(),timestamp:new Date(),replyTo:replyTo?.text||null};
    setMessages(p=>[...p,userMsg]);
    setInput(""); setReplyTo(null); setLoading(true);
    try{
      const bot=await mockReply(text);
      setMessages(p=>[...p,bot]);
      if(!open||minimized)setUnread(u=>u+1);
    }catch{
      setMessages(p=>[...p,{id:uid(),role:"assistant",text:"Something went wrong. Please try again.",timestamp:new Date(),liked:null}]);
    }finally{setLoading(false);}
  },[loading,replyTo,open,minimized]);

  const like    = id=>setMessages(p=>p.map(m=>m.id===id?{...m,liked:m.liked===true?null:true}:m));
  const dislike = id=>setMessages(p=>p.map(m=>m.id===id?{...m,liked:m.liked===false?null:false}:m));
  const reply   = msg=>{setReplyTo({id:msg.id,text:msg.text});inputRef.current?.focus();};
  const retry   = msg=>{
    const idx=messages.findIndex(m=>m.id===msg.id);
    const prev=[...messages].slice(0,idx).reverse().find(m=>m.role==="user");
    if(!prev)return;
    setMessages(p=>p.slice(0,idx));
    send(prev.text);
  };

  const chatProps = { accent, messages, loading, input, setInput, onSend:send, onLike:like, onDislike:dislike, onReply:reply, onRetry:retry, replyTo, setReplyTo, inputRef, bottomRef };
  const headerProps = { accent, mode, setMode, showPicker, setShowPicker, onClose:()=>setOpen(false), onMinimize:()=>setMinimized(m=>!m), minimized };

  const Picker = ({top,right}) => showPicker ? (
    <div style={{position:"absolute",top,right,background:"#1e293b",border:"1px solid rgba(99,102,241,0.2)",borderRadius:12,padding:"10px 12px",zIndex:9999,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",animation:"slideUp 0.2s ease"}}>
      <div style={{fontSize:10,color:"#64748b",marginBottom:8,fontFamily:"monospace",letterSpacing:"0.05em"}}>ACCENT COLOR</div>
      <div style={{display:"flex",gap:8}}>
        {ACCENTS.map(c=>(
          <button key={c} onClick={()=>{setAccent(c);setShowPicker(false);}} style={{width:22,height:22,borderRadius:"50%",background:c,border:accent===c?"3px solid #fff":"3px solid transparent",cursor:"pointer",boxShadow:`0 2px 8px ${c}66`,transition:"transform 0.15s"}}/>
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
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}
        button{cursor:pointer;}
      `}</style>

      <div style={{position:"absolute",top:"20%",left:"50%",transform:"translateX(-50%)",width:700,height:700,background:`radial-gradient(circle,${accent}15 0%,transparent 70%)`,pointerEvents:"none",transition:"background 0.5s",zIndex:0}}/>

      {/* Background mockup */}
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,padding:40,zIndex:1,transition:"all 0.35s ease",
        ...(mode==="sidebar"&&open ? {marginRight:400} : {}),
        ...(mode==="fullscreen"&&open ? {display:"none"} : {}),
      }}>
        <div style={{color:"#1e3a5f",fontSize:12,fontFamily:"monospace",letterSpacing:"0.08em",marginBottom:8}}>BACKGROUND CONTENT (YOUR APP / POWER BI REPORT)</div>
        {[...Array(3)].map((_,i)=>(
          <div key={i} style={{width:"100%",maxWidth:600,height:60,background:"rgba(99,102,241,0.05)",border:"1px solid rgba(99,102,241,0.1)",borderRadius:12}}/>
        ))}
        <div style={{display:"flex",gap:12,width:"100%",maxWidth:600}}>
          {[...Array(3)].map((_,i)=>(
            <div key={i} style={{flex:1,height:100,background:"rgba(99,102,241,0.05)",border:"1px solid rgba(99,102,241,0.1)",borderRadius:12}}/>
          ))}
        </div>
        <div style={{display:"flex",gap:8,marginTop:8}}>
          {[
            {m:"popup",label:"💬 Floating Popup"},
            {m:"sidebar",label:"📐 Sidebar Panel"},
            {m:"fullscreen",label:"⛶ Full Screen"},
          ].map(({m,label})=>(
            <button key={m} onClick={()=>{setMode(m);setOpen(true);setMinimized(false);}} style={{
              background:mode===m?`${accent}22`:"rgba(255,255,255,0.04)",
              border:`1px solid ${mode===m?accent+"55":"rgba(255,255,255,0.08)"}`,
              color:mode===m?"#a5b4fc":"#475569",
              borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:500,
              transition:"all 0.2s",fontFamily:"'DM Sans',sans-serif",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* FAB when closed */}
      {!open && (
        <button onClick={()=>{setOpen(true);setMinimized(false);}} style={{position:"fixed",bottom:28,right:28,width:58,height:58,borderRadius:"50%",border:"none",background:`linear-gradient(135deg,${accent},${accent}bb)`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 8px 32px ${accent}55`,animation:"popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",zIndex:1000}}>
          <I.Bot/>
          {unread>0&&<span style={{position:"absolute",top:1,right:1,background:"#f43f5e",color:"#fff",fontSize:9,fontWeight:700,width:18,height:18,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid #070d1a"}}>{unread}</span>}
        </button>
      )}

      {/* POPUP MODE */}
      {open && mode==="popup" && (
        <div style={{position:"fixed",bottom:24,right:24,width:390,height:minimized?64:600,background:"#0c1628",border:`1px solid ${accent}33`,borderRadius:22,display:"flex",flexDirection:"column",boxShadow:`0 32px 80px rgba(0,0,0,0.7),0 0 60px ${accent}18`,overflow:"hidden",transition:"height 0.38s cubic-bezier(0.34,1.56,0.64,1)",animation:"popIn 0.35s ease",zIndex:1000}}>
          <Header {...headerProps}/>
          <Picker top={64} right={8}/>
          {!minimized && <ChatPanel {...chatProps}/>}
        </div>
      )}

      {/* SIDEBAR MODE */}
      {open && mode==="sidebar" && (
        <div style={{position:"fixed",top:0,right:0,width:400,height:"100vh",background:"#0c1628",borderLeft:`1px solid ${accent}33`,display:"flex",flexDirection:"column",boxShadow:`-16px 0 60px rgba(0,0,0,0.5)`,animation:"slideRight 0.35s ease",zIndex:1000}}>
          <style>{`@keyframes slideRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
          <Header {...headerProps}/>
          <Picker top={64} right={8}/>
          <ChatPanel {...chatProps}/>
        </div>
      )}

      {/* FULLSCREEN MODE */}
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

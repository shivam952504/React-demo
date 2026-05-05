const Header = ({ accent, mode, setMode, showPicker, setShowPicker, onClose, onMinimize, minimized, onClear }) => (
  <div style={{
    background:`linear-gradient(135deg,${accent}ee,${accent}99)`,
    padding:"10px 12px",
    display:"flex",
    alignItems:"center",
    justifyContent:"space-between",
    flexShrink:0,
    userSelect:"none",
    gap:8,
  }}>
    {/* LEFT — logo + title */}
    <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0,overflow:"hidden"}}>
      <div style={{width:36,height:36,borderRadius:10,overflow:"hidden",position:"relative",flexShrink:0,border:"2px solid rgba(255,255,255,0.3)"}}>
        <img src={PERSONLOGO} alt="CORA" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        <span style={{position:"absolute",bottom:1,right:1,width:9,height:9,background:"#4ade80",border:"2px solid rgba(255,255,255,0.3)",borderRadius:"50%"}}/>
      </div>
      <div style={{minWidth:0,overflow:"hidden"}}>
        <div style={{
          color:"#fff",
          fontSize: mode==="fullscreen" ? 13 : 14,
          fontWeight:600,
          letterSpacing:"0.01em",
          whiteSpace:"nowrap",
          overflow:"hidden",
          textOverflow:"ellipsis",
        }}>
          {mode === "fullscreen" ? "CORA - Cognitive Operations & Response Assistant" : "CORA"}
        </div>
        <div style={{
          color:"rgba(255,255,255,0.65)",
          fontSize:11,
          whiteSpace:"nowrap",   {/* ← this stops the 3-line wrap */}
        }}>
          Online · Ready to help
        </div>
      </div>
    </div>

    {/* RIGHT — all icon buttons */}
    <div style={{display:"flex",gap:2,alignItems:"center",flexShrink:0}}>
      <button title="Clear chat" onClick={onClear} style={{background:"rgba(255,255,255,0.12)",border:"none",color:"#fff",width:26,height:26,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <I.Clear/>
      </button>
      {[
        {m:"popup",      icon:<I.Popup/>,      title:"Floating popup"},
        {m:"sidebar",    icon:<I.Sidebar/>,    title:"Sidebar panel"},
        {m:"fullscreen", icon:<I.Fullscreen/>, title:"Full screen"},
      ].map(({m,icon,title})=>(
        <button key={m} title={title} onClick={()=>setMode(m)} style={{background:mode===m?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.12)",border:"none",color:"#fff",width:26,height:26,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.15s"}}>
          {icon}
        </button>
      ))}
      <div style={{width:1,height:16,background:"rgba(255,255,255,0.2)",margin:"0 1px"}}/>
      <button title="Theme" onClick={()=>setShowPicker(p=>!p)} style={{background:"rgba(255,255,255,0.12)",border:"none",color:"#fff",width:26,height:26,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <I.Palette/>
      </button>
      {mode==="popup" && (
        <button title={minimized?"Expand":"Minimize"} onClick={onMinimize} style={{background:"rgba(255,255,255,0.12)",border:"none",color:"#fff",width:26,height:26,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          {minimized?<I.Maximize/>:<I.Minus/>}
        </button>
      )}
      <button title="Close" onClick={onClose} style={{background:"rgba(255,255,255,0.12)",border:"none",color:"#fff",width:26,height:26,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <I.X/>
      </button>
    </div>
  </div>
);

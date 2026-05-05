{open && mode==="sidebar" && (
  <div style={{
    position:"fixed",
    top:0,
    right:0,                         // ← right side
    width:400,
    height:"100vh",
    background:"#0c1628",
    borderLeft:`1px solid ${accent}33`,            // ← border on left side
    borderRadius:"16px 0 0 16px",                  // ← rounded on left side
    display:"flex",
    flexDirection:"column",
    boxShadow:`-4px 0 40px rgba(0,0,0,0.5)`,      // ← shadow goes left
    animation:"slideFromRight 0.35s ease",          // ← new animation
    zIndex:1000,
  }}>
    <style>{`@keyframes slideFromRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
    <Header {...headerProps}/>
    <Picker top={64} right={8}/>
    <ChatPanel {...chatProps}/>
  </div>
)}


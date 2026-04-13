{target!=="-"&&(
  <span style={{fontSize:11,fontWeight:700,whiteSpace:"nowrap",flexShrink:0,display:"flex",alignItems:"center",gap:4}}>
    Target: <span style={{color}}>{target}</span>
    <button
      onClick={e=>{e.stopPropagation();setModalTile(tile);}}
      title="View details"
      style={{
        background:"transparent",border:"none",cursor:"pointer",
        color:"#94a3b8",fontSize:13,lineHeight:1,padding:"0 2px",
        display:"inline-flex",alignItems:"center",
      }}
    >ⓘ</button>
  </span>
)}

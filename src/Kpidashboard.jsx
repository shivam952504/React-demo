{/* LOB - single select */}
<div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:5 }}>
  <span style={{ fontSize:12, fontWeight:600, color:"#fff", letterSpacing:"1px", textTransform:"uppercase" }}>LOB</span>
  <Select
    value={filters.lob}
    style={{ width:"100%" }}
    popupMatchSelectWidth={false}
    styles={{ popup: { minWidth: 180 } }}
    onChange={v => setFilters(p => ({ ...p, lob: v }))}
  >
    {(filterOptions.lob||[]).map(v => <Option key={v} value={v}>{v}</Option>)}
  </Select>
</div>


lob: typeof f.lob === "string" ? [f.lob] : f.lob,


const [dateRange, setDateRange] = useState({ start: "", end: "" });
const [showDatePicker, setShowDatePicker] = useState(false);


const runDateRangeFetch = (start, end) => {
  setLoading(true); setTableLoading(true); setError(null);
  setAllRows([]); setAllTiles([]); setColumns([]);
  const p = {
    start_date: start,
    end_date: end,
    geo: filters.geo,
    program: filters.program,
    lob: filters.lob,
    supervisor: filters.supervisor,
    tenure_unit: filters.tenure_unit,
  };
  axios.post(`${API_BASE_URL}api/get_concora_date_range_data/`, p)
    .then(r => {
      if (!r.data || !Object.keys(r.data).length)
        return setError("No data available.");
      buildTable(r.data, "day"); // reuse day view builder
    })
    .catch(() => setError("Failed to load. Please try again."))
    .finally(() => { setLoading(false); setTableLoading(false); });
};


{/* PERIOD: Day | Week | Month | Quarterly | Date Range */}
<div style={{display:"flex",alignItems:"center",gap:12,position:"relative"}}>
  <span style={{fontSize:14,fontWeight:600,color:"#050f1eff",whiteSpace:"nowrap"}}>Period:</span>
  <PillGroup>
    <PillBtn label="Day"        active={viewBy==="day"}        onClick={()=>{setViewBy("day");setShowDatePicker(false);}}/>
    <PillBtn label="Week"       active={viewBy==="week"}       onClick={()=>{setViewBy("week");setShowDatePicker(false);}}/>
    <PillBtn label="Month"      active={viewBy==="month"}      onClick={()=>{setViewBy("month");setShowDatePicker(false);}}/>
    <PillBtn label="Quarterly"  active={viewBy==="quarterly"}  onClick={()=>{setViewBy("quarterly");setShowDatePicker(false);}}/>
    <PillBtn label="Date Range" active={viewBy==="daterange"}  onClick={()=>{setViewBy("daterange");setShowDatePicker(true);}}/>
  </PillGroup>

  {/* Date Range Picker Popup */}
  {viewBy==="daterange" && showDatePicker && (
    <div style={{
      position:"absolute", top:"calc(100% + 8px)", left:0,
      background:"#fff", borderRadius:10, padding:"14px 18px",
      boxShadow:"0 4px 20px rgba(0,0,0,0.15)", zIndex:999,
      display:"flex", flexDirection:"column", gap:10, minWidth:280,
    }}>
      <div style={{fontSize:12,fontWeight:700,color:"#334155",letterSpacing:"0.5px"}}>
        SELECT DATE RANGE
      </div>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <div style={{display:"flex",flexDirection:"column",gap:4,flex:1}}>
          <label style={{fontSize:11,color:"#64748b",fontWeight:600}}>Start Date</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={e=>setDateRange(p=>({...p,start:e.target.value}))}
            style={{
              border:"1px solid #e2e8f0",borderRadius:6,padding:"6px 8px",
              fontSize:13,color:"#1e293b",outline:"none",width:"100%",
            }}
          />
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:4,flex:1}}>
          <label style={{fontSize:11,color:"#64748b",fontWeight:600}}>End Date</label>
          <input
            type="date"
            value={dateRange.end}
            min={dateRange.start}
            onChange={e=>setDateRange(p=>({...p,end:e.target.value}))}
            style={{
              border:"1px solid #e2e8f0",borderRadius:6,padding:"6px 8px",
              fontSize:13,color:"#1e293b",outline:"none",width:"100%",
            }}
          />
        </div>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:2}}>
        <button
          onClick={()=>{setShowDatePicker(false);setViewBy("day");}}
          style={{
            padding:"6px 14px",borderRadius:6,border:"1px solid #e2e8f0",
            background:"#f8fafc",fontSize:13,cursor:"pointer",color:"#64748b",
          }}
        >Cancel</button>
        <button
          disabled={!dateRange.start||!dateRange.end}
          onClick={()=>{
            setShowDatePicker(false);
            runDateRangeFetch(dateRange.start, dateRange.end);
          }}
          style={{
            padding:"6px 14px",borderRadius:6,border:"none",
            background:(!dateRange.start||!dateRange.end)?"#94a3b8":"#3b82f6",
            color:"#fff",fontSize:13,fontWeight:600,
            cursor:(!dateRange.start||!dateRange.end)?"not-allowed":"pointer",
            transition:"background 0.15s",
          }}
        >Apply</button>
      </div>
    </div>
  )}
</div>



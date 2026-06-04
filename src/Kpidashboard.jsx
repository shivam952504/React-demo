const DATE_RANGE_MIN = "2025-07-01";


const getMaxEndDate = (start) => {
  if (!start) return "";
  const d = new Date(start);
  d.setMonth(d.getMonth() + 1);
  d.setDate(d.getDate() - 1); // exactly 1 month, e.g. Jul 1 → Jul 31
  return d.toISOString().split("T")[0];
};

<input
  type="date"
  value={dateRange.start}
  min={DATE_RANGE_MIN}
  max={new Date().toISOString().split("T")[0]} // can't be future
  onChange={e => {
    const newStart = e.target.value;
    setDateRange({ start: newStart, end: "" }); // reset end when start changes
  }}
  style={{
    border:"1px solid #e2e8f0", borderRadius:6, padding:"6px 8px",
    fontSize:13, color:"#1e293b", outline:"none", width:"100%",
  }}
/>

<input
  type="date"
  value={dateRange.end}
  min={dateRange.start || DATE_RANGE_MIN} // can't be before start
  max={getMaxEndDate(dateRange.start)}    // can't exceed 1 month from start
  onChange={e => setDateRange(p => ({...p, end: e.target.value}))}
  disabled={!dateRange.start}            // lock until start is chosen
  style={{
    border:"1px solid #e2e8f0", borderRadius:6, padding:"6px 8px",
    fontSize:13, color:"#1e293b", outline:"none", width:"100%",
    opacity: !dateRange.start ? 0.4 : 1,
    cursor: !dateRange.start ? "not-allowed" : "auto",
  }}
/>



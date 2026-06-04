  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // ← ADD HERE
  const today = new Date();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString().split("T")[0];
  const todayStr = today.toISOString().split("T")[0];
  const [dateRange, setDateRange] = useState({ start: currentMonthStart, end: todayStr });
  const [showDatePicker, setShowDatePicker] = useState(false);
  // ← END

  const { clientId } = useParams();

<button
  onClick={() => {
    setDateRange({ start: currentMonthStart, end: todayStr });
  }}
  style={{
    padding:"6px 14px", borderRadius:6, border:"1px solid #e2e8f0",
    background:"#f8fafc", fontSize:13, cursor:"pointer", color:"#64748b",
  }}
>Clear</button>

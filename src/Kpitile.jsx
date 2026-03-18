const payload = useMemo(() => ({
  year: filters.year,
  year_type: filters.year_type,
  month: filters.month,
  geo: filters.geo,
  client_name: filters.client_name,
  program: filters.program,
  lob: filters.lob,
  supervisor: filters.supervisor,
  tenure_unit: filters.tenure_unit,
  tenure_lower: filters.tenure_lower,
  tenure_upper: filters.tenure_upper
}), [filters]);

const [isFilterLoaded, setIsFilterLoaded] = useState(false);

useEffect(() => {
  setLoading(true);

  axios.post(API_BASE + getFilterEndpoint(), defaultFilterPayload)
    .then(res => {
      const data = res.data || {};
      setFilterOptions(data);

      setFilters({
        year_type: data.year_type?.[0] || "Calendar Year",
        year: data.year?.[0] || 2026,
        month: data.month?.[0] || "February",
        geo: "ALL",
        client_name: "ALL",
        lob: "ALL",
        program: data.program?.[0],
        supervisor: data.supervisor?.[0],
        tenure_unit: data.tenure_unit?.[0],
        tenure_lower: 0,
        tenure_upper: 0
      });

      setIsFilterLoaded(true); // ✅ IMPORTANT
    })
    .finally(() => setLoading(false));

}, []);

useEffect(() => {
  if (!isFilterLoaded) return; // ✅ BLOCK FIRST RENDER

  setLoading(true);

  axios.post(API_BASE + getDataEndpoint(), payload)
    .then(res => {
      buildDynamicTable(res.data);
      setTileData(res.data.tile || {});
    })
    .finally(() => setLoading(false));

}, [payload, viewBy, isFilterLoaded]);



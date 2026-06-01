const runFetch = (vb, payload) => {
  setLoading(true); setTableLoading(true); setError(null);
  setAllRows([]); setAllTiles([]); setColumns([]);

  // Step 1: fetch last updated (only first time)
  const luPromise = lastUpdatedFetched.current
    ? Promise.resolve(lastUpdatedMap) // already have it
    : axios.post(`${API_BASE_URL}api/Concora/last_updated_date`)
        .then(r => {
          const data = r?.data || {};
          setLastUpdatedMap(data);
          lastUpdatedFetched.current = true;
          return data; // pass it forward
        })
        .catch(() => ({}));

  // Step 2: fetch main data
  const dataPromise = axios.post(
    `${API_BASE_URL}api${dataEp(vb)}`, payload
  );

  // Step 3: wait for BOTH, then build table
  return Promise.all([luPromise, dataPromise])
    .then(([luData, r]) => {
      if (activeVb.current !== vb) return;
      setFilterOptions(r.data || {});
      if (!r.data || !Object.keys(r.data).length) {
        setError("No data available.");
        return;
      }
      buildTable(r.data, vb, luData); // pass luData into buildTable
    })
    .catch(() => {
      if (activeVb.current !== vb) return;
      setError("Failed to load. Please try again.");
    })
    .finally(() => {
      if (activeVb.current === vb) {
        setLoading(false);
        setTableLoading(false);
      }
    });
};

const buildTable = (response, currentVb, luData = {}) => {


// Helper to find lastUpdated for a key
const findLU = (k) => {
  if (luData[k]?.lastUpdated) return luData[k].lastUpdated;
  const found = Object.keys(luData).find(lk =>
    lk.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(lk.toLowerCase())
  );
  return found ? luData[found]?.lastUpdated : null;
};

// In the return object:
return {
  key: k, label: k, color, unit,
  value: isEmpty ? null : val,
  target,
  series, dates: gDates, viewBy: currentVb,
  contractual, bonus, bonusQ, flat, cms, trend,
  isEmpty,
  lastUpdated: findLU(k), // computed with fresh luData, not stale state
};

useEffect(() => {
  console.log("deb filters changed", debFilters?.lob);
  if (!isFlReady || !debFilters) return;
  const vb = viewBy;
  setTableLoading(true); setLoading(true); setError(null);
  const p = mkP(debFilters);
  axios.post(`${API_BASE_URL}api${filterEp(vb)}`, p)
    .then(r => { ... })

  
  

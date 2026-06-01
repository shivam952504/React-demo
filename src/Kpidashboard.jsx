const runFetch = (vb, payload) => {
  setLoading(true); setTableLoading(true); setError(null);
  setAllRows([]); setAllTiles([]); setColumns([]);

  // Fetch lastUpdated only first time, reuse after
  const luPromise = lastUpdatedFetched.current
    ? Promise.resolve(lastUpdatedMap)
    : axios.post(`${API_BASE_URL}api/Concora/last_updated_date`)
        .then(r => {
          const data = r?.data || {};
          setLastUpdatedMap(data);
          lastUpdatedFetched.current = true;
          return data; // return raw data, not state
        })
        .catch(() => ({}));

  const dataPromise = axios.post(
    `${API_BASE_URL}api${dataEp(vb)}`, payload
  );

  return Promise.all([luPromise, dataPromise])
    .then(([luData, r]) => {
      if (activeVb.current !== vb) return;
      setFilterOptions(r.data || {});
      setIsFlReady(true);
      if (!r.data || !Object.keys(r.data).length) {
        setError("No data available.");
        return;
      }
      buildTable(r.data, vb, luData); // luData passed directly
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

useEffect(() => {
  console.log("deb filters changed", debFilters?.lob);
  if (!isFlReady || !debFilters) return;
  const vb = viewBy;
  setTableLoading(true); setLoading(true); setError(null);
  const p = mkP(debFilters);

  // Use lastUpdatedMap already in state (already fetched by runFetch)
  const luData = lastUpdatedMap;

  axios.post(`${API_BASE_URL}api${filterEp(vb)}`, p)
    .then(r => {
      if (activeVb.current !== vb) return;
      setFilterOptions(r.data || {});
      return axios.post(`${API_BASE_URL}api${dataEp(vb)}`, p);
    })
    .then(r => {
      if (activeVb.current !== vb) return;
      if (!r.data || !Object.keys(r.data).length) {
        setError("No data.");
        return;
      }
      buildTable(r.data, vb, luData); // pass luData here too
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
}, [debFilters]);

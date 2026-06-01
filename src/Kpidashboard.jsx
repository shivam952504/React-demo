// Lines 176-182 — add runFetch call after setLastUpdatedMap
useEffect(() => {
  axios.post(`${API_BASE_URL}api/Concora/last_updated_date`)
    .then(r => {
      if (r?.data) {
        setLastUpdatedMap(r.data);
        // ✅ Now trigger the tile fetch AFTER last_updated is ready
        runFetch(viewBy, mkP(filters));
      }
    })
    .catch(() => {});
}, []);


// Line 222 — add a guard so it doesn't fire on initial mount
// Change:
useEffect(() => { const vb=viewBy; activeVb.current=vb; setIsFlReady(false); runFetch(vb,mkP(filters)); }, [viewBy]);

// To:
useEffect(() => {
  if (!lastUpdatedMap || Object.keys(lastUpdatedMap).length === 0) return; // wait for last_updated
  const vb = viewBy;
  activeVb.current = vb;
  setIsFlReady(false);
  runFetch(vb, mkP(filters));
}, [viewBy, lastUpdatedMap]); // eslint-disable-line

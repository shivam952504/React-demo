const runFetch = (vb, payload) => {
  setLoading(true); setTableLoading(true); setError(null);
  setAllRows([]); setAllTiles([]); setColumns([]);

  // Fetch lastUpdated only once, else reuse existing
  const luPromise = lastUpdatedFetched.current
    ? Promise.resolve(lastUpdatedMap)
    : axios.post(`${API_BASE_URL}api/Concora/last_updated_date`)
        .then(r => {
          const data = r?.data || {};
          setLastUpdatedMap(data);
          lastUpdatedFetched.current = true;
          return data;
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
      buildTable(r.data, vb, luData); // pass luData here
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
  const tileObj = response.tile || {};
  const { dates, dataMap } = parseDateEntries(response);
  if (!dates.length) { setAllRows([]); setAllTiles([]); return; }
  setChartDates(dates);
  setChartDataMap(dataMap);
  const keys = discoverKeys(dates, dataMap);
  const active = keys; // no filter — show all

  // ---- ADD THIS ----
  const findLU = (k) => {
    if (luData[k]?.lastUpdated) return luData[k].lastUpdated;
    const found = Object.keys(luData).find(lk =>
      lk.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(lk.toLowerCase())
    );
    return found ? luData[found]?.lastUpdated : null;
  };
  // ------------------

  const getT = k => { /* your existing getT */ };

  setAllTiles(active.map(k => {
    // ... all your existing tile building code ...

    return {
      key: k, label: k, color, unit, value: val, target,
      series, dates: gDates, viewBy: currentVb,
      contractual, bonus, bonusQ, flat, cms, trend,
      lastUpdated: findLU(k), // <-- ADD THIS ONE LINE
    };
  }));

  setShowAll(false);
};

{tile.lastUpdated && (
  <div style={{
    fontSize: 10,
    color: "#9ca3af",
    fontFamily: "monospace",
    marginTop: 2,
  }}>
    Updated: {tile.lastUpdated}
  </div>
)}

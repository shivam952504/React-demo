// Add this ref near your other refs
const lastUpdatedFetched = useRef(false);

// Lines 176-182 — fetch last_updated first, then runFetch ONCE
useEffect(() => {
  if (lastUpdatedFetched.current) return;
  lastUpdatedFetched.current = true;
  
  axios.post(`${API_BASE_URL}api/Concora/last_updated_date`)
    .then(r => {
      if (r?.data) setLastUpdatedMap(r.data);
    })
    .then(() => {
      runFetch(viewBy, mkP(filters));  // fires ONCE after last_updated
    })
    .catch(() => {});
}, []);

// Line 222 — keep viewBy effect but skip initial mount
const isFirstRender = useRef(true);

useEffect(() => {
  if (isFirstRender.current) {
    isFirstRender.current = false;
    return; // skip — initial fetch already handled above
  }
  const vb = viewBy;
  activeVb.current = vb;
  setIsFlReady(false);
  runFetch(vb, mkP(filters));
}, [viewBy]); // eslint-disable-line

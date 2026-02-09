const LANDING_CACHE_KEY = "landing_api_cache_v1";

const readCache = () => {
  try {
    const raw = sessionStorage.getItem(LANDING_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writeCache = (payload) => {
  try {
    sessionStorage.setItem(
      LANDING_CACHE_KEY,
      JSON.stringify(payload)
    );
  } catch {
    // fail silently – never block UI
  }
};

const isValidCache = (cache, geo) => {
  if (!cache) return false;

  // geo must match
  const geoKey = Array.isArray(geo) ? geo.join(",") : geo;
  if (cache.geoKey !== geoKey) return false;

  // required data must exist
  return (
    Array.isArray(cache.tiles) &&
    Array.isArray(cache.tableRows) &&
    cache.metricsMap &&
    Array.isArray(cache.geoOptions)
  );
};

useEffect(() => {
  let isMounted = true;

  const callApi = async () => {
    setLoading(true);

    const geoArray = Array.isArray(geo) ? geo : [geo];
    const geoKey = geoArray.join(",");

    // 🔹 1. Try cache FIRST
    const cached = readCache();
    if (isValidCache(cached, geo)) {
      if (!isMounted) return;

      setTileHoverMap(cached.tileHoverMap);
      setClientHoverMap(cached.clientHoverMap);
      setMetricsMap(cached.metricsMap);
      setTiles(cached.tiles);
      setAllTiles(cached.tiles);
      setClientTableData(cached.tableRows);
      setAllClientTableData(cached.tableRows);
      setGeoOptions(cached.geoOptions);
      setHighlights(cached.highlights || []);
      setLoading(false);
      return; // ✅ safe return
    }

    // 🔹 2. Cache miss → call API
    try {
      const response = await apiClient("http://localhost:9009/api/", {
        method: "POST",
        body: JSON.stringify({
          geo: geoArray,
          job: ["ALL"],
          user_id: ""
        }),
      });

      const data = await response.json();
      const result = data?.result;
      if (!result) throw new Error("Invalid API response");

      // ---- your existing processing logic ----
      const metricsArray = Array.isArray(result.metrics) ? result.metrics : [];
      const tilesArray = Array.isArray(result.tiles) ? result.tiles : [];
      const tableRows = Array.isArray(result.table_rows) ? result.table_rows : [];
      const geoValue = Array.isArray(result.geo_options) ? result.geo_options : [];

      const metricLookup = {};
      metricsArray.forEach(m => {
        metricLookup[m.id] = m;
      });

      const tileHoverLookup = {};
      (result?.hover_data?.tiles_hover || []).forEach(item => {
        tileHoverLookup[item.id] = {
          title: item.title,
          ...item.details?.metrics
        };
      });

      const clientHoverLookup = {};
      (result?.hover_data?.client_hover || []).forEach(item => {
        const d = item.details || {};
        clientHoverLookup[item.id] = {
          title: item.id,
          headcount: d.head_count,
          kpi: d.kpi,
          link: d.link
        };
      });

      if (!isMounted) return;

      // 🔹 3. Set state
      setTileHoverMap(tileHoverLookup);
      setClientHoverMap(clientHoverLookup);
      setMetricsMap(metricLookup);
      setTiles(tilesArray);
      setAllTiles(tilesArray);
      setClientTableData(tableRows);
      setAllClientTableData(tableRows);
      setGeoOptions(["ALL", ...geoValue]);
      setHighlights(result.highlights || []);

      // 🔹 4. Save CLEAN cache
      writeCache({
        geoKey,
        tileHoverMap: tileHoverLookup,
        clientHoverMap: clientHoverLookup,
        metricsMap: metricLookup,
        tiles: tilesArray,
        tableRows,
        geoOptions: ["ALL", ...geoValue],
        highlights: result.highlights || []
      });

    } catch (err) {
      console.error("Landing API error:", err);
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  callApi();

  return () => {
    isMounted = false;
  };
}, [geo]);

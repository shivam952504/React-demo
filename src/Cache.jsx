if (isValidCache(cached, geo) && !isFirstLoadRef.current) {
  // navigation case → use cache
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
  return;
}

isFirstLoadRef.current = false;


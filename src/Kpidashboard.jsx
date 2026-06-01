function findLastUpdated(lastUpdatedMap, tileKey) {
  // Use ref data as fallback if state not yet populated
  const map = (lastUpdatedMap && Object.keys(lastUpdatedMap).length > 0)
    ? lastUpdatedMap
    : lastUpdatedMapRef.current;

  if (!tileKey || !map) return null;

  if (map[tileKey]?.lastUpdated) return map[tileKey].lastUpdated;

  const lower = tileKey.toLowerCase();
  const found = Object.keys(map).find(
    k => k.toLowerCase() === lower ||
         k.toLowerCase().includes(lower) ||
         lower.includes(k.toLowerCase())
  );
  return found ? map[found]?.lastUpdated : null;
}

// In renderTile, change:
const lastUpdated = findLastUpdated(lastUpdatedMap, tile.key);

// To:
const lastUpdated = findLastUpdated(
  Object.keys(lastUpdatedMap).length > 0 ? lastUpdatedMap : lastUpdatedMapRef.current,
  tile.key
);

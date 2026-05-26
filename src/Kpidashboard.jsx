{/* Tile label */}
<div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
  {tile.label}
</div>

{/* Last updated — show only if available */}
{tile.lastUpdated && (
  <div style={{
    fontSize: 10,
    color: "#9ca3af",
    fontFamily: "'DM Mono', monospace",
    marginTop: 2,
    marginBottom: 4,
  }}>
    Updated {tile.lastUpdated}
  </div>
)}


// Match tile key to lastUpdatedMap key — case-insensitive partial match
function findLastUpdated(lastUpdatedMap, tileKey) {
  if (!tileKey || !lastUpdatedMap) return null;
  
  // Try exact match first
  if (lastUpdatedMap[tileKey]?.lastUpdated) {
    return lastUpdatedMap[tileKey].lastUpdated;
  }
  
  // Try case-insensitive match
  const lower = tileKey.toLowerCase();
  const found = Object.keys(lastUpdatedMap).find(
    k => k.toLowerCase() === lower ||
         k.toLowerCase().includes(lower) ||
         lower.includes(k.toLowerCase())
  );
  
  return found ? lastUpdatedMap[found]?.lastUpdated : null;
}


lastUpdated: findLastUpdated(lastUpdatedMap, k),

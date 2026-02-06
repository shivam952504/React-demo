const formatDateTime = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

<MetricTile
  label={tile.label}
  planned={kpiTileData?.overall_forecast}
  actual={kpiTileData?.overall_actual}
  value={kpiTileData?.percentage}
  createdAt={kpiTileData?.created_at}
  isPercent
  isActive={selectedTileId === tile.id}
  isDimmed={selectedTileId && selectedTileId !== tile.id}
/>

{/* Planned value */}
{planned !== null && (
  <div style={{ marginTop: 12 }}>
    <div
      style={{
        fontSize: 16,          // bigger than time
        fontWeight: 600,
        color: "#344054",
      }}
    >
      Planned: {planned.toLocaleString()}
    </div>

    {createdAt && (
      <div
        style={{
          marginTop: 4,
          fontSize: 12,        // smaller than planned
          color: "#98A2B3",
        }}
      >
        {formatDateTime(createdAt)}
      </div>
    )}
  </div>
)}


const tileResult = kpiDataByTile[tile.id]?.tile;

<MetricTile
  label={tile.label}
  value={
    tileResult?.percentage ??
    tileResult?.overall ??
    null
  }
  unit={tileResult?.unit || ""}
  color={tileResult?.color}
  isPercent={tileResult?.is_percent}
  isActive={isActive}
  isDimmed={isDimmed}
  createdAt={tileResult?.created_at}
  minHeight={185}
/>

const displayValue =
  value !== null && value !== undefined
    ? `${value}${unit ? ` ${unit}` : ""}`
    : "N/A";

<span
  className="metric-value"
  style={{ color }}
>
  {displayValue}
</span>


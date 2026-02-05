const [selectedTileId, setSelectedTileId] = useState(null);

<MetricTile
  label={tile.label}
  actual={tile.actual}
/>

<MetricTile
  label={tile.label}
  planned={tile.planned}
  actual={tile.actual}
  isActive={selectedTileId === tile.id}
  isDimmed={selectedTileId && selectedTileId !== tile.id}
  onClick={() => setSelectedTileId(tile.id)}
/>

function MetricTile({
  label,
  planned,
  actual,
  isActive,
  isDimmed,
  onClick,
}) {
  return (
    <Card
      className={`metric-tile 
        ${isActive ? "metric-tile--active" : ""}
        ${isDimmed ? "metric-tile--dimmed" : ""}
      `}
      onClick={onClick}
    >
      <Text className="metric-tile-label">{label}</Text>
      <Title level={3}>{actual ?? "N/A"}</Title>
      {planned != null && <Text>Planned: {planned}</Text>}
    </Card>
  );
}

.metric-tile {
  cursor: pointer;
  transition: all 0.25s ease;
}

/* Focused tile */
.metric-tile--active {
  border: 2px solid #1677ff;
  box-shadow: 0 6px 18px rgba(22, 119, 255, 0.25);
  transform: translateY(-2px);
  background: #ffffff;
}

/* Dimmed tiles */
.metric-tile--dimmed {
  opacity: 0.35;
  filter: grayscale(30%);
}

{selectedTileId && (
  <ClientKpiTable selectedMetric={selectedTileId} />
)}

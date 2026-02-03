function MetricTile({ label, planned, actual, value, isPercent }) {
  const isSentiment =
    value &&
    typeof value === "object" &&
    (
      value.id === "esat" ||
      value.id === "sentiment" ||
      value.category === "Client Sentiment"
    );

  // ---------- SENTIMENT TILE ----------
  if (isSentiment) {
    const fav = value.favourable ?? value.favorable ?? 0;
    const neu = value.neutral ?? 0;
    const unf = value.unfavourable ?? value.unfavorable ?? 0;

    return (
      <Card className="metric-tile">
        <Text>{label}</Text>
        <div style={{ marginTop: 10 }}>
          <Text>Fav: {fav}%</Text><br />
          <Text>Neu: {neu}%</Text><br />
          <Text>Unf: {unf}%</Text>
        </div>
      </Card>
    );
  }

  // ---------- NORMAL KPI TILE ----------
  let displayValue = "N/A";
  if (actual != null) {
    displayValue = isPercent ? `${actual}%` : actual;
  }

  return (
    <Card className="metric-tile">
      <Text>{label}</Text>
      <Title level={3}>{displayValue}</Title>
      {planned != null && <Text>Planned: {planned}</Text>}
    </Card>
  );
}

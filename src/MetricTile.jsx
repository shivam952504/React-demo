import { Card, Typography } from "antd";

const { Text, Title } = Typography;

function MetricTile({ label, planned, actual, value, isPercent }) {
  const isSentiment =
    value &&
    typeof value === "object" &&
    (
      value.favourable != null ||
      value.favorable != null ||
      value.neutral != null ||
      value.unfavourable != null ||
      value.unfavorable != null
    );

  /* ---------------- SENTIMENT TILE (ESAT / NPS etc.) ---------------- */
  if (isSentiment) {
    const fav = value.favourable ?? value.favorable ?? 0;
    const neu = value.neutral ?? 0;
    const unf = value.unfavourable ?? value.unfavorable ?? 0;

    return (
      <Card className="metric-tile">
        <Text style={{ fontSize: 13, fontWeight: 500 }}>{label}</Text>

        <div style={{ marginTop: 12 }}>
          <Text>Fav: {fav}{isPercent ? "%" : ""}</Text><br />
          <Text>Neu: {neu}{isPercent ? "%" : ""}</Text><br />
          <Text>Unf: {unf}{isPercent ? "%" : ""}</Text>
        </div>
      </Card>
    );
  }

  /* ---------------- NORMAL NUMERIC TILE ---------------- */
  const getValueColor = () => {
    if (planned == null || actual == null) return "#141827";
    return actual >= planned ? "#15803d" : "#b91c1c";
  };

  let displayValue = "N/A";
  if (actual != null) {
    displayValue = isPercent ? `${actual}%` : actual;
  }

  return (
    <Card className="metric-tile">
      <Text style={{ fontSize: 13, fontWeight: 500 }}>{label}</Text>

      <Title
        level={3}
        style={{
          margin: "8px 0 0",
          color: getValueColor(),
        }}
      >
        {displayValue}
      </Title>

      {planned != null && (
        <Text style={{ fontSize: 12, color: "#9ca3af" }}>
          Planned: {planned}
        </Text>
      )}
    </Card>
  );
}

export default MetricTile;

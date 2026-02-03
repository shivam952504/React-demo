import { Card, Typography } from "antd";

const { Text, Title } = Typography;

function MetricTile({ label, planned, actual, value, isPercent }) {
  const isObjectValue = typeof value === "object" && value !== null;

  // Normalize sentiment values (handles UK + US spelling)
  const sentiment = isObjectValue
    ? {
        fav: value.favourable ?? value.favorable ?? 0,
        neu: value.neutral ?? 0,
        unf: value.unfavourable ?? value.unfavorable ?? 0,
      }
    : null;

  let displayValue = "N/A";

  if (!isObjectValue) {
    if (value !== undefined && value !== null) {
      displayValue = isPercent ? `${value}%` : value;
    } else if (actual !== undefined && actual !== null) {
      displayValue = actual;
    }
  }

  const getValueColor = () => {
    if (planned == null || actual == null) return "#141827";
    return actual >= planned ? "#15803d" : "#b91c1c";
  };

  return (
    <Card
      className="metric-tile"
      style={{
        borderRadius: 18,
        minHeight: 140,
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        border: "1px solid #eef2f7",
        boxShadow:
          "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.10)",
        transition: "all 0.25s ease",
        cursor: "pointer",
      }}
      styles={{ body: { padding: "18px 22px" } }}
    >
      {/* Label */}
      <Text
        style={{
          fontSize: 13,
          color: "#6b7280",
          fontWeight: 500,
        }}
      >
        {label}
      </Text>

      <div style={{ marginTop: 10 }}>
        {/* ESAT / NPS */}
        {isObjectValue ? (
          <>
            <Text>Fav: {sentiment.fav}%</Text>
            <br />
            <Text>Neu: {sentiment.neu}%</Text>
            <br />
            <Text>Unf: {sentiment.unf}%</Text>
          </>
        ) : (
          <Title
            level={3}
            style={{
              margin: 0,
              fontWeight: 600,
              letterSpacing: "-0.3px",
              color: getValueColor(),
            }}
          >
            {displayValue}
          </Title>
        )}
      </div>

      {/* Planned */}
      {planned != null && !isObjectValue && (
        <Text
          style={{
            fontSize: 12,
            color: "#9ca3af",
          }}
        >
          Planned: {planned}
        </Text>
      )}
    </Card>
  );
}

export default MetricTile;

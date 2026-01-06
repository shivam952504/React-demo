import { Card, Typography } from "antd";

const { Text, Title } = Typography;

function MetricTile({ label, planned, actual, value, isPercent }) {
  // -----------------------------
  // Resolve display value safely
  // -----------------------------
  let displayValue = "-";

  if (value !== undefined && value !== null) {
    displayValue = isPercent ? `${value}%` : value;
  } else if (actual !== undefined && actual !== null) {
    displayValue = actual;
  }

  // -----------------------------
  // Color logic
  // -----------------------------
  const getValueColor = () => {
    if (planned == null || actual == null) return "#111827"; // neutral
    return actual >= planned ? "#15803d" : "#b91c1c"; // green / red
  };

  return (
    <Card
      className="metric-tile"
      style={{
        borderRadius: 18,
        height: "100%",
        background:
          "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        border: "1px solid #eef2f7",
        boxShadow:
          "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.10)",
        transition: "all 0.25s ease",
        cursor: "pointer",
      }}
      bodyStyle={{
        padding: "18px 22px",
      }}
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

      {/* Main Value */}
      <Title
        level={3}
        style={{
          marginTop: 10,
          marginBottom: 6,
          fontWeight: 700,
          letterSpacing: "-0.3px",
          color: getValueColor(),
        }}
      >
        {displayValue}
      </Title>

      {/* Planned */}
      {planned != null && (
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

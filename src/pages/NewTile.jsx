import { Card, Typography } from "antd";

const { Text, Title } = Typography;

/**
 * MetricTile
 * Handles:
 * - planned + actual metrics
 * - value-only metrics
 * - percentage formatting
 * - green/red color logic
 */
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
  // Color logic (planned vs actual)
  // -----------------------------
  const getValueColor = () => {
    if (
      planned === undefined ||
      planned === null ||
      actual === undefined ||
      actual === null
    ) {
      return "#000"; // default black
    }
    return actual >= planned ? "#2e7d32" : "#c62828"; // green / red
  };

  return (
    <Card
      style={{
        borderRadius: 12,
        height: "100%",
      }}
      bodyStyle={{
        padding: 16,
      }}
    >
      {/* Label */}
      <Text type="secondary">{label}</Text>

      {/* Main Value */}
      <Title
        level={3}
        style={{
          marginTop: 8,
          marginBottom: 4,
          color: getValueColor(),
        }}
      >
        {displayValue}
      </Title>

      {/* Planned value (only if present) */}
      {planned !== undefined && planned !== null && (
        <Text type="secondary">Planned: {planned}</Text>
      )}
    </Card>
  );
}

export default MetricTile;

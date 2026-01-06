import { Card, Typography } from "antd";

const { Text, Title } = Typography;

function MetricTile({ label, planned, actual, value, isPercent }) {
  const displayValue =
    value !== undefined
      ? `${value}${isPercent ? "%" : ""}`
      : actual !== undefined
      ? actual
      : "-";

  return (
    <Card style={{ borderRadius: 12 }}>
      <Text type="secondary">{label}</Text>

      <Title level={3} style={{ marginTop: 8 }}>
        {displayValue}
      </Title>

      {planned !== undefined && (
        <Text type="secondary">Planned: {planned}</Text>
      )}
    </Card>
  );
}

export default MetricTile;

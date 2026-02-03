import { Card, Typography } from "antd";

const { Text, Title } = Typography;

function MetricTile({
  label,
  planned,
  actual,
  isPercent,
  favourable,
  neutral,
  unfavourable
}) {
  const isSentimentTile =
    actual == null &&
    (favourable != null || neutral != null || unfavourable != null);

  const getValueColor = () => {
    if (planned == null || actual == null) return "#141827";
    return actual >= planned ? "#15803d" : "#b91c1c";
  };

  return (
    <Card className="metric-tile">
      <Text className="metric-label">{label}</Text>

      <div style={{ marginTop: 10 }}>
        {isSentimentTile ? (
          <>
            <Text>Fav: {favourable != null ? `${favourable}%` : "N/A"}</Text>
            <br />
            <Text>Neu: {neutral != null ? `${neutral}%` : "N/A"}</Text>
            <br />
            <Text>Unf: {unfavourable != null ? `${unfavourable}%` : "N/A"}</Text>
          </>
        ) : (
          <>
            <Title
              level={3}
              style={{
                margin: 0,
                color: getValueColor(),
              }}
            >
              {actual != null
                ? isPercent
                  ? `${actual}%`
                  : actual
                : "N/A"}
            </Title>

            {planned != null && (
              <Text className="metric-planned">
                Planned: {planned}
              </Text>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

export default MetricTile;

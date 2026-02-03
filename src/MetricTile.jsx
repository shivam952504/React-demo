import { Card, Typography } from "antd";

const { Text, Title } = Typography;

function MetricTile({ label, planned, actual, value, isPercent }) {
  // Detect ESAT-style sentiment (actual is missing but sentiment exists)
  const hasSentiment =
    actual == null &&
    value &&
    (
      value.favourable != null ||
      value.favorable != null ||
      value.neutral != null ||
      value.unfavourable != null ||
      value.unfavorable != null
    );

  const fav = value?.favourable ?? value?.favorable;
  const neu = value?.neutral;
  const unf = value?.unfavourable ?? value?.unfavorable;

  const getValueColor = () => {
    if (planned == null || actual == null) return "#141827";
    return actual >= planned ? "#15803d" : "#b91c1c";
  };

  return (
    <Card className="metric-tile">
      <Text className="metric-label">{label}</Text>

      <div style={{ marginTop: 10 }}>
        {hasSentiment ? (
          <>
            <Text>Fav: {fav != null ? `${fav}%` : "N/A"}</Text>
            <br />
            <Text>Neu: {neu != null ? `${neu}%` : "N/A"}</Text>
            <br />
            <Text>Unf: {unf != null ? `${unf}%` : "N/A"}</Text>
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

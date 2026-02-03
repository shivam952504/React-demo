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

  const fav = value?.favourable ?? value?.favorable;
  const neu = value?.neutral;
  const unf = value?.unfavourable ?? value?.unfavorable;

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
        {isSentiment ? (
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
                fontWeight: 600,
                letterSpacing: "-0.3px",
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
              <Text
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                }}
              >
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

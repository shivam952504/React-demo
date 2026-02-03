import { Card, Typography } from "antd";

const { Text, Title } = Typography;

function MetricTile({ label, planned, actual, value, isPercent }) {
  /**
   * IMPORTANT:
   * We DO NOT decide sentiment by "object".
   * We decide sentiment ONLY if sentiment keys exist.
   * This avoids breaking Headcount, Attrition, etc.
   */
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

  // ---------- SENTIMENT VALUES ----------
  const fav = value?.favourable ?? value?.favorable ?? null;
  const neu = value?.neutral ?? null;
  const unf = value?.unfavourable ?? value?.unfavorable ?? null;

  // ---------- NORMAL DISPLAY VALUE ----------
  let displayValue = "N/A";
  if (actual !== undefined && actual !== null) {
    displayValue = isPercent ? `${actual}%` : actual;
  }

  // ---------- COLOR LOGIC (UNCHANGED) ----------
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
        background:
          "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        border: "1px solid #eef2f7",
        boxShadow:
          "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.10)",
        transition: "all 0.25s ease",
        cursor: "pointer",
      }}
      styles={{ body: { padding: "18px 22px" } }}
    >
      {/* LABEL */}
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
        {/* ---------- SENTIMENT TILE ---------- */}
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
            {/* ---------- NORMAL KPI TILE ---------- */}
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

{typeof metric.actual === "object" ? (
  <>
    <Text strong>Favourable: {metric.actual.favourable}%</Text>
    <br />
    <Text type="secondary">Neutral: {metric.actual.neutral}%</Text>
    <br />
    <Text type="danger">Unfavourable: {metric.actual.unfavourable}%</Text>
  </>
) : (
  <Text strong>
    {metric.actual}
    {metric.is_percent ? "%" : ""}
  </Text>
)}

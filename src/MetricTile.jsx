return (
  <Row
    className="metric-tile"
    style={{
      borderRadius: 18,
      height: "100%",
      background:
        "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
      border: "1px solid #eef2f7",
      boxShadow:
        "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.10)",
      padding: "18px 22px",
    }}
  >
    {/* LABEL */}
    <Col span={24}>
      <Typography.Text
        style={{
          fontSize: 13,
          color: "#6b7280",
          fontWeight: 500,
        }}
      >
        {label}
      </Typography.Text>
    </Col>

    {/* VALUE */}
    <Col span={24} style={{ marginTop: 10 }}>
      {isObjectValue ? (
        <>
          <Typography.Text>Fav: {value.favourable}%</Typography.Text>
          <br />
          <Typography.Text>Neu: {value.neutral}%</Typography.Text>
          <br />
          <Typography.Text>Unf: {value.unfavourable}%</Typography.Text>
        </>
      ) : (
        <Typography.Title
          level={3}
          style={{
            margin: 0,
            fontWeight: 700,
            letterSpacing: "-0.3px",
            color: getValueColor(),
          }}
        >
          {displayValue}
        </Typography.Title>
      )}
    </Col>

    {/* PLANNED */}
    {planned != null && !isObjectValue && (
      <Col span={24} style={{ marginTop: 6 }}>
        <Typography.Text
          style={{
            fontSize: 12,
            color: "#9ca3af",
          }}
        >
          Planned: {planned}
        </Typography.Text>
      </Col>
    )}
  </Row>
);

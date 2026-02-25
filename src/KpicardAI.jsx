const kpiConfig = [
  { key: "downloads", label: "Downloads" },
  { key: "dialables", label: "Dialables" },
  { key: "attempts", label: "Attempts" },
  { key: "connect_rate", label: "Connect %" },
  { key: "rpc_rate", label: "RPC %" },
  { key: "ptp_rate", label: "PTP %" },
  { key: "urgency_rate", label: "Urgency %" }
];

<Row gutter={[16, 16]}>
  {kpiConfig.map(({ key, label }) => {
    const item = k[key];
    if (!item) return null;

    const delta = item.delta_vs_yesterday;
    const trend = item.trend || (delta >= 0 ? "up" : "down");

    return (
      <Col key={key} xs={24} sm={12} md={8} lg={6}>
        <KpiCard
          title={label}
          value={`${item.value}${item.unit || ""}`}
          delta={delta}
          trend={trend}
        />
      </Col>
    );
  })}
</Row>


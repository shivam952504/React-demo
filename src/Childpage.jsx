import { Table, Typography } from "antd";

const { Text } = Typography;

function renderMetric(metric) {
  if (!metric || metric.actual == null) return "-";
  return `${metric.actual}${metric.is_percent ? "%" : ""}`;
}

function renderPlannedActual(metric) {
  if (!metric) return "-";

  return (
    <>
      {metric.planned != null && (
        <>
          <Text type="secondary">P: {metric.planned}</Text>
          <br />
        </>
      )}
      {metric.actual != null && (
        <Text strong>
          A: {metric.actual}
          {metric.is_percent ? "%" : ""}
        </Text>
      )}
    </>
  );
}

function normalize(rows = []) {
  return rows.map((row, idx) => {
    const map = {};
    row.metrics.forEach((m) => (map[m.id] = m));

    return {
      key: idx,
      geo: row.geo,
      job_code: row.job_code,
      headcount: map.headcount,
      support_nb: map.support_nonbill,
      attrition: map.attrition,
      volume: map.volume_monthly,
      shrinkage: map.shrinkage,
      kpi: map.kpi_attainment,
      bonus: map.bonus,
      penalty: map.penalty,
      su: map.su,
      nps: map.nps,
      esat: map.esat,
      sentiment: map.sentiment,
    };
  });
}

function ClientGeoJobTable({ rows = [] }) {
  const dataSource = normalize(rows);

  const columns = [
    { title: "GEO", dataIndex: "geo", fixed: "left" },
    { title: "Job Code", dataIndex: "job_code" },
    {
      title: "Headcount",
      dataIndex: "headcount",
      render: renderPlannedActual,
    },
    {
      title: "Support NB",
      dataIndex: "support_nb",
      render: renderPlannedActual,
    },
    {
      title: "Attrition rate",
      dataIndex: "attrition",
      render: renderMetric,
    },
    {
      title: "Volume Monthly",
      dataIndex: "volume",
      render: renderMetric,
    },
    {
      title: "Shrinkage",
      dataIndex: "shrinkage",
      render: renderMetric,
    },
    {
      title: "KPI",
      dataIndex: "kpi",
      render: renderMetric,
    },
    {
      title: "Bonus",
      dataIndex: "bonus",
      render: renderMetric,
    },
    {
      title: "Penalty",
      dataIndex: "penalty",
      render: renderMetric,
    },
    {
      title: "SU",
      dataIndex: "su",
      render: renderMetric,
    },
    {
      title: "NPS",
      dataIndex: "nps",
      render: renderMetric,
    },
    {
      title: "ESAT",
      dataIndex: "esat",
      render: renderMetric,
    },
  ];

  return (
    <div className="client-kpi-table-wrapper">
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        size="middle"
        scroll={{ x: "max-content", y: 320 }}
      />
    </div>
  );
}

export default ClientGeoJobTable;

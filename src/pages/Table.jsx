import { Table, Input, Typography, Tag } from "antd";
import { useMemo, useState } from "react";

const { Text, Link } = Typography;

function renderPlannedActual(metric) {
  if (!metric) return "-";

  const { planned, actual, is_percent } = metric;

  if (planned == null && actual == null) return "-";

  return (
    <>
      {planned != null && (
        <>
          <Text type="secondary">P: {planned}</Text>
          <br />
        </>
      )}
      {actual != null && (
        <Text strong>
          A: {actual}
          {is_percent ? "%" : ""}
        </Text>
      )}
    </>
  );
}

function renderActual(metric) {
  if (!metric || metric.actual == null) return "-";
  return `${metric.actual}${metric.is_percent ? "%" : ""}`;
}

function ClientKpiTable({ tableRows = [] }) {
  const [searchText, setSearchText] = useState("");

  const dataSource = useMemo(() => {
    const normalized = normalizeTableRows(tableRows);

    if (!searchText) return normalized;

    return normalized.filter((row) =>
      row.client.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [tableRows, searchText]);

  const columns = [
    {
      title: "Client",
      dataIndex: "client",
      fixed: "left",
      width: 220,
      render: (text, record) => (
        <Link onClick={() => console.log("Go to:", record.url)}>
          {text}
        </Link>
      ),
    },
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
      render: renderActual,
    },
    {
      title: "Volume Monthly",
      dataIndex: "volume",
      render: renderActual,
    },
    {
      title: "Shrinkage",
      dataIndex: "shrinkage",
      render: renderActual,
    },
    {
      title: "KPI",
      dataIndex: "kpi",
      render: (metric) =>
        metric ? (
          <>
            <Text type="secondary">C: {metric.current}%</Text>
            <br />
            <Text type="secondary">Y: {metric.ytd}%</Text>
          </>
        ) : (
          "-"
        ),
    },
    {
      title: "Bonus",
      dataIndex: "bonus",
      render: renderActual,
    },
    {
      title: "Penalty",
      dataIndex: "penalty",
      render: renderActual,
    },
    {
      title: "SU",
      dataIndex: "su",
      render: renderActual,
    },
    {
      title: "NPS",
      dataIndex: "nps",
      render: renderActual,
    },
    {
      title: "ESAT",
      dataIndex: "esat",
      render: renderActual,
    },
  ];

  return (
    <div className="client-kpi-wrapper">
      <div className="client-kpi-header">
        <div className="client-kpi-title">
          Client Level KPIs <Tag>All geos</Tag>
        </div>

        <Input.Search
          placeholder="Search client..."
          allowClear
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 220 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        scroll={{ x: 1600, y: 420 }}
        size="middle"
      />
    </div>
  );
}

export default ClientKpiTable;

/* ---------- helper ---------- */
function normalizeTableRows(tableRows = []) {
  return tableRows.map((row) => {
    const metricMap = {};
    row.metrics.forEach((m) => {
      metricMap[m.id] = m;
    });

    return {
      key: row.client_name,
      client: row.client_name,
      url: row.url,
      headcount: metricMap.headcount,
      support_nb: metricMap.support_nonbill,
      attrition: metricMap.attrition,
      volume: metricMap.volume_monthly,
      shrinkage: metricMap.shrinkage,
      kpi: metricMap.kpi_attainment,
      bonus: metricMap.bonus,
      penalty: metricMap.penalty,
      su: metricMap.su,
      nps: metricMap.nps,
      esat: metricMap.esat,
    };
  });
}

import { Table, Input, Typography, Tag } from "antd";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const { Text } = Typography;

/* ---------- helpers ---------- */

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

/* ---------- main component ---------- */

function ClientKpiTable({ tableRows = [] }) {
  const navigate = useNavigate();
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
        <a
          onClick={() =>
            navigate(`/client/${record.url.split("/")[1]}/landing`)
          }
          style={{ cursor: "pointer" }}
        >
          {text}
        </a>
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
      render: (esat) => {
        if (!esat) return "-";
        return (
          <>
            <div>Fav: {esat.favourable}%</div>
            <div>Neu: {esat.neutral}%</div>
            <div>Unf: {esat.unfavourable}%</div>
          </>
        );
      },
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
        scroll={{ x: "max-content", y: 420 }}
        size="middle"
        tableLayout="fixed"
      />
    </div>
  );
}

export default ClientKpiTable;

/* ---------- normalization ---------- */

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
      esat: metricMap.esat, // 👈 object handled safely
    };
  });
}


import { Card, Typography } from "antd";

const { Text, Title } = Typography;

function MetricTile({ label, planned, actual, value, isPercent }) {
  const isObjectValue = typeof value === "object" && value !== null;

  let displayValue = "-";

  if (!isObjectValue) {
    if (value !== undefined && value !== null) {
      displayValue = isPercent ? `${value}%` : value;
    } else if (actual !== undefined && actual !== null) {
      displayValue = actual;
    }
  }

  const getValueColor = () => {
    if (planned == null || actual == null) return "#141827";
    return actual >= planned ? "#15803d" : "#b91c1c";
  };

  return (
    <Card
      className="metric-tile"
      style={{
        borderRadius: 18,
        height: "100%",
        background:
          "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        border: "1px solid #eef2f7",
        boxShadow:
          "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.10)",
        transition: "all 0.25s ease",
        cursor: "pointer",
      }}
      bodyStyle={{ padding: "18px 22px" }}
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
        {isObjectValue ? (
          <>
            <Text>Fav: {value.favourable}%</Text>
            <br />
            <Text>Neu: {value.neutral}%</Text>
            <br />
            <Text>Unf: {value.unfavourable}%</Text>
          </>
        ) : (
          <Title
            level={3}
            style={{
              margin: 0,
              fontWeight: 700,
              letterSpacing: "-0.3px",
              color: getValueColor(),
            }}
          >
            {displayValue}
          </Title>
        )}
      </div>

      {planned != null && !isObjectValue && (
        <Text
          style={{
            fontSize: 12,
            color: "#9ca3af",
          }}
        >
          Planned: {planned}
        </Text>
      )}
    </Card>
  );
}

export default MetricTile;

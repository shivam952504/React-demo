import { Table, Typography } from "antd";

const { Text } = Typography;

/* ---------------- helpers (SAME as ClientKpiTable) ---------------- */

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

/* ---------------- normalization ---------------- */

function normalize(rows = []) {
  return rows.map((row, idx) => {
    const metricMap = {};
    row.metrics.forEach((m) => {
      metricMap[m.id] = m;
    });

    return {
      key: idx,
      geo: row.geo,
      job_code: row.job_code,

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
      esat: metricMap.esat, // OBJECT (handled safely)
    };
  });
}

/* ---------------- main component ---------------- */

function ClientGeoJobTable({ rows = [] }) {
  const dataSource = normalize(rows);

  /** find which metrics actually exist */
  const availableMetrics = {};
  dataSource.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (row[key] != null && key !== "key" && key !== "geo" && key !== "job_code") {
        availableMetrics[key] = true;
      }
    });
  });

  /* ---------------- dynamic columns (SAME idea as ClientKpiTable) ---------------- */

  const columns = [
    {
      title: "GEO",
      dataIndex: "geo",
      fixed: "left",
    },
    {
      title: "Job Code",
      dataIndex: "job_code",
    },

    availableMetrics.headcount && {
      title: "Headcount",
      dataIndex: "headcount",
      render: renderPlannedActual,
    },

    availableMetrics.support_nb && {
      title: "Support NB",
      dataIndex: "support_nb",
      render: renderPlannedActual,
    },

    availableMetrics.attrition && {
      title: "Attrition rate",
      dataIndex: "attrition",
      render: renderMetric,
    },

    availableMetrics.volume && {
      title: "Volume Monthly",
      dataIndex: "volume",
      render: renderMetric,
    },

    availableMetrics.shrinkage && {
      title: "Shrinkage",
      dataIndex: "shrinkage",
      render: renderMetric,
    },

    availableMetrics.kpi && {
      title: "KPI",
      dataIndex: "kpi",
      render: renderMetric,
    },

    availableMetrics.bonus && {
      title: "Bonus",
      dataIndex: "bonus",
      render: renderMetric,
    },

    availableMetrics.penalty && {
      title: "Penalty",
      dataIndex: "penalty",
      render: renderMetric,
    },

    availableMetrics.su && {
      title: "SU",
      dataIndex: "su",
      render: renderMetric,
    },

    availableMetrics.nps && {
      title: "NPS",
      dataIndex: "nps",
      render: renderMetric,
    },

    availableMetrics.esat && {
      title: "ESAT",
      dataIndex: "esat",
      render: (esat) => {
        if (!esat || esat.actual == null) return "-";
        return (
          <>
            <div>Fav: {esat.actual.favourable ?? 0}%</div>
            <div>Neu: {esat.actual.neutral ?? 0}%</div>
            <div>Unf: {esat.actual.unfavourable ?? 0}%</div>
          </>
        );
      },
    },
  ].filter(Boolean); // 🔑 removes hidden columns

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

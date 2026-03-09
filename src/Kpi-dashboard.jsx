
import { useEffect, useState } from "react";
import { Table, Row, Col, Card } from "antd";
import LoaderOverlay from "../../loader/LoaderOverlay";

function KeyMetricsSummary() {

  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {

    setLoading(true);

    try {

      const res = await fetch("http://localhost:9009/api/client/concora/key-metrics");
      const json = await res.json();

      transformData(json);

    } catch (err) {
      console.error("Key Metrics Error", err);
    }

    setLoading(false);
  };

  const getColor = (value) => {

    if (value === "-" || value === null) return "";

    if (value >= 95) return "#e6f7ff";
    if (value >= 85) return "#fffbe6";

    return "#fff1f0";
  };

  const transformData = (data) => {

    const dates = Object.keys(data);

    const metrics = [
      "AHT",
      "CSAT",
      "CallQuality",
      "Adherence",
      "ProductionHours",
      "Absenteeism",
      "Shrinkage",
      "Attrition"
    ];

    const tableColumns = [
      {
        title: "Metric",
        dataIndex: "metric",
        key: "metric",
        fixed: "left",
        width: 220
      },
      {
        title: "Target",
        dataIndex: "target",
        key: "target",
        align: "center",
        width: 120
      }
    ];

    dates.forEach((date) => {

      tableColumns.push({
        title: date,
        dataIndex: date,
        key: date,
        align: "center",
        width: 90,
        render: (value) => {

          const bg = getColor(value);

          return (
            <div
              style={{
                background: bg,
                padding: "6px",
                borderRadius: 4
              }}
            >
              {value}
            </div>
          );
        }
      });

    });

    const tableRows = metrics.map(metric => {

      const row = {
        metric,
        target: "-"
      };

      dates.forEach(date => {

        const val = data[date][metric];

        if (typeof val === "object") {
          row[date] = val?.overall ?? "-";
        } else {
          row[date] = val ?? "-";
        }

      });

      return row;

    });

    setColumns(tableColumns);
    setRows(tableRows);

    const latest = dates[dates.length - 1];

    setSummary({
      aht: tableRows.find(r => r.metric === "AHT")?.[latest],
      csat: tableRows.find(r => r.metric === "CSAT")?.[latest],
      adherence: tableRows.find(r => r.metric === "Adherence")?.[latest],
      quality: tableRows.find(r => r.metric === "CallQuality")?.[latest]
    });
  };

  return (

    <div style={{ padding: 20 }}>

      <LoaderOverlay show={loading} />

      {/* KPI CARDS /}

      <Row gutter={16} style={{ marginBottom: 20 }}>

        <Col span={6}>
          <Card>
            <div style={{ fontSize: 14 }}>AHT (CS)</div>
            <div style={{ fontSize: 28, fontWeight: 600 }}>
              {summary.aht ?? "-"}
            </div>
          </Card>
        </Col>

        <Col span={6}>
          <Card>
            <div style={{ fontSize: 14 }}>CSAT</div>
            <div style={{ fontSize: 28, fontWeight: 600 }}>
              {summary.csat ?? "-"}
            </div>
          </Card>
        </Col>

        <Col span={6}>
          <Card>
            <div style={{ fontSize: 14 }}>Overall Quality</div>
            <div style={{ fontSize: 28, fontWeight: 600 }}>
              {summary.quality ?? "-"}
            </div>
          </Card>
        </Col>

        <Col span={6}>
          <Card>
            <div style={{ fontSize: 14 }}>Adherence</div>
            <div style={{ fontSize: 28, fontWeight: 600 }}>
              {summary.adherence ?? "-"}
            </div>
          </Card>
        </Col>

      </Row>

      {/ METRICS TABLE */}

      <Table
        columns={columns}
        dataSource={rows}
        rowKey="metric"
        bordered
        pagination={false}
        scroll={{ x: "max-content" }}
      />

    </div>
  );
}

export default KeyMetricsSum;

<Route path="key-metrics" element={<KeyMetricsSummary />} />

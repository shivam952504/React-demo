import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Skeleton, Card, Table, Row, Col } from "antd";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from "recharts";

export default function KeyMetricsSummary() {
  const { clientslug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKeyMetrics = async () => {
      setLoading(true);

      const res = await fetch(
        `http://localhost:9009/api/client/${clientslug}/executive-summary-lob`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ geo: "ALL", job: "ALL" }),
        }
      );

      const json = await res.json();
      setData(json.result);
      setLoading(false);
    };

    fetchKeyMetrics();
  }, [clientslug]);

  if (loading || !data) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  const { dashboard = {}, tables = [] } = data;
  const { overall, per_lob = [], top_underperformers = [] } = dashboard;

  return (
    <>
      {/* SUMMARY */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <h4>Overall Target Achievement</h4>
            <h2>{overall.achievement_pct}%</h2>
            <p>{overall.met}/{overall.total} metrics met</p>
          </Card>
        </Col>

        <Col span={6}>
          <Card>
            <h4>Metrics Met vs Missed</h4>
            <h2>{overall.met} / {overall.total}</h2>
            <p>Missed: {overall.missed}</p>
          </Card>
        </Col>

        <Col span={12}>
          <Card>
            <h4>Underperforming LOBs</h4>
            {top_underperformers.map(lob => (
              <div key={lob.lob}>
                {lob.lob} – {lob.achievement_pct}%
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {/* CHARTS */}
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="Hit Rate % per LOB">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={per_lob}>
                <XAxis dataKey="lob" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="achievement_pct" fill="#1677ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Met vs Missed Metrics per LOB">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={per_lob}>
                <XAxis dataKey="lob" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="met" fill="#52c41a" />
                <Bar dataKey="missed" fill="#ff4d4f" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* TABLES */}
      {tables.map(table => (
        <Card
          key={table.title}
          title={table.title.replace(/_/g, " ").toUpperCase()}
          extra={`Source: ${table.file_name}`}
          style={{ marginTop: 24 }}
        >
          <Table
            bordered
            pagination={false}
            columns={table.columns.map(col => ({
              title: col,
              dataIndex: col,
              key: col,
            }))}
            dataSource={table.rows.map((row, i) => ({
              key: i,
              ...row,
            }))}
          />
        </Card>
      ))}
    </>
  );
}

<Tabs
  activeKey={tab}
  onChange={(key) =>
    navigate(`/client/${clientslug}/landing/${key}`, { replace: true })
  }
  items={[
    { key: "overview", label: "Overview", children: <Overview /> },
    { key: "key-metrics", label: "Key Metrics Summary", children: <KeyMetricsSummary /> },
    { key: "people", label: "People Summary", children: <PeopleSummary /> },
  ]}
/>

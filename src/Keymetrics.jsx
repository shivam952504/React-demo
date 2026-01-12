import { Skeleton, Card, Table, Row, Col } from "antd";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from "recharts";

function KeyMetricsSummary({ data }) {
  if (!data) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  const { dashboard = {}, tables = [] } = data;
  const { overall, per_lob = [], top_underperformers = [] } = dashboard;

  return (
    <>
      {/* ===== SUMMARY CARDS ===== */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <h4>Overall Target Achievement</h4>
            <h2>{overall?.achievement_pct}%</h2>
            <p>{overall?.met} / {overall?.total} metrics met</p>
          </Card>
        </Col>

        <Col span={6}>
          <Card>
            <h4>Metrics Met vs Missed</h4>
            <h2>{overall?.met} / {overall?.total}</h2>
            <p>Missed: {overall?.missed}</p>
          </Card>
        </Col>

        <Col span={12}>
          <Card>
            <h4>Underperforming LOBs</h4>
            {top_underperformers.map((lob) => (
              <div key={lob.lob}>
                {lob.lob} – {lob.achievement_pct}%
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {/* ===== CHARTS ===== */}
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

      {/* ===== LOB TABLES ===== */}
      {tables.map((table) => (
        <Card
          key={table.title}
          title={table.title.replace(/_/g, " ").toUpperCase()}
          style={{ marginTop: 24 }}
          extra={<span>Source: {table.file_name}</span>}
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

export default KeyMetricsSummary;

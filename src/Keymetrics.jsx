import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Skeleton, Table } from "antd";

export default function KeyMetricsSummary() {
  const { clientSlug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);

      const res = await fetch(
        `http://localhost:9009/api/client/${clientSlug}/key-metrics-summary`,
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

    fetchMetrics();
  }, [clientSlug]);

  if (loading || !data) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  return (
    <div>
      <h2>LOB Performance Dashboard</h2>

      {/* OVERALL SUMMARY */}
      <div style={{ marginBottom: 24 }}>
        <strong>Overall Target Achievement:</strong>{" "}
        {data.dashboard?.overall?.achievement_pct}%
      </div>

      {/* TABLES */}
      {Array.isArray(data.tables) &&
        data.tables.map((table) => {
          const columns = table.columns.map((col) => ({
            title: col,
            dataIndex: col,
            key: col,
          }));

          const rows = table.rows.map((row, index) => ({
            key: index,
            ...row.values,
          }));

          return (
            <div key={table.title} style={{ marginBottom: 40 }}>
              <h3>{table.title.replaceAll("_", " ").toUpperCase()}</h3>
              <Table
                columns={columns}
                dataSource={rows}
                pagination={false}
                bordered
              />
            </div>
          );
        })}
    </div>
  );
}

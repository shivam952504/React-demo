import { Table, Input, Typography, Tag } from "antd";
import { useMemo, useState } from "react";

const { Text, Link } = Typography;

function ClientKpiTable({ data = [] }) {
  const [searchText, setSearchText] = useState("");

  // 🔍 Filter by client name
  const filteredData = useMemo(() => {
    if (!searchText) return data;

    return data.filter((item) =>
      item.client.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [data, searchText]);

  const columns = [
    {
      title: "Client",
      dataIndex: "client",
      key: "client",
      fixed: "left",
      width: 220,
      render: (text) => (
        <Link
          onClick={() => {
            console.log("Clicked client:", text);
            // later: navigate(`/client/${text}`)
          }}
        >
          {text}
        </Link>
      ),
    },

    {
      title: "Headcount",
      dataIndex: "headcount",
      render: ({ planned, actual }) => (
        <>
          <Text type="secondary">P: {planned}</Text>
          <br />
          <Text strong>A: {actual}</Text>
        </>
      ),
    },

    {
      title: "Support NB",
      dataIndex: "support_nb",
      render: ({ planned, actual }) => (
        <>
          <Text type="secondary">P: {planned}</Text>
          <br />
          <Text strong>A: {actual}</Text>
        </>
      ),
    },

    {
      title: "Attrition rate",
      dataIndex: "attrition",
      render: (val) => `${val}%`,
    },

    {
      title: "Volume Monthly",
      dataIndex: "volume",
    },

    {
      title: "Shrinkage",
      dataIndex: "shrinkage",
      render: (val) => `${val}%`,
    },

    {
      title: "KPI",
      dataIndex: "kpi",
      render: ({ current, ytd }) => (
        <>
          <Text type="secondary">C: {current}%</Text>
          <br />
          <Text type="secondary">Y: {ytd}%</Text>
        </>
      ),
    },

    {
      title: "Bonus",
      dataIndex: "bonus",
    },

    {
      title: "Penalty",
      dataIndex: "penalty",
    },

    {
      title: "SU",
      dataIndex: "su",
    },

    {
      title: "NPS",
      dataIndex: "nps",
      render: (val) => `${val}%`,
    },

    {
      title: "ESAT",
      dataIndex: "esat",
      render: (val) => `${val}%`,
    },

    {
      title: "Sentiment",
      dataIndex: "sentiment",
      fixed: "right",
      width: 180,
      render: ({ favourable, neutral, unfavourable }) => (
        <div>
          <Tag color="green">Fav: {favourable}%</Tag>
          <Tag color="default">Neu: {neutral}%</Tag>
          <Tag color="red">Unfav: {unfavourable}%</Tag>
        </div>
      ),
    },
  ];

  return (
    <div className="client-kpi-wrapper">
      {/* Header */}
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

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="client"
        pagination={false}
        scroll={{ x: 1600, y: 420 }}
        size="middle"
      />
    </div>
  );
}

export default ClientKpiTable;

.client-kpi-wrapper {
  margin-top: 24px;
  background: #ffffff;
  border-radius: 14px;
  padding: 16px;
  border: 1px solid #eef2f7;
}

.client-kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.client-kpi-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

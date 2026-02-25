export const themeConfig = {
  token: {
    colorPrimary: "#1677ff",
    colorSuccess: "#52c41a",
    colorWarning: "#faad14",
    colorError: "#ff4d4f",
    borderRadius: 12,
    fontFamily: "'Inter', sans-serif",
  },
};

index.html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

  main

import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";
import App from "./App";
import { themeConfig } from "./theme/antdTheme";
import "antd/dist/reset.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ConfigProvider theme={themeConfig}>
    <App />
  </ConfigProvider>
);

snapshotApi

import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const getSnapshot = (date, persona) =>
  API.get(`/snapshot?date=${date}&persona=${persona}`);

mocdata

export const getSnapshot = async () => {
  return {
    data: YOUR_JSON_OBJECT
  };
};

applayout

import { Layout } from "antd";
import Sidebar from "./Sidebar";

const { Content } = Layout;

export default function AppLayout({ children }) {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout style={{ padding: "24px" }}>
        <Content>{children}</Content>
      </Layout>
    </Layout>
  );
}

sidebar

import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

const { Sider } = Layout;

export default function Sidebar() {
  return (
    <Sider
      width={240}
      style={{
        background: "#0f172a",
      }}
    >
      <div style={{
        color: "#fff",
        padding: "20px",
        fontWeight: 600,
        fontSize: 18
      }}>
        Collect Sense AI
      </div>

      <Menu
        theme="dark"
        defaultSelectedKeys={["1"]}
        items={[
          {
            key: "1",
            icon: <DashboardOutlined />,
            label: "Snapshot",
          },
          {
            key: "2",
            icon: <BarChartOutlined />,
            label: "BCD Strategy & Cost",
          },
        ]}
      />
    </Sider>
  );
}

kpicard

import { Card, Typography, Tag } from "antd";

const { Text } = Typography;

export default function KpiCard({
  title,
  value,
  delta,
  trend
}) {
  const color =
    trend === "up"
      ? "success"
      : trend === "down"
      ? "error"
      : "default";

  return (
    <Card
      style={{
        borderRadius: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <Text type="secondary">{title}</Text>

      <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8 }}>
        {value}
      </div>

      <Tag color={color} style={{ marginTop: 8 }}>
        {delta}% vs yesterday
      </Tag>
    </Card>
  );
}

snapshot.jsx
import { Row, Col, Typography } from "antd";
import { useEffect, useState } from "react";
import KpiCard from "../components/cards/KpiCard";
import { getSnapshot } from "../api/snapshotApi";

const { Title } = Typography;

export default function Snapshot() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getSnapshot("2026-02-20", "executive").then((res) =>
      setData(res.data)
    );
  }, []);

  if (!data) return null;

  const kpis = data.primary_kpis;

  return (
    <>
      <Title level={3}>Collections Intelligence Snapshot</Title>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <KpiCard
            title="Downloads"
            value={kpis.downloads.value}
            delta={kpis.downloads.delta_vs_yesterday}
            trend={kpis.downloads.trend}
          />
        </Col>

        <Col span={6}>
          <KpiCard
            title="Dialables"
            value={kpis.dialables.value}
            delta={kpis.dialables.delta_vs_yesterday}
            trend={kpis.dialables.trend}
          />
        </Col>

        <Col span={6}>
          <KpiCard
            title="Attempts"
            value={kpis.attempts.value}
            delta={kpis.attempts.delta_vs_yesterday}
            trend={kpis.attempts.trend}
          />
        </Col>

        <Col span={6}>
          <KpiCard
            title="Connect Rate"
            value={`${kpis.connect_rate.value}%`}
            delta={kpis.connect_rate.delta_vs_yesterday}
            trend="up"
          />
        </Col>
      </Row>
    </>
  );
}

trendchart

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "antd";

export default function TrendChart({ data }) {
  return (
    <Card style={{ borderRadius: 16 }}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="bcd" stroke="#1677ff" />
          <Line type="monotone" dataKey="non_bcd" stroke="#999" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}



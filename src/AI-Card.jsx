import { Card, Typography, Tag } from "antd";

const { Text } = Typography;

export default function LiftCard({
  title,
  value,
  delta,
  impactLabel = "BCD Impact",
  color = "#1677ff"
}) {
  return (
    <Card
      style={{
        borderRadius: 16,
        boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
        height: "100%"
      }}
      bodyStyle={{ padding: 20 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Text type="secondary">{title}</Text>

        <Tag
          style={{
            backgroundColor: color,
            color: "#fff",
            borderRadius: 20,
            border: "none",
            fontWeight: 500
          }}
        >
          {impactLabel}
        </Tag>
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 600,
          marginTop: 16,
          color: color
        }}
      >
        +{value}%
      </div>

      {delta && (
        <Text type="secondary" style={{ marginTop: 8, display: "block" }}>
          +{delta}% MTD
        </Text>
      )}
    </Card>
  );
}

import { Card, Typography, Tag } from "antd";

const { Text } = Typography;

export default function CostCard({
  value,
  delta,
  currency = "USD",
  projectionLabel = "Monthly"
}) {
  return (
    <Card
      style={{
        borderRadius: 16,
        boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
        height: "100%"
      }}
      bodyStyle={{ padding: 20 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Text type="secondary">Projected BCD Cost</Text>

        <Tag
          style={{
            backgroundColor: "#fa8c16",
            color: "#fff",
            borderRadius: 20,
            border: "none",
            fontWeight: 500
          }}
        >
          {projectionLabel}
        </Tag>
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 600,
          marginTop: 16,
          color: "#cf1322"
        }}
      >
        {currency} {value.toLocaleString()}
      </div>

      {delta && (
        <Text type="danger" style={{ marginTop: 8, display: "block" }}>
          +{delta}% MTD
        </Text>
      )}
    </Card>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Snapshot from "./pages/Snapshot";

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/snapshot" />} />
          <Route path="/snapshot" element={<Snapshot />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

inside snapshot.jsx

import LiftCard from "../components/cards/LiftCard";
import CostCard from "../components/cards/CostCard";

<Row gutter={[16, 16]} style={{ marginTop: 24 }}>
  <Col span={6}>
    <LiftCard
      title="RPC Lift"
      value={data.bcd_snapshot.bcd_lift.rpc_lift}
      delta={4.2}
      color="#52c41a"
    />
  </Col>

  <Col span={6}>
    <LiftCard
      title="PTP Lift"
      value={data.bcd_snapshot.bcd_lift.ptp_lift}
      delta={3.1}
      color="#1677ff"
    />
  </Col>

  <Col span={6}>
    <LiftCard
      title="Urgency Lift"
      value={data.bcd_snapshot.bcd_lift.urgency_lift}
      delta={2.6}
      color="#722ed1"
    />
  </Col>

  <Col span={6}>
    <CostCard
      value={data.bcd_snapshot.projected_cost.value}
      delta={12.8}
      currency="USD"
    />
  </Col>
</Row>

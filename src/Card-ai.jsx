<Layout style={{ padding: "32px 40px", background: "#f5f7fa" }}>

  <Content style={{ maxWidth: 1400, margin: "0 auto" }}>

    import { Row, Col, Typography, Button, Divider } from "antd";
import { useEffect, useState } from "react";
import KpiCard from "../components/cards/KpiCard";
import LiftCard from "../components/cards/LiftCard";
import CostCard from "../components/cards/CostCard";
import TrendChart from "../components/charts/TrendChart";
import { getSnapshot } from "../api/snapshotApi";

const { Title, Text } = Typography;

export default function Snapshot() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getSnapshot("2026-02-20", "executive").then((res) =>
      setData(res.data)
    );
  }, []);

  if (!data) return null;

  const k = data.primary_kpis;
  const bcd = data.bcd_snapshot;

  return (
    <>
      {/* PAGE HEADER */}
      <Title level={2} style={{ marginBottom: 0 }}>
        Collections Intelligence Snapshot
      </Title>
      <Text type="secondary">
        Executive dashboard • Updated every 5 minutes
      </Text>

      <Divider />

      {/* PRIMARY DEALER METRICS */}
      <Title level={4}>Primary Dealer Metrics</Title>

      <Row gutter={[16, 16]}>
        <Col span={6}><KpiCard title="Downloads" {...k.downloads} /></Col>
        <Col span={6}><KpiCard title="Dialables" {...k.dialables} /></Col>
        <Col span={6}><KpiCard title="Attempts" {...k.attempts} /></Col>
        <Col span={6}><KpiCard title="Connect %" {...k.connect_rate} /></Col>
        <Col span={6}><KpiCard title="RPC %" {...k.rpc_rate} /></Col>
        <Col span={6}><KpiCard title="PTP %" {...k.ptp_rate} /></Col>
        <Col span={6}><KpiCard title="Urgency %" {...k.urgency_rate} /></Col>
      </Row>

      <Divider />

      {/* BCD STRATEGY CONTROL CENTER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Title level={4}>BCD Strategy Control Center</Title>
        <Button type="primary">Meeting Strategy</Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <KpiCard
            title="Total BCD Passes (MTD)"
            value={bcd.total_bcd_passes}
            delta={4.2}
            trend="up"
          />
        </Col>

        <Col span={6}>
          <KpiCard
            title="Avg BCD Passes per Account"
            value={bcd.avg_pass_per_account}
            delta={0.2}
            trend="up"
          />
        </Col>

        <Col span={6}>
          <KpiCard
            title="BCD Penetration %"
            value={`${bcd.bcd_penetration_pct}%`}
            delta={2.1}
            trend="up"
          />
        </Col>

        <Col span={6}>
          <KpiCard
            title="BCD Attempts to Dialables"
            value={3.32}
            delta={0.1}
            trend="up"
          />
        </Col>
      </Row>

      {/* LIFT SECTION */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={6}>
          <LiftCard
            title="RPC Lift"
            value={bcd.bcd_lift.rpc_lift}
            delta={4.2}
            color="#52c41a"
          />
        </Col>

        <Col span={6}>
          <LiftCard
            title="PTP Lift"
            value={bcd.bcd_lift.ptp_lift}
            delta={3.1}
            color="#1677ff"
          />
        </Col>

        <Col span={6}>
          <LiftCard
            title="Urgency Lift"
            value={bcd.bcd_lift.urgency_lift}
            delta={2.6}
            color="#722ed1"
          />
        </Col>

        <Col span={6}>
          <CostCard
            value={bcd.projected_cost.value}
            delta={12.8}
            currency="USD"
          />
        </Col>
      </Row>

      <Divider />

      {/* PERFORMANCE TRENDS */}
      <Title level={4}>Performance Trends: BCD vs Non-BCD</Title>

      <Row gutter={[16, 16]}>
        <Col span={8}>
          <TrendChart data={data.trends.rpc} />
        </Col>
        <Col span={8}>
          <TrendChart data={data.trends.ptp} />
        </Col>
        <Col span={8}>
          <TrendChart data={data.trends.urgency} />
        </Col>
      </Row>
    </>
  );
}

    

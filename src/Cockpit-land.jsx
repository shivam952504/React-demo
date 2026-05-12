import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Typography, Card, Row, Col, Tag, Button, Descriptions } from "antd";
import {
  ArrowLeftOutlined, BankOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, WarningOutlined,
} from "@ant-design/icons";
import { clients } from "../data/mockData";
import "./InnerPage.css";
import "./ClientDetail.css";

const { Title, Text } = Typography;

const STATUS_CONFIG = {
  "on-track": { color: "#389e0d", bg: "#f6ffed", border: "#b7eb8f", label: "On track", icon: <CheckCircleOutlined /> },
  alert:      { color: "#d46b08", bg: "#fff7e6", border: "#ffd591", label: "Alert",    icon: <ExclamationCircleOutlined /> },
  red:        { color: "#cf1322", bg: "#fff1f0", border: "#ffa39e", label: "At risk",  icon: <WarningOutlined /> },
};

export default function ClientDetail() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const client = clients.find((c) => c.id === clientId);

  if (!client) {
    return (
      <div className="inner-page">
        <Card>
          <Title level={4}>Client not found</Title>
          <Button type="primary" onClick={() => navigate("/")}>Back to Overview</Button>
        </Card>
      </div>
    );
  }

  const status = STATUS_CONFIG[client.status];

  return (
    <div className="client-detail-page">
      {/* Back button only — no header */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/")}
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 500,
          marginBottom: 20,
          borderRadius: 8,
        }}
      >
        Back to Overview
      </Button>

      <Card className="client-detail-header inner-card">
        <div className="client-detail-top">
          <div className="client-detail-avatar">
            <BankOutlined style={{ fontSize: 36, color: "#6b7280" }} />
          </div>
          <div className="client-detail-info">
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <Title level={2} className="client-detail-name">{client.name}</Title>
              <Tag
                icon={status.icon}
                style={{
                  color: status.color, background: status.bg,
                  border: `1px solid ${status.border}`,
                  borderRadius: 20, fontSize: 13, fontWeight: 600,
                  padding: "2px 14px", fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {status.label}
              </Tag>
            </div>
            <Text style={{ fontFamily: "'DM Sans', sans-serif", color: "#6b7280", fontSize: 15 }}>
              {client.industry}
            </Text>
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={8}>
          <Card className="detail-stat-card">
            <Text className="detail-stat-label">Red clients</Text>
            <div className="detail-stat-value" style={{ color: "#cf1322" }}>{client.redClients}</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="detail-stat-card">
            <Text className="detail-stat-label">Active alerts</Text>
            <div className="detail-stat-value" style={{ color: "#d46b08" }}>{client.activeAlerts}</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="detail-stat-card">
            <Text className="detail-stat-label">On track</Text>
            <div className="detail-stat-value" style={{ color: "#389e0d" }}>{client.onTrack}</div>
          </Card>
        </Col>
      </Row>

      <Card className="inner-card" style={{ marginTop: 16 }}>
        <Title level={5} style={{ fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>Client Details</Title>
        <Descriptions column={2} bordered size="middle">
          <Descriptions.Item label="Client Name">{client.name}</Descriptions.Item>
          <Descriptions.Item label="Industry">{client.industry}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag style={{ color: status.color, background: status.bg, border: `1px solid ${status.border}`, borderRadius: 20, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
              {status.label}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Last Refreshed">{client.lastRefreshed}</Descriptions.Item>
        </Descriptions>
      </Card>

      <div className="page-footer" style={{ marginTop: 24 }}>
        <Text className="footer-text">🔒 Confidential — Internal use only</Text>
        <Text className="footer-refresh">Last refreshed {client.lastRefreshed} · Auto-refresh every 5 min</Text>
      </div>
    </div>
  );
}

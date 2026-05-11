@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

.app-layout { min-height: 100vh; background: #f4f5f7; }

.app-header {
  background: #ffffff !important;
  border-bottom: 1px solid #e8eaed;
  height: 56px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
}

.logo-block {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 170px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: #1a1a2e;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-text {
  display: flex;
  flex-direction: column;
  gap: 0px;
  line-height: 1;
}

.logo-title {
  font-family: 'DM Sans', sans-serif;
  font-weight: 700;
  font-size: 13px;
  color: #1a1a2e;
  line-height: 1.1;
  letter-spacing: -0.1px;
  display: block;
}

.logo-subtitle {
  font-family: 'DM Mono', monospace;
  font-size: 8px;
  color: #8c93a4;
  letter-spacing: 0.6px;
  font-weight: 500;
  display: block;
  line-height: 1.2;
}

.main-nav {
  border-bottom: none !important;
  background: transparent !important;
  flex: 1;
  height: 56px;
  line-height: 56px;
}

.main-nav .ant-menu-item {
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  padding: 0 12px;
  top: 0;
  margin-top: 0;
}

.main-nav .ant-menu-item-selected {
  color: #1a1a2e !important;
  font-weight: 600;
  background: transparent !important;
}

.main-nav .ant-menu-item-selected::after {
  border-bottom: 2px solid #1a1a2e !important;
  inset-inline: 12px !important;
}

.main-nav .ant-menu-item:hover {
  color: #1a1a2e !important;
  background: transparent !important;
}

.header-right { display: flex; align-items: center; }

.header-meta { display: flex; align-items: center; gap: 12px; }

.meta-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0;
}

.meta-label {
  font-family: 'DM Mono', monospace;
  font-size: 8px;
  color: #9ca3af;
  letter-spacing: 0.5px;
  font-weight: 500;
  line-height: 1.2;
  text-transform: uppercase;
}

.meta-value {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #1a1a2e;
  line-height: 1.3;
}

.meta-divider { width: 1px; height: 24px; background: #e5e7eb; }

.live-tag {
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  font-weight: 600;
  border-radius: 20px;
  padding: 1px 10px;
}

.app-content { padding: 24px 28px; background: #f4f5f7; }


import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Typography, Input, Select, Tag, Card, Space, Row, Col } from "antd";
import {
  SearchOutlined,
  SortAscendingOutlined,
  LineChartOutlined,
  UserOutlined,
  BulbOutlined,
  BellOutlined,
  BankOutlined,
  ArrowRightOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { clients, summaryStats, navItems } from "../data/mockData";
import "./Overview.css";

const { Title, Text, Paragraph } = Typography;

// Colours matching the original Figma design
const HERO_TAG_COLORS = {
  "trend-analysis":   { color: "#0958d9", bg: "#e6f4ff", border: "#91caff", icon: <LineChartOutlined /> },
  "agent-scorecard":  { color: "#531dab", bg: "#f9f0ff", border: "#d3adf7", icon: <UserOutlined /> },
  "alerts":           { color: "#c41d7f", bg: "#fff0f6", border: "#ffadd2", icon: <BellOutlined /> },
  "focus-areas":      { color: "#389e0d", bg: "#f6ffed", border: "#b7eb8f", icon: <BulbOutlined /> },
};

const STATUS_CONFIG = {
  "on-track": {
    color: "#389e0d", bg: "#f6ffed", border: "#b7eb8f",
    label: "On track", icon: <CheckCircleOutlined />,
  },
  alert: {
    color: "#d46b08", bg: "#fff7e6", border: "#ffd591",
    label: "Alert", icon: <ExclamationCircleOutlined />,
  },
  red: {
    color: "#cf1322", bg: "#fff1f0", border: "#ffa39e",
    label: "At risk", icon: <WarningOutlined />,
  },
};

const SORT_OPTIONS = [
  { value: "name-asc",    label: "Name (A → Z)" },
  { value: "name-desc",   label: "Name (Z → A)" },
  { value: "alerts-desc", label: "Most alerts" },
  { value: "alerts-asc",  label: "Fewest alerts" },
  { value: "status",      label: "Status" },
];

function ClientTile({ client }) {
  const navigate = useNavigate();
  const status = STATUS_CONFIG[client.status];

  return (
    <Card className="client-tile" onClick={() => navigate(client.route)} hoverable>
      <div className="tile-header">
        <div className="tile-avatar">
          <BankOutlined style={{ fontSize: 24, color: "#6b7280" }} />
        </div>
        <div className="tile-status-dot" style={{ background: status.color }} />
      </div>
      <div className="tile-body">
        <Text className="tile-name">{client.name}</Text>
        <Text className="tile-industry">{client.industry}</Text>
      </div>
      <div className="tile-footer">
        <Tag
          icon={status.icon}
          style={{
            color: status.color,
            background: status.bg,
            border: `1px solid ${status.border}`,
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {status.label}
        </Tag>
        <ArrowRightOutlined className="tile-arrow" />
      </div>
    </Card>
  );
}

export default function Overview() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");

  const filteredClients = useMemo(() => {
    let result = [...clients];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.industry.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case "name-asc":    result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "name-desc":   result.sort((a, b) => b.name.localeCompare(a.name)); break;
      case "alerts-desc": result.sort((a, b) => b.activeAlerts - a.activeAlerts); break;
      case "alerts-asc":  result.sort((a, b) => a.activeAlerts - b.activeAlerts); break;
      case "status": {
        const order = { red: 0, alert: 1, "on-track": 2 };
        result.sort((a, b) => order[a.status] - order[b.status]);
        break;
      }
      default: break;
    }
    return result;
  }, [search, sortBy]);

  return (
    <div className="overview-page">

      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-content">
          <div className="hero-text">
            <Text className="hero-eyebrow">DIGITAL COCKPIT</Text>
            <Title level={2} className="hero-title">
              Real-time portfolio intelligence,<br />all in one view
            </Title>
            <Paragraph className="hero-desc">
              A unified command centre that captures live metrics across your client
              portfolio — built for trend analysis, agent scorecards, focus area
              prioritisation, and proactive alerts.
            </Paragraph>

            {/* Coloured shortcut tags matching Figma */}
            <Space size={8} wrap>
              {navItems
                .filter((n) => n.key !== "overview")
                .map((item) => {
                  const cfg = HERO_TAG_COLORS[item.key];
                  return (
                    <Tag
                      key={item.key}
                      icon={cfg?.icon}
                      onClick={() => navigate(item.path)}
                      style={{
                        cursor: "pointer",
                        color: cfg?.color,
                        background: cfg?.bg,
                        border: `1px solid ${cfg?.border}`,
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 500,
                        padding: "3px 12px",
                        fontFamily: "'DM Sans', sans-serif",
                        transition: "opacity 0.2s",
                      }}
                    >
                      {item.label}
                    </Tag>
                  );
                })}
            </Space>
          </div>

          {/* Summary stat cards */}
          <div className="hero-stats">
            <div className="stat-card stat-red">
              <span className="stat-number">{summaryStats.redClients}</span>
              <span className="stat-label">Red clients</span>
            </div>
            <div className="stat-card stat-amber">
              <span className="stat-number">{summaryStats.activeAlerts}</span>
              <span className="stat-label">Active alerts</span>
            </div>
            <div className="stat-card stat-green">
              <span className="stat-number">{summaryStats.onTrack}</span>
              <span className="stat-label">On track</span>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolios Section */}
      <div className="portfolios-section">
        <div className="portfolios-header">
          <div className="portfolios-title-block">
            <Title level={4} className="portfolios-title">Client portfolios</Title>
            <Text className="portfolios-subtitle">Select a client to open their cockpit</Text>
          </div>
          <Space size={10}>
            <Input
              prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
              allowClear
            />
            <Select
              value={sortBy}
              onChange={setSortBy}
              options={SORT_OPTIONS}
              className="sort-select"
              suffixIcon={<SortAscendingOutlined style={{ color: "#6b7280" }} />}
            />
          </Space>
        </div>

        {filteredClients.length > 0 ? (
          <Row gutter={[16, 16]}>
            {filteredClients.map((client) => (
              <Col key={client.id} xs={24} sm={12} md={8} lg={6} xl={5}>
                <ClientTile client={client} />
              </Col>
            ))}
          </Row>
        ) : (
          <div className="empty-state">
            <SearchOutlined style={{ fontSize: 32, color: "#d1d5db" }} />
            <Text style={{ color: "#9ca3af", marginTop: 8, display: "block" }}>
              No clients match "{search}"
            </Text>
          </div>
        )}
      </div>

      <div className="page-footer">
        <Text className="footer-text">🔒 Confidential — Internal use only</Text>
        <Text className="footer-refresh">
          Last refreshed 06:23 pm IST · Auto-refresh every 5 min
        </Text>
      </div>
    </div>
  );
}


.overview-page { display: flex; flex-direction: column; gap: 20px; }

/* Hero Banner */
.hero-banner {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 28px 28px 24px;
  border-left: 4px solid #1a1a2e;
}

.hero-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 32px;
}

.hero-text { flex: 1; }

.hero-eyebrow {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  font-weight: 500;
  color: #9ca3af;
  letter-spacing: 1px;
  text-transform: uppercase;
  display: block;
  margin-bottom: 6px;
}

.hero-title {
  font-family: 'DM Sans', sans-serif !important;
  font-size: 24px !important;
  font-weight: 700 !important;
  color: #1a1a2e !important;
  line-height: 1.3 !important;
  margin-bottom: 10px !important;
  letter-spacing: -0.3px;
}

.hero-desc {
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  color: #6b7280;
  max-width: 500px;
  line-height: 1.6;
  margin-bottom: 16px !important;
}

/* Stats */
.hero-stats { display: flex; gap: 10px; align-items: center; flex-shrink: 0; }

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 76px;
  border-radius: 10px;
  border: 1px solid;
  transition: transform 0.2s;
}

.stat-card:hover { transform: translateY(-2px); }
.stat-number { font-family: 'DM Sans', sans-serif; font-size: 30px; font-weight: 700; line-height: 1; }
.stat-label  { font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 500; margin-top: 4px; text-align: center; opacity: 0.8; }

.stat-red   { background: #fff1f0; border-color: #ffa39e; color: #cf1322; }
.stat-amber { background: #fff7e6; border-color: #ffd591; color: #d46b08; }
.stat-green { background: #f6ffed; border-color: #b7eb8f; color: #389e0d; }

/* Portfolios */
.portfolios-section {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 20px 24px;
}

.portfolios-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
}

.portfolios-title-block { display: flex; flex-direction: column; }

.portfolios-title {
  font-family: 'DM Sans', sans-serif !important;
  font-size: 17px !important;
  font-weight: 700 !important;
  color: #1a1a2e !important;
  margin-bottom: 2px !important;
}

.portfolios-subtitle { font-family: 'DM Sans', sans-serif; font-size: 12px; color: #9ca3af; }

.search-input { width: 210px; border-radius: 8px !important; font-family: 'DM Sans', sans-serif; font-size: 13px; }
.sort-select  { width: 160px; font-family: 'DM Sans', sans-serif; font-size: 13px; }
.sort-select .ant-select-selector { border-radius: 8px !important; }

/* Client Tile */
.client-tile {
  cursor: pointer;
  border: 1px solid #e5e7eb !important;
  border-radius: 12px !important;
  transition: all 0.2s ease !important;
  height: 165px;
}

.client-tile:hover {
  border-color: #1a1a2e !important;
  box-shadow: 0 4px 16px rgba(26,26,46,0.1) !important;
  transform: translateY(-2px);
}

.client-tile .ant-card-body {
  padding: 14px !important;
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 8px;
}

.tile-header { display: flex; align-items: flex-start; justify-content: space-between; }

.tile-avatar {
  width: 42px; height: 42px;
  background: #f3f4f6;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}

.tile-status-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 4px; }

.tile-body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.tile-name     { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700; color: #1a1a2e; display: block; }
.tile-industry { font-family: 'DM Sans', sans-serif; font-size: 11px; color: #9ca3af; display: block; }

.tile-footer { display: flex; align-items: center; justify-content: space-between; }
.tile-arrow  { color: #d1d5db; font-size: 12px; transition: all 0.2s; }
.client-tile:hover .tile-arrow { color: #1a1a2e; transform: translateX(3px); }

/* Empty state */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px; }

/* Footer */
.page-footer    { display: flex; justify-content: space-between; align-items: center; padding: 0 4px; }
.footer-text    { font-family: 'DM Mono', monospace; font-size: 11px; color: #9ca3af; }
.footer-refresh { font-family: 'DM Mono', monospace; font-size: 11px; color: #9ca3af; }

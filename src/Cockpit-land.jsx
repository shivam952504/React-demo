
digital-cockpit/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── AppLayout.jsx
│   │   └── AppLayout.css
│   ├── data/
│   │   └── mockData.js
│   ├── pages/
│   │   ├── Overview.jsx
│   │   ├── Overview.css
│   │   ├── TrendAnalysis.jsx
│   │   ├── AgentScorecard.jsx
│   │   ├── FocusAreas.jsx
│   │   ├── Alerts.jsx
│   │   ├── ClientDetail.jsx
│   │   ├── ClientDetail.css
│   │   └── InnerPage.css
│   ├── styles/
│   │   └── global.css
│   ├── App.jsx
│   └── index.js
├── package.json
└── README.md



import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "antd";
import AppLayout from "./components/AppLayout";
import Overview from "./pages/Overview";
import TrendAnalysis from "./pages/TrendAnalysis";
import AgentScorecard from "./pages/AgentScorecard";
import FocusAreas from "./pages/FocusAreas";
import Alerts from "./pages/Alerts";
import ClientDetail from "./pages/ClientDetail";
import "./styles/global.css";

const theme = {
  token: {
    colorPrimary: "#1a1a2e",
    colorLink: "#4a6fa5",
    borderRadius: 8,
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  components: {
    Menu: {
      itemSelectedColor: "#1a1a2e",
      itemSelectedBg: "transparent",
      itemHoverColor: "#1a1a2e",
      horizontalItemSelectedColor: "#1a1a2e",
      horizontalItemHoverColor: "#4a6fa5",
    },
    Button: { borderRadius: 6 },
    Input: { borderRadius: 8 },
    Card: { borderRadius: 12 },
  },
};

export default function App() {
  return (
    <ConfigProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Overview />} />
            <Route path="trend-analysis" element={<TrendAnalysis />} />
            <Route path="agent-scorecard" element={<AgentScorecard />} />
            <Route path="focus-areas" element={<FocusAreas />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="client/:clientId" element={<ClientDetail />} />
          </Route>
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

global css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #f4f5f7;
  color: #1a1a2e;
  -webkit-font-smoothing: antialiased;
}

.ant-typography { font-family: 'DM Sans', sans-serif !important; }
.ant-card { font-family: 'DM Sans', sans-serif; }
.ant-menu-horizontal { line-height: 62px !important; }
.ant-menu-horizontal > .ant-menu-item::after { bottom: 0 !important; }
.ant-select-selector, .ant-input { font-family: 'DM Sans', sans-serif !important; }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #f1f1f1; }
::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #9ca3af; }


mockdata

export const clients = [
  {
    id: "axis-capital",
    name: "Axis Capital",
    industry: "Financial services",
    status: "on-track",
    redClients: 0,
    activeAlerts: 3,
    onTrack: 1,
    lastRefreshed: "06:23 pm IST",
    route: "/client/axis-capital",
    logo: null,
  },
  {
    id: "globe-invest",
    name: "Globe Investments",
    industry: "Asset management",
    status: "alert",
    redClients: 2,
    activeAlerts: 5,
    onTrack: 3,
    lastRefreshed: "06:20 pm IST",
    route: "/client/globe-invest",
    logo: null,
  },
  {
    id: "vertex-bank",
    name: "Vertex Bank",
    industry: "Banking",
    status: "on-track",
    redClients: 0,
    activeAlerts: 1,
    onTrack: 7,
    lastRefreshed: "06:18 pm IST",
    route: "/client/vertex-bank",
    logo: null,
  },
  {
    id: "nova-wealth",
    name: "Nova Wealth",
    industry: "Wealth management",
    status: "red",
    redClients: 4,
    activeAlerts: 8,
    onTrack: 2,
    lastRefreshed: "06:10 pm IST",
    route: "/client/nova-wealth",
    logo: null,
  },
  {
    id: "prime-securities",
    name: "Prime Securities",
    industry: "Brokerage",
    status: "on-track",
    redClients: 0,
    activeAlerts: 0,
    onTrack: 5,
    lastRefreshed: "06:22 pm IST",
    route: "/client/prime-securities",
    logo: null,
  },
];

export const summaryStats = {
  redClients: 6,
  activeAlerts: 17,
  onTrack: 18,
};

export const navItems = [
  { key: "overview", label: "Overview", path: "/" },
  { key: "trend-analysis", label: "Trend analysis", path: "/trend-analysis" },
  { key: "agent-scorecard", label: "Agent scorecard", path: "/agent-scorecard" },
  { key: "focus-areas", label: "Focus areas", path: "/focus-areas" },
  { key: "alerts", label: "Alerts", path: "/alerts", alertCount: 8 },
];

export const trendData = [
  { month: "Jan", score: 72, alerts: 5 },
  { month: "Feb", score: 68, alerts: 8 },
  { month: "Mar", score: 75, alerts: 3 },
  { month: "Apr", score: 80, alerts: 2 },
  { month: "May", score: 77, alerts: 4 },
];

export const agentScoreData = [
  { agent: "Agent A", score: 92, clients: 12, resolved: 45 },
  { agent: "Agent B", score: 85, clients: 8, resolved: 32 },
  { agent: "Agent C", score: 78, clients: 15, resolved: 28 },
  { agent: "Agent D", score: 91, clients: 10, resolved: 41 },
];

export const focusAreas = [
  { id: 1, area: "Portfolio rebalancing", priority: "High", clients: 4, dueDate: "2026-05-15" },
  { id: 2, area: "KYC renewals", priority: "Medium", clients: 7, dueDate: "2026-05-20" },
  { id: 3, area: "Risk assessment review", priority: "High", clients: 2, dueDate: "2026-05-12" },
  { id: 4, area: "Quarterly reporting", priority: "Low", clients: 5, dueDate: "2026-05-30" },
];

export const alertsData = [
  { id: 1, client: "Nova Wealth", type: "Portfolio drift", severity: "Critical", time: "2h ago" },
  { id: 2, client: "Globe Investments", type: "KYC expiry", severity: "High", time: "4h ago" },
  { id: 3, client: "Nova Wealth", type: "Large withdrawal", severity: "High", time: "5h ago" },
  { id: 4, client: "Axis Capital", type: "Mandate breach", severity: "Medium", time: "6h ago" },
  { id: 5, client: "Globe Investments", type: "Benchmark miss", severity: "Medium", time: "1d ago" },
];


import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Badge, Typography, Tag } from "antd";
import {
  AppstoreOutlined,
  LineChartOutlined,
  UserOutlined,
  BulbOutlined,
  BellOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { navItems } from "../data/mockData";
import "./AppLayout.css";

const { Header, Content } = Layout;
const { Text } = Typography;

const iconMap = {
  overview: <AppstoreOutlined />,
  "trend-analysis": <LineChartOutlined />,
  "agent-scorecard": <UserOutlined />,
  "focus-areas": <BulbOutlined />,
  alerts: <BellOutlined />,
};

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === "/") return "overview";
    const match = navItems.find(
      (item) => item.path !== "/" && path.startsWith(item.path)
    );
    return match ? match.key : "overview";
  };

  const menuItems = navItems.map((item) => ({
    key: item.key,
    icon: iconMap[item.key],
    label: item.alertCount ? (
      <span>
        {item.label}{" "}
        <Badge count={item.alertCount} size="small" color="#e05c5c" />
      </span>
    ) : (
      item.label
    ),
  }));

  const handleMenuClick = ({ key }) => {
    const item = navItems.find((n) => n.key === key);
    if (item) navigate(item.path);
  };

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="header-left">
          <div className="logo-block">
            <div className="logo-icon">
              <AppstoreOutlined style={{ color: "#fff", fontSize: 18 }} />
            </div>
            <div className="logo-text">
              <span className="logo-title">Digital Cockpit</span>
              <span className="logo-subtitle">INTELLIGENCE PLATFORM</span>
            </div>
          </div>
          <Menu
            mode="horizontal"
            selectedKeys={[getSelectedKey()]}
            items={menuItems}
            onClick={handleMenuClick}
            className="main-nav"
          />
        </div>
        <div className="header-right">
          <div className="header-meta">
            <div className="meta-item">
              <Text className="meta-label">ACTIVE PORTFOLIO</Text>
              <Text className="meta-value">1 client</Text>
            </div>
            <div className="meta-divider" />
            <div className="meta-item">
              <Text className="meta-label">AS OF TODAY</Text>
              <Text className="meta-value">{dayjs().format("D MMM YYYY")}</Text>
            </div>
            <div className="meta-divider" />
            <Tag color="success" className="live-tag">● Live</Tag>
          </div>
        </div>
      </Header>
      <Content className="app-content">
        <Outlet />
      </Content>
    </Layout>
  );
}


applaout.css

@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

.app-layout { min-height: 100vh; background: #f4f5f7; }

.app-header {
  background: #ffffff !important;
  border-bottom: 1px solid #e8eaed;
  height: 64px;
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
  gap: 32px;
  flex: 1;
}

.logo-block {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 190px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: #1a1a2e;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-text { display: flex; flex-direction: column; }

.logo-title {
  font-family: 'DM Sans', sans-serif;
  font-weight: 700;
  font-size: 15px;
  color: #1a1a2e;
  line-height: 1.2;
  letter-spacing: -0.2px;
}

.logo-subtitle {
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  color: #8c93a4;
  letter-spacing: 0.8px;
  font-weight: 500;
}

.main-nav {
  border-bottom: none !important;
  background: transparent !important;
  flex: 1;
}

.main-nav .ant-menu-item {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  padding: 0 14px;
}

.main-nav .ant-menu-item-selected { color: #1a1a2e !important; font-weight: 600; }
.main-nav .ant-menu-item-selected::after {
  border-bottom-color: #1a1a2e !important;
  border-bottom-width: 2px !important;
}

.header-right { display: flex; align-items: center; }

.header-meta { display: flex; align-items: center; gap: 16px; }

.meta-item { display: flex; flex-direction: column; align-items: flex-end; }

.meta-label {
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  color: #9ca3af;
  letter-spacing: 0.6px;
  font-weight: 500;
}

.meta-value {
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
  line-height: 1.3;
}

.meta-divider { width: 1px; height: 28px; background: #e5e7eb; }

.live-tag {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 600;
  border-radius: 20px;
  padding: 2px 12px;
}

.app-content { padding: 28px 32px; background: #f4f5f7; }


overview.jsx
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
  { value: "name-asc", label: "Name (A → Z)" },
  { value: "name-desc", label: "Name (Z → A)" },
  { value: "alerts-desc", label: "Most alerts" },
  { value: "alerts-asc", label: "Fewest alerts" },
  { value: "status", label: "Status" },
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
      case "name-asc":   result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "name-desc":  result.sort((a, b) => b.name.localeCompare(a.name)); break;
      case "alerts-desc":result.sort((a, b) => b.activeAlerts - a.activeAlerts); break;
      case "alerts-asc": result.sort((a, b) => a.activeAlerts - b.activeAlerts); break;
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
            <Title level={2} className="hero-title">
              Real-time portfolio intelligence,<br />all in one view
            </Title>
            <Paragraph className="hero-desc">
              A unified command centre that captures live metrics across your client
              portfolio — built for trend analysis, agent scorecards, focus area
              prioritisation, and proactive alerts.
            </Paragraph>
            <Space size={8} wrap>
              {navItems
                .filter((n) => n.key !== "overview")
                .map((item) => (
                  <Tag
                    key={item.key}
                    className="hero-tag"
                    onClick={() => navigate(item.path)}
                    style={{ cursor: "pointer" }}
                  >
                    {item.label}
                  </Tag>
                ))}
            </Space>
          </div>

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

overview.css
.overview-page { display: flex; flex-direction: column; gap: 24px; }

.hero-banner {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 32px;
  border-left: 4px solid #1a1a2e;
}

.hero-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 32px;
}

.hero-text { flex: 1; }

.hero-title {
  font-family: 'DM Sans', sans-serif !important;
  font-size: 26px !important;
  font-weight: 700 !important;
  color: #1a1a2e !important;
  line-height: 1.3 !important;
  margin-bottom: 10px !important;
  letter-spacing: -0.4px;
}

.hero-desc {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  color: #6b7280;
  max-width: 520px;
  line-height: 1.6;
  margin-bottom: 16px !important;
}

.hero-tag {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 500;
  border-radius: 20px;
  border: 1px solid #d1d5db;
  color: #4b5563;
  background: #f9fafb;
  padding: 3px 12px;
  transition: all 0.2s;
  user-select: none;
}

.hero-tag:hover { border-color: #1a1a2e; color: #1a1a2e; background: #f0f1f3; }

.hero-stats { display: flex; gap: 12px; align-items: center; flex-shrink: 0; }

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 80px;
  border-radius: 12px;
  border: 1px solid;
  transition: transform 0.2s;
}

.stat-card:hover { transform: translateY(-2px); }
.stat-number { font-family: 'DM Sans', sans-serif; font-size: 32px; font-weight: 700; line-height: 1; }
.stat-label { font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500; margin-top: 4px; text-align: center; opacity: 0.8; }

.stat-red  { background: #fff1f0; border-color: #ffa39e; color: #cf1322; }
.stat-amber{ background: #fff7e6; border-color: #ffd591; color: #d46b08; }
.stat-green{ background: #f6ffed; border-color: #b7eb8f; color: #389e0d; }

.portfolios-section {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
}

.portfolios-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.portfolios-title-block { display: flex; flex-direction: column; }

.portfolios-title {
  font-family: 'DM Sans', sans-serif !important;
  font-size: 18px !important;
  font-weight: 700 !important;
  color: #1a1a2e !important;
  margin-bottom: 2px !important;
}

.portfolios-subtitle { font-family: 'DM Sans', sans-serif; font-size: 13px; color: #9ca3af; }

.search-input { width: 220px; border-radius: 8px !important; font-family: 'DM Sans', sans-serif; font-size: 13px; }
.sort-select { width: 170px; font-family: 'DM Sans', sans-serif; font-size: 13px; }
.sort-select .ant-select-selector { border-radius: 8px !important; }

.client-tile {
  cursor: pointer;
  border: 1px solid #e5e7eb !important;
  border-radius: 12px !important;
  transition: all 0.2s ease !important;
  height: 170px;
}

.client-tile:hover {
  border-color: #1a1a2e !important;
  box-shadow: 0 4px 16px rgba(26,26,46,0.1) !important;
  transform: translateY(-2px);
}

.client-tile .ant-card-body {
  padding: 16px !important;
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 10px;
}

.tile-header { display: flex; align-items: flex-start; justify-content: space-between; }

.tile-avatar {
  width: 44px; height: 44px;
  background: #f3f4f6;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}

.tile-status-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 4px; }
.tile-body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.tile-name { font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; color: #1a1a2e; display: block; }
.tile-industry { font-family: 'DM Sans', sans-serif; font-size: 12px; color: #9ca3af; display: block; }
.tile-footer { display: flex; align-items: center; justify-content: space-between; }
.tile-arrow { color: #d1d5db; font-size: 12px; transition: all 0.2s; }
.client-tile:hover .tile-arrow { color: #1a1a2e; transform: translateX(3px); }

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px; }

.page-footer { display: flex; justify-content: space-between; align-items: center; padding: 0 4px; }
.footer-text { font-family: 'DM Mono', monospace; font-size: 11px; color: #9ca3af; }
.footer-refresh { font-family: 'DM Mono', monospace; font-size: 11px; color: #9ca3af; }


innerpage.css

.inner-page { display: flex; flex-direction: column; gap: 4px; }

.inner-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.inner-title {
  font-family: 'DM Sans', sans-serif !important;
  font-size: 22px !important;
  font-weight: 700 !important;
  color: #1a1a2e !important;
  margin-bottom: 4px !important;
  display: flex;
  align-items: center;
}

.inner-subtitle { font-family: 'DM Sans', sans-serif; font-size: 14px; color: #9ca3af; }
.inner-card { border: 1px solid #e5e7eb !important; border-radius: 12px !important; }
.metric-card { border: 1px solid #e5e7eb !important; border-radius: 12px !important; }

.metric-label {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #9ca3af;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  display: block;
  margin-bottom: 8px;
}

.metric-value {
  font-family: 'DM Sans', sans-serif;
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.bar-chart { display: flex; gap: 20px; align-items: flex-end; height: 160px; padding: 0 8px; }
.bar-col { display: flex; flex-direction: column; align-items: center; flex: 1; }
.bar-value { font-family: 'DM Mono', monospace; font-size: 11px; color: #6b7280; margin-bottom: 4px; }
.bar-wrap { flex: 1; width: 100%; background: #f3f4f6; border-radius: 6px 6px 0 0; display: flex; align-items: flex-end; overflow: hidden; }
.bar-fill { width: 100%; background: linear-gradient(180deg, #4a6fa5, #1a1a2e); border-radius: 6px 6px 0 0; transition: height 0.3s ease; }
.bar-label { font-family: 'DM Sans', sans-serif; font-size: 12px; color: #9ca3af; margin-top: 6px; font-weight: 500; }

.table-list { display: flex; flex-direction: column; gap: 12px; }
.table-row { display: flex; align-items: center; gap: 12px; }
.table-label { font-family: 'DM Sans', sans-serif; font-size: 13px; color: #4b5563; font-weight: 500; }
.progress-bar-wrap { flex: 1; height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
.progress-bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s ease; }

.top-agent-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 4px;
}

.focus-item { padding: 16px 0 !important; border-bottom: 1px solid #f3f4f6 !important; }
.focus-item:last-child { border-bottom: none !important; }
.alert-item { padding: 16px 0 !important; border-bottom: 1px solid #f3f4f6 !important; }
.alert-item:last-child { border-bottom: none !important; }

.page-footer { display: flex; justify-content: space-between; align-items: center; padding: 4px; }
.footer-text { font-family: 'DM Mono', monospace; font-size: 11px; color: #9ca3af; }
.footer-refresh { font-family: 'DM Mono', monospace; font-size: 11px; color: #9ca3af; }

trendAnalysis.jsx

import React from "react";
import { Typography, Card, Row, Col, Select, Tag } from "antd";
import { LineChartOutlined, RiseOutlined, FallOutlined } from "@ant-design/icons";
import { trendData } from "../data/mockData";
import "./InnerPage.css";

const { Title, Text } = Typography;

export default function TrendAnalysis() {
  const maxScore = Math.max(...trendData.map((d) => d.score));
  const minScore = Math.min(...trendData.map((d) => d.score));

  return (
    <div className="inner-page">
      <div className="inner-header">
        <div>
          <Title level={3} className="inner-title">
            <LineChartOutlined style={{ marginRight: 10 }} />
            Trend Analysis
          </Title>
          <Text className="inner-subtitle">Portfolio performance trends across your client base</Text>
        </div>
        <Select defaultValue="last-6m" style={{ width: 160 }}>
          <Select.Option value="last-1m">Last 1 month</Select.Option>
          <Select.Option value="last-3m">Last 3 months</Select.Option>
          <Select.Option value="last-6m">Last 6 months</Select.Option>
          <Select.Option value="last-1y">Last 1 year</Select.Option>
        </Select>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="metric-card">
            <Text className="metric-label">Peak Score</Text>
            <div className="metric-value" style={{ color: "#389e0d" }}>
              {maxScore} <RiseOutlined style={{ fontSize: 18, marginLeft: 6 }} />
            </div>
            <Tag color="success">Best in May</Tag>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="metric-card">
            <Text className="metric-label">Low Score</Text>
            <div className="metric-value" style={{ color: "#cf1322" }}>
              {minScore} <FallOutlined style={{ fontSize: 18, marginLeft: 6 }} />
            </div>
            <Tag color="error">Lowest in Feb</Tag>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="metric-card">
            <Text className="metric-label">Avg Alerts / Month</Text>
            <div className="metric-value" style={{ color: "#d46b08" }}>
              {(trendData.reduce((a, b) => a + b.alerts, 0) / trendData.length).toFixed(1)}
            </div>
            <Tag color="warning">Per period</Tag>
          </Card>
        </Col>
      </Row>

      <Card className="inner-card" style={{ marginTop: 16 }}>
        <Title level={5} style={{ marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>Score Trend</Title>
        <div className="bar-chart">
          {trendData.map((d, i) => (
            <div key={i} className="bar-col">
              <Text className="bar-value">{d.score}</Text>
              <div className="bar-wrap">
                <div className="bar-fill" style={{ height: `${((d.score - 60) / 30) * 100}%` }} />
              </div>
              <Text className="bar-label">{d.month}</Text>
            </div>
          ))}
        </div>
      </Card>

      <Card className="inner-card" style={{ marginTop: 16 }}>
        <Title level={5} style={{ marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>Alert Volume by Period</Title>
        <div className="table-list">
          {trendData.map((d, i) => (
            <div key={i} className="table-row">
              <Text className="table-label" style={{ width: 60 }}>{d.month}</Text>
              <div className="progress-bar-wrap">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${(d.alerts / 10) * 100}%`,
                    background: d.alerts > 5 ? "#ff4d4f" : d.alerts > 3 ? "#faad14" : "#52c41a",
                  }}
                />
              </div>
              <Tag color={d.alerts > 5 ? "error" : d.alerts > 3 ? "warning" : "success"}
                style={{ minWidth: 36, textAlign: "center" }}>
                {d.alerts}
              </Tag>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

agentscorecard.jsx


import React from "react";
import { Typography, Card, Table, Progress, Tag, Avatar } from "antd";
import { UserOutlined, TrophyOutlined } from "@ant-design/icons";
import { agentScoreData } from "../data/mockData";
import "./InnerPage.css";

const { Title, Text } = Typography;

const columns = [
  {
    title: "Agent",
    dataIndex: "agent",
    key: "agent",
    render: (name) => (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar style={{ background: "#1a1a2e", fontFamily: "'DM Sans', sans-serif" }} size={32}>
          {name.split(" ").map((n) => n[0]).join("")}
        </Avatar>
        <Text style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>{name}</Text>
      </div>
    ),
  },
  {
    title: "Score",
    dataIndex: "score",
    key: "score",
    sorter: (a, b) => a.score - b.score,
    render: (score) => (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Progress
          percent={score}
          size="small"
          strokeColor={score >= 90 ? "#52c41a" : score >= 80 ? "#faad14" : "#ff4d4f"}
          style={{ width: 100, margin: 0 }}
          format={() => ""}
        />
        <Tag color={score >= 90 ? "success" : score >= 80 ? "warning" : "error"}>{score}</Tag>
      </div>
    ),
  },
  {
    title: "Clients",
    dataIndex: "clients",
    key: "clients",
    sorter: (a, b) => a.clients - b.clients,
    render: (v) => <Text style={{ fontFamily: "'DM Sans', sans-serif" }}>{v}</Text>,
  },
  {
    title: "Issues Resolved",
    dataIndex: "resolved",
    key: "resolved",
    sorter: (a, b) => a.resolved - b.resolved,
    render: (v) => <Tag color="blue" style={{ fontFamily: "'DM Sans', sans-serif" }}>{v} resolved</Tag>,
  },
];

export default function AgentScorecard() {
  return (
    <div className="inner-page">
      <div className="inner-header">
        <div>
          <Title level={3} className="inner-title">
            <UserOutlined style={{ marginRight: 10 }} />
            Agent Scorecard
          </Title>
          <Text className="inner-subtitle">Performance metrics across all agents</Text>
        </div>
      </div>

      <div className="top-agent-banner">
        <TrophyOutlined style={{ color: "#faad14", fontSize: 20 }} />
        <Text style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#1a1a2e" }}>
          Top performer this month:
        </Text>
        <Tag color="gold" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13 }}>
          Agent A — Score 92
        </Tag>
      </div>

      <Card className="inner-card" style={{ marginTop: 16 }}>
        <Table
          dataSource={agentScoreData.map((d, i) => ({ ...d, key: i }))}
          columns={columns}
          pagination={false}
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        />
      </Card>
    </div>
  );
}


focusArea.jsx

import React from "react";
import { Typography, Card, List, Tag, Badge } from "antd";
import { BulbOutlined, CalendarOutlined, TeamOutlined } from "@ant-design/icons";
import { focusAreas } from "../data/mockData";
import dayjs from "dayjs";
import "./InnerPage.css";

const { Title, Text } = Typography;
const priorityColor = { High: "red", Medium: "orange", Low: "blue" };

export default function FocusAreas() {
  return (
    <div className="inner-page">
      <div className="inner-header">
        <div>
          <Title level={3} className="inner-title">
            <BulbOutlined style={{ marginRight: 10 }} /> Focus Areas
          </Title>
          <Text className="inner-subtitle">Prioritised action items across your portfolio</Text>
        </div>
      </div>

      <Card className="inner-card" style={{ marginTop: 8 }}>
        <List
          dataSource={focusAreas}
          renderItem={(item) => (
            <List.Item
              className="focus-item"
              extra={
                <div style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <TeamOutlined style={{ color: "#6b7280" }} />
                    <Text style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6b7280" }}>
                      {item.clients} clients affected
                    </Text>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <CalendarOutlined style={{ color: "#6b7280" }} />
                    <Text style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6b7280" }}>
                      Due {dayjs(item.dueDate).format("D MMM YYYY")}
                    </Text>
                  </div>
                </div>
              }
            >
              <List.Item.Meta
                avatar={
                  <Badge count={item.id} style={{ background: "#1a1a2e", fontFamily: "'DM Mono', monospace" }} />
                }
                title={
                  <Text style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 15, color: "#1a1a2e" }}>
                    {item.area}
                  </Text>
                }
                description={
                  <Tag color={priorityColor[item.priority]} style={{ marginTop: 4 }}>
                    {item.priority} priority
                  </Tag>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}


alert.jsx

import React from "react";
import { Typography, Card, List, Tag, Avatar } from "antd";
import { BellOutlined, WarningOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { alertsData } from "../data/mockData";
import "./InnerPage.css";

const { Title, Text } = Typography;

const severityConfig = {
  Critical: { color: "error",      icon: <WarningOutlined /> },
  High:     { color: "warning",    icon: <ExclamationCircleOutlined /> },
  Medium:   { color: "processing", icon: <ExclamationCircleOutlined /> },
  Low:      { color: "default",    icon: null },
};

const avatarStyle = (severity) => ({
  Critical: { background: "#fff1f0", color: "#cf1322", border: "1px solid #ffa39e" },
  High:     { background: "#fff7e6", color: "#d46b08", border: "1px solid #ffd591" },
  Medium:   { background: "#e6f4ff", color: "#0958d9", border: "1px solid #91caff" },
  Low:      { background: "#f9fafb", color: "#6b7280", border: "1px solid #e5e7eb" },
}[severity]);

export default function Alerts() {
  return (
    <div className="inner-page">
      <div className="inner-header">
        <div>
          <Title level={3} className="inner-title">
            <BellOutlined style={{ marginRight: 10 }} /> Alerts
          </Title>
          <Text className="inner-subtitle">Active alerts requiring your attention</Text>
        </div>
        <Tag color="error" style={{ fontSize: 14, padding: "4px 14px" }}>
          {alertsData.length} active
        </Tag>
      </div>

      <Card className="inner-card" style={{ marginTop: 8 }}>
        <List
          dataSource={alertsData}
          renderItem={(item) => {
            const cfg = severityConfig[item.severity];
            return (
              <List.Item className="alert-item">
                <List.Item.Meta
                  avatar={<Avatar style={avatarStyle(item.severity)} icon={cfg.icon} />}
                  title={
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Text style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#1a1a2e" }}>
                        {item.type}
                      </Text>
                      <Tag color={cfg.color}>{item.severity}</Tag>
                    </div>
                  }
                  description={
                    <div style={{ display: "flex", gap: 12 }}>
                      <Text style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6b7280" }}>
                        {item.client}
                      </Text>
                      <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#9ca3af" }}>
                        {item.time}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Card>
    </div>
  );
}



clientDetails.jsx

import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Typography, Card, Row, Col, Tag, Button, Breadcrumb, Descriptions } from "antd";
import {
  ArrowLeftOutlined, BankOutlined, HomeOutlined,
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
    <div className="inner-page">
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <Link to="/"><HomeOutlined /> Overview</Link> },
          { title: client.name },
        ]}
      />

      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/")}
        style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, marginBottom: 20, borderRadius: 8 }}
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
          <Descriptions.Item label="Client ID">{client.id}</Descriptions.Item>
          <Descriptions.Item label="Route">{client.route}</Descriptions.Item>
        </Descriptions>
      </Card>

      <div className="page-footer" style={{ marginTop: 24 }}>
        <Text className="footer-text">🔒 Confidential — Internal use only</Text>
        <Text className="footer-refresh">Last refreshed {client.lastRefreshed} · Auto-refresh every 5 min</Text>
      </div>
    </div>
  );
}

clientDetails.css

.client-detail-header { border-left: 4px solid #1a1a2e !important; }

.client-detail-top { display: flex; align-items: center; gap: 20px; }

.client-detail-avatar {
  width: 72px; height: 72px;
  background: #f3f4f6;
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  border: 1px solid #e5e7eb;
}

.client-detail-info { display: flex; flex-direction: column; gap: 4px; }

.client-detail-name {
  font-family: 'DM Sans', sans-serif !important;
  font-size: 26px !important;
  font-weight: 700 !important;
  color: #1a1a2e !important;
  margin-bottom: 0 !important;
}

.detail-stat-card {
  border: 1px solid #e5e7eb !important;
  border-radius: 12px !important;
  text-align: center;
  padding: 8px;
}

.detail-stat-label {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #9ca3af;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  display: block;
  margin-bottom: 8px;
}

.detail-stat-value {
  font-family: 'DM Sans', sans-serif;
  font-size: 40px;
  font-weight: 700;
  line-height: 1;
}


{
  id: "my-firm",               // becomes the URL: /client/my-firm
  name: "My Firm",
  industry: "Private equity",
  status: "on-track",          // "on-track" | "alert" | "red"
  redClients: 0,
  activeAlerts: 2,
  onTrack: 4,
  lastRefreshed: "06:30 pm IST",
  route: "/client/my-firm",
  logo: null,
}





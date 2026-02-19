import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "antd";
import AppHeader from "./components/AppHeader";
import AnalyticsLanding from "./pages/AnalyticsLanding";
import "antd/dist/reset.css";

const { Content } = Layout;

function App() {
  return (
    <BrowserRouter>
      <Layout style={{ minHeight: "100vh", background: "#fafafa" }}>
        <AppHeader />
        <Content style={{ padding: "40px 80px" }}>
          <Routes>
            <Route path="/" element={<AnalyticsLanding />} />
          </Routes>
        </Content>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

import { Layout, Typography } from "antd";
import "../styles/header.css";
import logo from "../assets/logo.png";

const { Header } = Layout;
const { Title } = Typography;

function AppHeader() {
  return (
    <Header className="app-header">
      <div className="header-left">
        <img src={logo} alt="Logo" className="logo" />
      </div>

      <div className="header-title-wrapper">
        <Title level={4} className="header-title">
          Production Shopfloor Automation
        </Title>
      </div>
    </Header>
  );
}

export default AppHeader;

.app-header {
  background: white;
  height: 70px;
  padding: 0 40px;
  display: flex;
  align-items: center;
  position: relative;
  border-bottom: 1px solid #eaeaea;
}

.logo {
  height: 40px;
}

.header-title-wrapper {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.header-title {
  margin: 0 !important;
  font-weight: 600;
}
import { Typography, Row, Col } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import ServiceCard from "../components/ServiceCard";
import "../styles/analytics.css";

const { Title, Text } = Typography;

function AnalyticsLanding() {
  return (
    <div>
      {/* Back Button */}
      <div className="back-link">
        <ArrowLeftOutlined /> Back to Home
      </div>

      {/* Page Title */}
      <Title level={2}>Services & Applications</Title>
      <Text className="subtitle">
        Access your available services and applications
      </Text>

      {/* Cards */}
      <Row gutter={[24, 24]} className="card-row">
        <Col xs={24} md={8}>
          <ServiceCard
            iconBg="#f97316"
            title="Bill to Pay"
            description="Manage and process bill payments efficiently with automated workflows"
          />
        </Col>

        <Col xs={24} md={8}>
          <ServiceCard
            iconBg="#06b6d4"
            title="True Count App"
            description="Access accurate counting and tracking capabilities for your operations"
          />
        </Col>

        <Col xs={24} md={8}>
          <ServiceCard
            iconBg="#9ca3af"
            title="Under Development"
            description="New features and capabilities coming soon to enhance your experience"
            comingSoon
          />
        </Col>
      </Row>
    </div>
  );
}

export default AnalyticsLanding;

import { Card, Tag } from "antd";
import { ToolOutlined } from "@ant-design/icons";

function ServiceCard({ iconBg, title, description, comingSoon }) {
  return (
    <Card className="service-card" hoverable>
      <div className="service-icon" style={{ background: iconBg }}>
        <ToolOutlined />
      </div>

      <div className="service-title-row">
        <h3>{title}</h3>
        {comingSoon && <Tag color="gold">Coming Soon</Tag>}
      </div>

      <p className="service-description">{description}</p>

      {!comingSoon && (
        <div className="learn-more">
          Learn more →
        </div>
      )}
    </Card>
  );
}

export default ServiceCard;

.back-link {
  font-size: 14px;
  color: #555;
  margin-bottom: 20px;
  cursor: pointer;
}

.subtitle {
  display: block;
  color: #666;
  margin-bottom: 40px;
}

.card-row {
  margin-top: 20px;
}

.service-card {
  border-radius: 16px;
  border: 1px solid #eaeaea;
  padding: 24px;
  transition: all 0.3s ease;
  height: 100%;
}

.service-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  transform: translateY(-4px);
}

.service-icon {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 22px;
  margin-bottom: 16px;
}

.service-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.service-description {
  color: #555;
  margin-top: 10px;
  margin-bottom: 16px;
}

.learn-more {
  font-size: 14px;
  color: #1677ff;
  font-weight: 500;
}


www


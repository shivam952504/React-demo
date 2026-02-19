import { Row, Col, Typography } from "antd";
import {
  BankOutlined,
  BarChartOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import CapabilityTile from "../components/CapabilityTile";
import "./Landing.css";

const { Title, Text } = Typography;

function Landing() {
  return (
    <div className="portal-container">
      <Title level={2} className="portal-title">
        Portal Home
      </Title>
      <Text className="portal-subtitle">
        Select a capability to get started
      </Text>

      <Row gutter={[24, 24]} className="tile-row">
        <Col xs={24} md={8}>
          <CapabilityTile
            icon={<BankOutlined />}
            iconBg="#1677ff"
            title="Banking & Financial Services"
            description="Access comprehensive banking and financial services summaries, reports, and insights"
            link="http://localhost:3001"
          />
        </Col>

        <Col xs={24} md={8}>
          <CapabilityTile
            icon={<BarChartOutlined />}
            iconBg="#7b61ff"
            title="Analytics Capabilities"
            description="Explore powerful analytics tools and data visualization capabilities"
            link="http://localhost:3002"
          />
        </Col>

        <Col xs={24} md={8}>
          <CapabilityTile
            icon={<RobotOutlined />}
            iconBg="#16a34a"
            title="AI/GenAI Automation"
            description="Leverage advanced automation powered by artificial intelligence and generative AI"
            link="#"
          />
        </Col>
      </Row>
    </div>
  );
}

export default Landing;

.portal-container {
  padding: 60px 80px;
  background: #fafafa;
  min-height: 100vh;
}

.portal-title {
  font-weight: 600;
}

.portal-subtitle {
  font-size: 16px;
  color: #666;
}

.tile-row {
  margin-top: 40px;
}

.capability-card {
  border-radius: 16px;
  border: 1px solid #eaeaea;
  padding: 30px;
  transition: all 0.3s ease;
  height: 100%;
}

.capability-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transform: translateY(-4px);
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  color: white;
  margin-bottom: 20px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #111;
}

.card-description {
  font-size: 14px;
  color: #555;
  margin-bottom: 20px;
}

.learn-more {
  font-size: 14px;
  color: #1677ff;
  font-weight: 500;
}
import { Card } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";

function CapabilityTile({ icon, iconBg, title, description, link }) {
  return (
    <a
      href={link}
      target="_self"
      rel="noopener noreferrer"
      style={{ textDecoration: "none" }}
    >
      <Card className="capability-card">
        <div
          className="icon-wrapper"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </div>

        <h3 className="card-title">{title}</h3>
        <p className="card-description">{description}</p>

        <div className="learn-more">
          Learn more <ArrowRightOutlined />
        </div>
      </Card>
    </a>
  );
}

export default CapabilityTile;
.env
REACT_APP_COCKPIT_URL=http://localhost:3001
REACT_APP_ANALYTICS_URL=http://localhost:3002

link={process.env.REACT_APP_COCKPIT_URL}



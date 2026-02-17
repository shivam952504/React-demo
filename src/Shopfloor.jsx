src/
 ├── App.jsx
 ├── index.js
 ├── pages/
 │    └── Landing.jsx
 ├── components/
 │    └── TileCard.jsx
 └── styles.css

app

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import "antd/dist/reset.css";
import "./styles.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

landing.jsx

import { Row, Col, Typography } from "antd";
import TileCard from "../components/TileCard";

const { Title } = Typography;

function Landing() {
  const navigateExternal = (url) => {
    window.location.href = url;
  };

  return (
    <div className="container">
      <Title level={2} className="main-title">
        Production Shopfloor Automation
      </Title>

      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} sm={12} md={8}>
          <TileCard
            title="Digital Cockpit BFS"
            onClick={() => navigateExternal("http://localhost:3001")}
          />
        </Col>

        <Col xs={24} sm={12} md={8}>
          <TileCard
            title="Advance Analytics"
            onClick={() => navigateExternal("http://localhost:3002")}
          />
        </Col>

        <Col xs={24} sm={12} md={8}>
          <TileCard title="TBD" disabled />
        </Col>
      </Row>
    </div>
  );
}

export default Landing;

tilecard

import { Card } from "antd";

function TileCard({ title, onClick, disabled }) {
  return (
    <Card
      hoverable={!disabled}
      className={`tile ${disabled ? "disabled" : ""}`}
      onClick={!disabled ? onClick : undefined}
    >
      <h3>{title}</h3>
    </Card>
  );
}

export default TileCard;

css

.container {
  padding: 60px;
  text-align: center;
}

.main-title {
  margin-bottom: 50px;
}

.tile {
  height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
  font-size: 18px;
  transition: all 0.3s ease;
}

.tile:hover {
  transform: translateY(-5px);
}

.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

analytics

src/
 ├── App.jsx
 ├── pages/
 │    ├── AnalyticsLanding.jsx
 │    ├── ModuleOne.jsx
 │    └── ModuleTwo.jsx
 ├── components/
 │    └── HoverTile.jsx
 ├── assets/
 │    ├── analytics1.png
 │    └── analytics2.png
 └── styles.css

app

import { BrowserRouter, Routes, Route } from "react-router-dom";
import AnalyticsLanding from "./pages/AnalyticsLanding";
import ModuleOne from "./pages/ModuleOne";
import ModuleTwo from "./pages/ModuleTwo";
import "antd/dist/reset.css";
import "./styles.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AnalyticsLanding />} />
        <Route path="/module1" element={<ModuleOne />} />
        <Route path="/module2" element={<ModuleTwo />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

landing

import { Row, Col, Typography } from "antd";
import HoverTile from "../components/HoverTile";
import img1 from "../assets/analytics1.png";
import img2 from "../assets/analytics2.png";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

function AnalyticsLanding() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <Title level={2}>Advance Analytics</Title>

      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} sm={12} md={8}>
          <HoverTile
            title="Predictive Insights"
            image={img1}
            onClick={() => navigate("/module1")}
          />
        </Col>

        <Col xs={24} sm={12} md={8}>
          <HoverTile
            title="Operational Intelligence"
            image={img2}
            onClick={() => navigate("/module2")}
          />
        </Col>
      </Row>
    </div>
  );
}

export default AnalyticsLanding;

import { Card, Tooltip } from "antd";

function HoverTile({ title, image, onClick }) {
  return (
    <Tooltip
      placement="right"
      title={<img src={image} alt="" style={{ width: 200 }} />}
    >
      <Card hoverable className="tile" onClick={onClick}>
        <h3>{title}</h3>
      </Card>
    </Tooltip>
  );
}

export default HoverTile;

function ModuleOne() {
  return (
    <div style={{ padding: 40 }}>
      <h2>Predictive Insights Module</h2>
    </div>
  );
}

export default ModuleOne;

function ModuleTwo() {
  return (
    <div style={{ padding: 40 }}>
      <h2>Operational Intelligence Module</h2>
    </div>
  );
}

export default ModuleTwo;


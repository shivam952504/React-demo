import { Layout, Typography } from "antd";
import "./AppHeader.css";
import logo from "../assets/logo.png"; // keep your logo here

const { Header } = Layout;
const { Title } = Typography;

function AppHeader() {
  return (
    <Header className="app-header">
      <div className="header-left">
        <img src={logo} alt="Logo" className="logo" />
      </div>

      <div className="header-center">
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  height: 70px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  flex: 1;
}

.logo {
  height: 40px;
}

.header-center {
  flex: 1;
  text-align: center;
}

.header-title {
  margin: 0 !important;
  font-weight: 600;
}

import { Layout } from "antd";
import AppHeader from "./components/AppHeader";
import Landing from "./pages/Landing";
import "antd/dist/reset.css";

const { Content } = Layout;

function App() {
  return (
    <Layout>
      <AppHeader />
      <Content style={{ padding: "40px 80px" }}>
        <Landing />
      </Content>
    </Layout>
  );
}

export default App;

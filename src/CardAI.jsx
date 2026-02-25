import { Layout } from "antd";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";

const { Content } = Layout;

export default function AppLayout({ children }) {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />

      <Layout style={{ background: "#f5f7fa" }}>
        <TopHeader />

        <Content
          style={{
            padding: "32px 40px",
            maxWidth: 1400,
            margin: "0 auto",
            width: "100%",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
create topHeader

import { Layout, Typography, Select, Space } from "antd";
import { UserOutlined } from "@ant-design/icons";

const { Header } = Layout;
const { Title, Text } = Typography;

export default function TopHeader() {
  return (
    <Header
      style={{
        background: "#ffffff",
        padding: "16px 40px",
        borderBottom: "1px solid #f0f0f0",
        height: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        {/* LEFT SIDE */}
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Dashboard Overview
          </Title>
          <Text type="secondary">
            Real-time collections intelligence
          </Text>
        </div>

        {/* RIGHT SIDE */}
        <Space size="middle">
          <UserOutlined style={{ fontSize: 18 }} />

          <Text strong>View Mode:</Text>

          <Select
            defaultValue="executive"
            style={{ width: 200 }}
            options={[
              { value: "executive", label: "Executive Mode" },
              { value: "operations", label: "Operations Mode" },
              { value: "dialer", label: "Dialer Team Mode" },
            ]}
          />
        </Space>
      </div>
    </Header>
  );
}


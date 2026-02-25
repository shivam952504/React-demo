import { Layout, Menu, Typography } from "antd";
import {
  DashboardOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

const { Sider } = Layout;
const { Text } = Typography;

export default function Sidebar() {
  return (
    <Sider
      width={240}
      style={{
        background: "#0f172a",
        paddingTop: 20,
      }}
    >
      {/* LOGO / TITLE AREA */}
      <div
        style={{
          padding: "0 20px 24px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            color: "#ffffff",
            fontSize: 18,
            fontWeight: 600,
            lineHeight: 1.2,
          }}
        >
          Collect Sense AI
        </div>

        <Text
          style={{
            color: "rgba(255,255,255,0.65)",
            fontSize: 12,
          }}
        >
          Collections Intelligence Platform
        </Text>
      </div>

      {/* MENU */}
      <Menu
        theme="dark"
        defaultSelectedKeys={["snapshot"]}
        style={{
          background: "transparent",
          borderRight: "none",
        }}
        items={[
          {
            key: "snapshot",
            icon: <DashboardOutlined />,
            label: "Snapshot",
          },
          {
            key: "bcd",
            icon: <BarChartOutlined />,
            label: "BCD Strategy & Cost",
          },
        ]}
      />
    </Sider>
  );
}

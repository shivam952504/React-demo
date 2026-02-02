import { useState } from "react";
import {
  TeamOutlined,
  BarChartOutlined,
  DollarOutlined,
  RiseOutlined,
  SmileOutlined,
  DashboardOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import "./LeftSidebar.css";

export default function LeftSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  const handleClick = (key) => {
    // Placeholder for future navigation
    console.log("Sidebar clicked:", key);
  };

  return (
    <div className={`left-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
        />
      </div>

      <ul className="sidebar-menu">
        <li onClick={() => handleClick("people")}>
          <TeamOutlined />
          {!collapsed && <span>People</span>}
        </li>

        <li onClick={() => handleClick("capacity")}>
          <BarChartOutlined />
          {!collapsed && <span>Capacity</span>}
        </li>

        <li onClick={() => handleClick("bill_to_pay")}>
          <DollarOutlined />
          {!collapsed && <span>Bill To Pay</span>}
        </li>

        <li onClick={() => handleClick("road_to_advocacy")}>
          <RiseOutlined />
          {!collapsed && <span>Road to Advocacy</span>}
        </li>

        <li onClick={() => handleClick("client_sentiment")}>
          <SmileOutlined />
          {!collapsed && <span>Client Sentiment</span>}
        </li>

        <li onClick={() => handleClick("client_metrics")}>
          <DashboardOutlined />
          {!collapsed && <span>Client Facing Metrics</span>}
        </li>

        <li onClick={() => handleClick("agent_performance")}>
          <UserOutlined />
          {!collapsed && <span>Agent Performance</span>}
        </li>
      </ul>
    </div>
  );
}

.left-sidebar {
  width: 240px;
  min-height: 100vh;
  background: #ffffff;
  border-right: 1px solid #eaeaea;
  transition: width 0.25s ease;
  display: flex;
  flex-direction: column;
}

.left-sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  padding: 12px;
  display: flex;
  justify-content: flex-end;
  border-bottom: 1px solid #f0f0f0;
}

.sidebar-menu {
  list-style: none;
  padding: 8px;
  margin: 0;
}

.sidebar-menu li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: #333;
  transition: background 0.2s;
}

.sidebar-menu li:hover {
  background: #f5f7fa;
}

.sidebar-menu li span {
  white-space: nowrap;
}
.sidebar-menu li {
  cursor: pointer;
}



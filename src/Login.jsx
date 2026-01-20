export const LOCAL_USER = {
  username: "admin",
  password: "admin123",
};

export const loginLocal = (username, password) => {
  if (
    username === LOCAL_USER.username &&
    password === LOCAL_USER.password
  ) {
    localStorage.setItem("isAuthenticated", "true");
    return true;
  }
  return false;
};

export const logout = () => {
  localStorage.removeItem("isAuthenticated");
};

export const isLoggedIn = () => {
  return localStorage.getItem("isAuthenticated") === "true";
};
import { Button, Card, Input, Typography, message, Divider } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";

import { loginLocal } from "../auth/auth";
import { loginRequest } from "../auth/msalConfig";

const { Title } = Typography;

export default function Login() {
  const navigate = useNavigate();
  const { instance } = useMsal();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLocalLogin = () => {
    const success = loginLocal(username, password);
    if (success) {
      message.success("Login successful");
      navigate("/", { replace: true });
    } else {
      message.error("Invalid username or password");
    }
  };

  const handleSSOLogin = () => {
    instance.loginRedirect(loginRequest);
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card style={{ width: 360 }}>
        <Title level={3}>Login</Title>

        {/* LOCAL LOGIN */}
        <Input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        <Input.Password
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginBottom: 12 }}
        />

        <Button type="primary" block onClick={handleLocalLogin}>
          Login
        </Button>

        <Divider>OR</Divider>

        {/* SSO LOGIN */}
        <Button block onClick={handleSSOLogin}>
          Sign in with SSO
        </Button>
      </Card>
    </div>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardProvider } from "./context/DashboardContext";

import Login from "./pages/Login";
import NoAccess from "./pages/noAccess/NoAccess";
import AccessGuard from "./pages/noAccess/AccessGuard";

import Landing from "./pages/Landing";
import ClientLanding from "./pages/ClientLanding";
import InvestmentDetails from "./pages/InvestmentDetails";

import KeyMetricsSummary from "./pages/clientOverview/KeyMetricsSummary";
import PeopleSummary from "./pages/clientOverview/PeopleSummary";
import Overview from "./pages/clientOverview/Overview";

import { isLoggedIn } from "./auth/auth";

export default function App() {
  const authenticated = isLoggedIn();

  if (!authenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  const userPermissions = {
    VIEW_CLIENT_KPI: true,
  };

  return (
    <DashboardProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/no-access" element={<NoAccess />} />
          <Route path="/" element={<Landing />} />

          <Route
            path="/investment/:id"
            element={
              <AccessGuard hasAccess={userPermissions.VIEW_CLIENT_KPI}>
                <InvestmentDetails />
              </AccessGuard>
            }
          />

          <Route path="/client/:clientSlug/landing" element={<ClientLanding />}>
            <Route index element={<Overview />} />
            <Route path="overview" element={<Overview />} />
            <Route
              path="key-metrics"
              element={
                <AccessGuard hasAccess={userPermissions.VIEW_CLIENT_KPI}>
                  <KeyMetricsSummary />
                </AccessGuard>
              }
            />
            <Route path="people" element={<PeopleSummary />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </DashboardProvider>
  );
}
update msalconfig

authority:
"https://<tenant>.b2clogin.com/<tenant>.onmicrosoft.com/B2C_1_signin"
replace isLoggedIn()
useIsAuthenticated()

remove loginLocal()


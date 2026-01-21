export const loginLocal = (username, password) => {
  // TEMP: static users for local dev
  if (username === "admin" && password === "admin123") {
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
      navigate("/client/demo/landing", { replace: true }); // ✅ IMPORTANT
    } else {
      message.error("Invalid username or password");
    }
  };

  const handleSSOLogin = () => {
    instance.loginRedirect(loginRequest);
  };

  return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
      <Card style={{ width: 360 }}>
        <Title level={3}>Login</Title>

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

        <Button block onClick={handleSSOLogin}>
          Sign in with SSO
        </Button>
      </Card>
    </div>
  );
}
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import ClientLanding from "./pages/ClientLanding";
import Overview from "./pages/clientOverview/Overview";
import KeyMetricsSummary from "./pages/clientOverview/KeyMetricsSummary";
import PeopleSummary from "./pages/clientOverview/PeopleSummary";
import RequireAuth from "./auth/RequireAuth";
import { DashboardProvider } from "./context/DashboardContext";

export default function App() {
  return (
    <DashboardProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected */}
          <Route
            path="/*"
            element={
              <RequireAuth>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/client/:clientSlug/landing" element={<ClientLanding />}>
                    <Route index element={<Overview />} />
                    <Route path="overview" element={<Overview />} />
                    <Route path="key-metrics" element={<KeyMetricsSummary />} />
                    <Route path="people" element={<PeopleSummary />} />
                  </Route>
                </Routes>
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </DashboardProvider>
  );
}



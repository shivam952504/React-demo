const TOKEN_KEY = "dc_access_token";

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const isLoggedIn = () => {
  return !!getToken();
};

authservice.js

import { setToken, clearToken } from "./authStorage";

const API_BASE = "http://localhost:9009/api";

export const loginWithEmailPassword = async (email, password) => {
  try {
    const res = await fetch(`${API_BASE}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      throw new Error("Invalid credentials");
    }

    const data = await res.json();

    // Backend gives: access_token, token_type
    setToken(data.access_token);

    return true;
  } catch (err) {
    clearToken();
    return false;
  }
};

export const logout = () => {
  clearToken();
};




requireAuth.js

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isLoggedIn } from "./authStorage";

export default function RequireAuth() {
  const location = useLocation();

  if (!isLoggedIn()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}



login.js

import { Button, Card, Input, Typography, message } from "antd";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginWithEmailPassword } from "../auth/authService";

const { Title } = Typography;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || "/";

  const handleLogin = async () => {
    setLoading(true);
    const success = await loginWithEmailPassword(email, password);
    setLoading(false);

    if (success) {
      message.success("Login successful");
      navigate(from, { replace: true });
    } else {
      message.error("Invalid email or password");
    }
  };

  return (
    <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
      <Card style={{ width: 360 }}>
        <Title level={3}>Login</Title>

        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginBottom: 12 }}
        />

        <Input.Password
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        <Button
          type="primary"
          block
          loading={loading}
          onClick={handleLogin}
        >
          Login
        </Button>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          OR
        </div>

        <Button block style={{ marginTop: 8 }}>
          Sign in with SSO
        </Button>
      </Card>
    </div>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardProvider } from "./context/DashboardContext";

import Login from "./pages/Login";
import RequireAuth from "./auth/RequireAuth";

import Landing from "./pages/Landing";
import ClientLanding from "./pages/ClientLanding";
import Overview from "./pages/clientOverview/Overview";
import KeyMetricsSummary from "./pages/clientOverview/KeyMetricsSummary";
import PeopleSummary from "./pages/clientOverview/PeopleSummary";

export default function App() {
  return (
    <DashboardProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected */}
          <Route element={<RequireAuth />}>
            <Route path="/" element={<Landing />} />

            <Route path="/client/:clientSlug/landing" element={<ClientLanding />}>
              <Route index element={<Overview />} />
              <Route path="overview" element={<Overview />} />
              <Route path="key-metrics" element={<KeyMetricsSummary />} />
              <Route path="people" element={<PeopleSummary />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </DashboardProvider>
  );
}

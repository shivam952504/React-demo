import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "./auth/msalConfig";
import App from "./App";
import "./index.css";
import "antd/dist/reset.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  </StrictMode>
);

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardProvider } from "./context/DashboardContext";
import { useIsAuthenticated } from "@azure/msal-react";

import Login from "./pages/Login";
import NoAccess from "./pages/noAccess/NoAccess";
import AccessGuard from "./pages/noAccess/AccessGuard";

import Landing from "./pages/Landing";
import ClientLanding from "./pages/ClientLanding";
import Dashboard from "./pages/Dashboard";
import InvestmentDetails from "./pages/InvestmentDetails";

import KeyMetricsSummary from "./pages/clientOverview/KeyMetricsSummary";
import PeopleSummary from "./pages/clientOverview/PeopleSummary";
import Overview from "./pages/clientOverview/Overview";

export default function App() {
  const isAuthenticated = useIsAuthenticated();

  // 🔐 GLOBAL LOGIN PROTECTION
  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // 👤 USER PERMISSIONS (example – later replace with API)
  const userPermissions = {
    VIEW_CLIENT_KPI: true,
    VIEW_ADMIN_PANEL: false,
  };

  return (
    <DashboardProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/no-access" element={<NoAccess />} />

          {/* App Landing */}
          <Route path="/" element={<Landing />} />

          {/* Investment (permission based) */}
          <Route
            path="/investment/:id"
            element={
              <AccessGuard hasAccess={userPermissions.VIEW_CLIENT_KPI}>
                <InvestmentDetails />
              </AccessGuard>
            }
          />

          {/* Client Pages */}
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </DashboardProvider>
  );
}
import { PublicClientApplication } from "@azure/msal-browser";

export const msalConfig = {
  auth: {
    clientId: "YOUR_CLIENT_ID",
    authority:
      "https://YOUR_TENANT.b2clogin.com/YOUR_TENANT.onmicrosoft.com/YOUR_USER_FLOW",
    knownAuthorities: ["YOUR_TENANT.b2clogin.com"],
    redirectUri: "http://localhost:3000",
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["openid", "profile"],
};

export const msalInstance = new PublicClientApplication(msalConfig);

import { Button, Card, Typography } from "antd";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../auth/msalConfig";

const { Title } = Typography;

export default function Login() {
  const { instance } = useMsal();

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

        <Button
          type="primary"
          block
          onClick={() => instance.loginRedirect(loginRequest)}
        >
          Sign in with SSO
        </Button>
      </Card>
    </div>
  );
}

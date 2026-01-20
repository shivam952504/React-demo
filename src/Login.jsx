src/auth/msalConfig.js

import { LogLevel } from "@azure/msal-browser";

export const msalConfig = {
  auth: {
    clientId: "YOUR_CLIENT_ID",
    authority:
      "https://YOUR_TENANT_NAME.b2clogin.com/YOUR_TENANT_NAME.onmicrosoft.com/B2C_1_signupsignin",
    knownAuthorities: ["YOUR_TENANT_NAME.b2clogin.com"],
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message) => {
        if (level === LogLevel.Error) console.error(message);
      },
    },
  },
};

export const loginRequest = {
  scopes: ["openid", "profile"],
};


src/main.jsx 

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import App from "./App";
import { msalConfig } from "./auth/msalConfig";

const msalInstance = new PublicClientApplication(msalConfig);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MsalProvider instance={msalInstance}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MsalProvider>
  </React.StrictMode>
);

page/login.jsx

import { Button, Card } from "antd";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../auth/msalConfig";

export default function Login() {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginRedirect(loginRequest);
  };

  return (
    <div style={styles.container}>
      <Card style={styles.card}>
        <h2 style={styles.title}>Digital Cockpit</h2>
        <p style={styles.subtitle}>
          Sign in using your organization or email account
        </p>

        <Button
          type="primary"
          size="large"
          block
          onClick={handleLogin}
        >
          Sign in
        </Button>
      </Card>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f7fb",
  },
  card: {
    width: 380,
    textAlign: "center",
    padding: 24,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 24,
    color: "#6b7280",
  },
};

src/auth/ProtectedRoute.jsx

import { useIsAuthenticated } from "@azure/msal-react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


app.jsx

import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import ProtectedRoute from "./auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import ClientLanding from "./pages/ClientLanding";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/client/:clientSlug/*"
        element={
          <ProtectedRoute>
            <ClientLanding />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

src/components/LogoutButton.jsx

import { Button } from "antd";
import { useMsal } from "@azure/msal-react";

export default function LogoutButton() {
  const { instance } = useMsal();

  return (
    <Button
      type="text"
      onClick={() => instance.logoutRedirect()}
    >
      Logout
    </Button>
  );
}

Access user info anywhere

import { useMsal } from "@azure/msal-react";

const { accounts } = useMsal();

const user = accounts[0];

console.log(user?.name);
console.log(user?.username);
console.log(user?.idTokenClaims);

Frontend sends token:

const token = await instance.acquireTokenSilent(loginRequest);

fetch("/api/data", {
  headers: {
    Authorization: `Bearer ${token.accessToken}`,
  },
});



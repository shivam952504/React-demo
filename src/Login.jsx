import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAuthToken } from "../auth/authStorage";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    // 🔹 TEMP LOCAL LOGIN (REMOVE LATER)
    if (email === "admin@test.com" && password === "admin123") {
      setAuthToken("local-dev-token");
      navigate("/", { replace: true });
      return;
    }

    setError("Invalid credentials");
  };

  return (
    <div style={styles.container}>
      <h2>Login</h2>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={styles.input}
      />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={styles.input}
      />

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button onClick={handleLogin} style={styles.button}>
        Login
      </button>

      <hr style={{ margin: "20px 0" }} />

      <button style={styles.ssoButton}>
        Sign in with Company SSO
      </button>

      <button style={styles.ssoButton}>
        Sign in with Azure B2C
      </button>
    </div>
  );
}

const styles = {
  container: {
    width: 320,
    margin: "100px auto",
    padding: 24,
    border: "1px solid #ddd",
    borderRadius: 8,
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: 8,
    marginBottom: 12,
  },
  button: {
    width: "100%",
    padding: 10,
    background: "#1677ff",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
  ssoButton: {
    width: "100%",
    padding: 10,
    marginTop: 10,
    cursor: "pointer",
  },
};

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardProvider } from "./context/DashboardContext";

import Login from "./pages/Login";
import Landing from "./pages/Landing";
import ClientLanding from "./pages/ClientLanding";
import InvestmentDetails from "./pages/InvestmentDetails";

import RequireAuth from "./auth/RequireAuth";
import KeyMetricsSummary from "./pages/clientOverview/KeyMetricsSummary";
import PeopleSummary from "./pages/clientOverview/PeopleSummary";
import Overview from "./pages/clientOverview/Overview";

export default function App() {
  return (
    <DashboardProvider>
      <BrowserRouter>
        <Routes>

          {/* PUBLIC */}
          <Route path="/login" element={<Login />} />

          {/* PROTECTED */}
          <Route element={<RequireAuth />}>
            <Route path="/" element={<Landing />} />
            <Route path="/client/:clientSlug/landing" element={<ClientLanding />} />
            <Route path="/client/:clientSlug">
              <Route index element={<Overview />} />
              <Route path="overview" element={<Overview />} />
              <Route path="key-metrics" element={<KeyMetricsSummary />} />
              <Route path="people" element={<PeopleSummary />} />
            </Route>
            <Route path="/investment" element={<InvestmentDetails />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </DashboardProvider>
  );
}


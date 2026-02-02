import { Button, Card, Input, Typography, message } from "antd";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  loginWithEmailPassword,
  fetchAllowedUsers,
} from "../auth/authService";

const { Title } = Typography;

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || "/";

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        await fetchAllowedUsers();
      } catch (err) {
        setError("Unable to load users");
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const isValidEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleLogin = async () => {
    // 🔹 Frontend validation
    if (!email.trim()) {
      message.error("Email is required");
      return;
    }

    if (!isValidEmail(email)) {
      message.error("Please enter a valid email address");
      return;
    }

    if (!password.trim()) {
      message.error("Password is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const success = await loginWithEmailPassword(email, password);

      if (success) {
        message.success("Login successful");
        navigate(from, { replace: true });
      } else {
        message.error("Invalid email or password");
      }
    } catch (err) {
      // 🔹 Backend error handling
      const msg =
        err?.message ||
        "Invalid email or password. Please try again.";

      message.error(msg);
      setError(msg);
    } finally {
      // 🔹 CRITICAL: stop loader always
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "grid",
        placeItems: "center",
      }}
    >
      <Card style={{ width: 360 }}>
        <Title level={3}>Login</Title>

        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginBottom: 12 }}
          disabled={loading}
        />

        <Input.Password
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginBottom: 16 }}
          disabled={loading}
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

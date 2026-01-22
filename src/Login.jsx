authStorage.js

const TOKEN_KEY = "auth_token";

export const saveToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const isAuthenticated = () => !!getToken();


azureB2CConfig.js

import { PublicClientApplication } from "@azure/msal-browser";

export const b2cMsalInstance = new PublicClientApplication({
  auth: {
    clientId: "B2C_CLIENT_ID",
    authority:
      "https://TENANT.b2clogin.com/TENANT.onmicrosoft.com/B2C_1_SIGNIN",
    knownAuthorities: ["TENANT.b2clogin.com"],
    redirectUri: window.location.origin,
  },
});

export const b2cLoginRequest = {
  scopes: ["openid", "profile"],
};

companySSOConfig.js

import { PublicClientApplication } from "@azure/msal-browser";

export const companyMsalInstance = new PublicClientApplication({
  auth: {
    clientId: "COMPANY_SSO_CLIENT_ID",
    authority: "https://login.microsoftonline.com/YOUR_TENANT_ID",
    redirectUri: window.location.origin,
  },
});

export const companyLoginRequest = {
  scopes: ["openid", "profile"],
};

authService.js

import { saveToken, clearToken } from "./authStorage";

const API_BASE_URL = "https://YOUR_BACKEND_URL";

// Email + password
export async function loginWithEmail(email, password) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) throw new Error();
    const data = await res.json();
    saveToken(data.token);
    return true;
  } catch {
    clearToken();
    return false;
  }
}

// Azure B2C
export async function loginWithB2C(idToken) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/b2c-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (!res.ok) throw new Error();
    const data = await res.json();
    saveToken(data.token);
    return true;
  } catch {
    clearToken();
    return false;
  }
}

// Company SSO
export async function loginWithCompanySSO(idToken) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/company-sso`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (!res.ok) throw new Error();
    const data = await res.json();
    saveToken(data.token);
    return true;
  } catch {
    clearToken();
    return false;
  }
}

login.jsx

import { Button, Card, Input, Divider } from "antd";
import { useNavigate } from "react-router-dom";
import { loginWithEmail, loginWithB2C, loginWithCompanySSO } from "../auth/authService";
import { b2cMsalInstance, b2cLoginRequest } from "../auth/azureB2CConfig";
import { companyMsalInstance, companyLoginRequest } from "../auth/companySSOConfig";

export default function Login() {
  const navigate = useNavigate();
  let email = "";
  let password = "";

  const emailLogin = async () => {
    const ok = await loginWithEmail(email, password);
    navigate(ok ? "/" : "/no-access");
  };

  const b2cLogin = async () => {
    const res = await b2cMsalInstance.loginPopup(b2cLoginRequest);
    const ok = await loginWithB2C(res.idToken);
    navigate(ok ? "/" : "/no-access");
  };

  const companyLogin = async () => {
    const res = await companyMsalInstance.loginPopup(companyLoginRequest);
    const ok = await loginWithCompanySSO(res.idToken);
    navigate(ok ? "/" : "/no-access");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Card style={{ width: 380 }}>
        <Input placeholder="Email" onChange={(e) => (email = e.target.value)} />
        <Input.Password placeholder="Password" onChange={(e) => (password = e.target.value)} style={{ marginTop: 12 }} />

        <Button type="primary" block style={{ marginTop: 16 }} onClick={emailLogin}>
          Login
        </Button>

        <Divider />

        <Button block onClick={companyLogin}>
          Login with Company SSO
        </Button>

        <Divider />

        <Button block onClick={b2cLogin}>
          Login with Azure B2C
        </Button>
      </Card>
    </div>
  );
}

requireAuth.js

import { Navigate } from "react-router-dom";
import { isAuthenticated } from "./authStorage";

export default function RequireAuth({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}



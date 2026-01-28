const ACCESS_TOKEN_KEY = "dc_access_token";
const REFRESH_TOKEN_KEY = "dc_refresh_token";

export const setToken = (token) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const getToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setRefreshToken = (token) => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const clearToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const isLoggedIn = () => {
  return !!getToken();
};

import {
  setToken,
  setRefreshToken,
  getRefreshToken,
  clearToken,
} from "./authStorage";

const API_BASE = "http://localhost:9009/api";

/* =========================
   LOGIN
========================= */
export const loginWithEmailPassword = async (email, password) => {
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

  setToken(data.access_token);
  setRefreshToken(data.refresh_token);

  return true;
};

/* =========================
   REFRESH TOKEN
========================= */
export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  const res = await fetch(`${API_BASE}/users/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    clearToken();
    throw new Error("Refresh token expired");
  }

  const data = await res.json();

  setToken(data.access_token);

  return data.access_token;
};

import { getToken, clearToken } from "./authStorage";
import { refreshAccessToken } from "./authService";

let isRefreshing = false;
let refreshPromise = null;

export const apiClient = async (url, options = {}) => {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // ✅ SUCCESS
  if (response.status !== 401) {
    return response;
  }

  // ❌ UNAUTHORIZED → refresh flow
  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = refreshAccessToken()
      .then((newToken) => {
        isRefreshing = false;
        return newToken;
      })
      .catch((err) => {
        isRefreshing = false;
        clearToken();
        window.location.href = "/login";
        throw err;
      });
  }

  const newToken = await refreshPromise;

  // 🔁 Retry original request
  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      Authorization: `Bearer ${newToken}`,
    },
  });
};


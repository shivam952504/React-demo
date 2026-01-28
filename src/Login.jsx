// authStorage.js
export const authStorage = {
  getAccessToken: () => localStorage.getItem("dc_access_token"),
  getRefreshToken: () => localStorage.getItem("dc_refresh_token"),

  setTokens: ({ access_token, refresh_token }) => {
    if (access_token) {
      localStorage.setItem("dc_access_token", access_token);
    }
    if (refresh_token) {
      localStorage.setItem("dc_refresh_token", refresh_token);
    }
  },

  clear: () => {
    localStorage.removeItem("dc_access_token");
    localStorage.removeItem("dc_refresh_token");
  }
};



// authService.js
import { authStorage } from "./authStorage";

export async function refreshAccessToken() {
  const refreshToken = authStorage.getRefreshToken();

  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  const res = await fetch("http://localhost:9009/api/users/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      refresh_token: refreshToken
    })
  });

  if (!res.ok) {
    throw new Error("Refresh token expired");
  }

  const data = await res.json();

  authStorage.setTokens({
    access_token: data.access_token,
    refresh_token: data.refresh_token
  });

  return data.access_token;
}

import { authStorage } from "../auth/authStorage";
import { refreshAccessToken } from "../auth/authService";

export async function apiFetch(url, options = {}) {
  let accessToken = authStorage.getAccessToken();

  async function makeRequest(token) {
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
  }

  let response = await makeRequest(accessToken);

  // 🔴 Access token expired
  if (response.status === 401) {
    try {
      const newAccessToken = await refreshAccessToken();
      response = await makeRequest(newAccessToken);
    } catch (err) {
      // 🔴 Refresh token also expired
      authStorage.clear();
      window.location.href = "/login";
      throw err;
    }
  }

  return response;
}


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

  // ✅ SUCCESS (2xx)
  if (response.ok) {
    return response;
  }

  // 🚫 FORBIDDEN → valid user but no project access
  if (response.status === 403) {
    window.location.href = "/no-access";
    throw new Error("User has no project access");
  }

  // ❌ If NOT unauthorized, return response as-is
  if (response.status !== 401) {
    return response;
  }

  // 🔁 UNAUTHORIZED → refresh token flow
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

  // 🔁 Retry original request with new token
  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      Authorization: `Bearer ${newToken}`,
    },
  });
};

// src/auth/authStorage.js

const ACCESS_TOKEN_KEY = "dc_access_token";
const REFRESH_TOKEN_KEY = "dc_refresh_token";

export const authStorage = {
  // -------- Access Token --------
  setAccessToken: (token) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  getAccessToken: () => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  // -------- Refresh Token --------
  setRefreshToken: (token) => {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  getRefreshToken: () => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  // -------- Set both together --------
  setTokens: ({ access_token, refresh_token }) => {
    if (access_token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
    }
    if (refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
    }
  },

  // -------- Clear all --------
  clearTokens: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  // -------- Login check --------
  isLoggedIn: () => {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  }
};

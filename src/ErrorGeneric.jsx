// src/auth/apiClient.js

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

  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new Error("Database connection error. Please try again.");
  }

  if (response.ok) return response;

  if (response.status === 403) {
    window.location.href = "/no-access";
    throw new Error("Access denied");
  }

  if (response.status === 401) {
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

    return fetch(url, {
      ...options,
      headers: {
        ...headers,
        Authorization: `Bearer ${newToken}`,
      },
    });
  }

  if (response.status >= 500) {
    throw new Error("Database connection error. Please try again.");
  }

  throw new Error("Something went wrong");
};

src/context/GlobalErrorContext.jsx

import React, { createContext, useContext, useState } from "react";

const GlobalErrorContext = createContext();

export const GlobalErrorProvider = ({ children }) => {
  const [error, setError] = useState(null);

  const showError = (message) => {
    setError(message);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <GlobalErrorContext.Provider value={{ error, showError, clearError }}>
      {children}
    </GlobalErrorContext.Provider>
  );
};

export const useGlobalError = () => useContext(GlobalErrorContext);

src/components/ErrorWrapper.jsx

import React from "react";
import { Button } from "antd";
import { useGlobalError } from "../context/GlobalErrorContext";

const ErrorWrapper = ({ children }) => {
  const { error, clearError } = useGlobalError();

  if (error) {
    return (
      <div style={styles.container}>
        <h2 style={{ color: "#ff4d4f" }}>⚠ Error</h2>
        <p>{error}</p>
        <Button
          type="primary"
          onClick={() => {
            clearError();
            window.location.reload();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  return children;
};

const styles = {
  container: {
    height: "70vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
};

export default ErrorWrapper;

import { GlobalErrorProvider } from "./context/GlobalErrorContext";
import ErrorWrapper from "./components/ErrorWrapper";

function App() {
  return (
    <GlobalErrorProvider>
      <ErrorWrapper>
        {/* your routes */}
      </ErrorWrapper>
    </GlobalErrorProvider>
  );
}

export default App;

inside landing.jsx

import { useGlobalError } from "../context/GlobalErrorContext";

const { showError } = useGlobalError();

try {
  const res = await apiClient(...);
  const data = await res.json();
  setData(data);
} catch (err) {
  showError(err.message);
}

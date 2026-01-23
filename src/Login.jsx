import { getToken, clearToken } from "./authStorage";

export const apiFetch = async (url, options = {}) => {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    window.location.href = "/login";
    return;
  }

  return response;
};
import { setToken } from "../auth/authStorage";

const handleLogin = async () => {
  try {
    const res = await fetch("http://localhost:9009/api/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!res.ok) {
      message.error("Invalid credentials");
      return;
    }

    const data = await res.json();

    // ✅ STORE ACCESS TOKEN
    setToken(data.access_token);

    message.success("Login successful");
    navigate("/", { replace: true });
  } catch (err) {
    message.error("Something went wrong");
  }
};



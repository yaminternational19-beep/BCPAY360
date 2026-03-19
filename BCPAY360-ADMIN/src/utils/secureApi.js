import { API_BASE } from "./apiBase";

export const secureApi = async (path, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }


  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });


  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("auth_user");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "API Error");
  }

  return res.json();
};

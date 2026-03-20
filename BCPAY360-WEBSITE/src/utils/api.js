import axios from "axios";

// 🔥 Read the variable from .env (Vite uses import.meta.env)
const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:5000/api/employee";
export const BASE_ROOT = BASE_URL.replace("/employee", "");

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
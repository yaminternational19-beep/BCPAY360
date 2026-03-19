import { API_BASE } from "../utils/apiBase";

export { API_BASE };


export const api = async (path, options = {}) => {
  const token = localStorage.getItem("token");

  const isFormData = options.isFormData === true;

  const headers = !isFormData
    ? {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    }
    : {
      ...(options.headers || {}),
    };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // ✅ HANDLE QUERY PARAMS
  let url = `${API_BASE}${path}`;
  if (options.params) {
    const query = new URLSearchParams(options.params).toString();
    url += `?${query}`;
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  // ✅ HANDLE JSON BODY - Stringify if not FormData
  if (!isFormData && options.body && typeof options.body === "object") {
    fetchOptions.body = JSON.stringify(options.body);
  }

  // ✅ HANDLE FORMDATA BODY - Don't stringify it
  if (isFormData && options.body instanceof FormData) {
    fetchOptions.body = options.body;
  }

  const res = await fetch(url, fetchOptions);

  if (res.status === 204 || res.status === 304) {
    return null;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "API Error");
  }

  return res.json();
};

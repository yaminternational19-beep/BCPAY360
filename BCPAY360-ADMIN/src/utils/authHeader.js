// src/utils/authHeader.js
export const authHeader = () => {
  const token = localStorage.getItem("token");

  if (!token) return {};   // ✅ DO NOT send Authorization at all

  return {
    Authorization: `Bearer ${token}`,
  };
};

import { API_BASE } from "../utils/apiBase";

const getToken = () => localStorage.getItem("token");

const request = async (url, options = {}) => {
    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
        ...options.headers,
    };

    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers,
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `API Error: ${response.status}`);
    }
    return data;
};

export const superAdminApi = {
    // Companies
    getCompanies: () => request("/api/companies"),
    createCompany: (data) => request("/api/companies", { method: "POST", body: JSON.stringify(data) }),
    getCompanySummary: (id) => request(`/api/super-admin/companies/${id}/summary`),
    getCompanyAdmins: (id) => request(`/api/super-admin/companies/${id}/admins`),
    updateCompany: (id, data) => request(`/api/super-admin/companies/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    toggleCompanyStatus: (id, isActive) => request(`/api/super-admin/companies/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: isActive ? 1 : 0 })
    }),

    // Admins
    toggleAdminStatus: (adminId, isActive) => request(`/api/super-admin/company-admins/${adminId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: isActive ? 1 : 0 })
    }),
};

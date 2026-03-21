import { Routes, Route, Navigate, Outlet, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import CreateOrganization from "./pages/CreateOrganization";
import "./styles/superadmin.css";

// --- Internal Layout Component ---
function SuperAdminLayout() {
  const logout = () => {
    localStorage.clear();
    window.location.replace("/admin/login");
  };

  return (
    <div className="sa-layout">
      <aside className="sa-sidebar">
        <div className="sa-brand sa-gradient-text">Super Admin</div>

        <NavLink to="/super-admin/dashboard" className={({ isActive }) => isActive ? "sa-active" : ""}>📊 Dashboard</NavLink>
        <NavLink to="/super-admin/create" className={({ isActive }) => isActive ? "sa-active" : ""}>🏢 Create Company</NavLink>

        <div className="sa-spacer" />
        <button onClick={logout} className="logout-btn">🚪 Logout</button>
      </aside>

      <main className="sa-content">
        <Outlet />
      </main>
    </div>
  );
}
// ---------------------------------

export default function SuperAdminRoutes() {
  // 🔐 Super Admin guard
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/super-admin/login" replace />;
  }

  return (
    <Routes>
      <Route element={<SuperAdminLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="create" element={<CreateOrganization />} />
        <Route path="edit/:id" element={<CreateOrganization />} />
        
        {/* DEFAULT */}
        <Route path="*" element={<Navigate to="/super-admin/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

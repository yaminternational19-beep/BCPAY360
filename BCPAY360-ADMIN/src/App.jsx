import React, { useState, useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import { BranchProvider } from "./context/BranchContext";

import Login from "./pages/Login";
import RoleGate from "./pages/RoleGate";
import CodeVerify from "./pages/CodeVerify";
import SuperAdmin from "./pages/SuperAdmin";
import Dashboard from "./pages/Dashboard";
import Attendance from "./modules/attendance/pages/Attendance";
import LeaveManagement from "./modules/leave/LeaveManagementPage";
import Companies from "./pages/Companies";
import Accounts from "./pages/Accounts";
import HRLogin from "./pages/HRLogin";
import UserProfile from "./pages/UserProfile";


// New module imports
import SuperAdminRoutes from "./modules/super-admin";
import HolidaysPage from "./modules/holidays";
import { SoftwareReportsDashboard, SoftwareReportsPage } from "./modules/software-reports";
import FormsRouter from "./modules/forms/FormsRouter";
import { BranchList, DepartmentDesignation, EmployeeTypeList, ShiftList, HRList, HRPermissions, EmpCode, Documents } from "./modules/organization";
import EmployeeList from "./modules/employee/pages/EmployeeList";
import EmployeeProfile from "./modules/employee/pages/EmployeeProfile";
import PayrollManagement from "./modules/payroll/PayrollManagement";
import Sidebar from "./layout/Sidebar";
import Navbar from "./layout/Navbar";
import "./styles/Layout.css";
import "./styles/theme.css";
import PermissionProtectedRoute from "./components/PermissionProtectedRoute";
import ManageContent from "./modules/module/ManageContent";
import HelpSupport from "./modules/module/HelpSupport";
import FAQ from "./modules/module/FAQ";
import ManageBroadcast from "./modules/module/ManageBroadcast";


const RoleProtectedRoute = ({ children, allowedRoles, user }) => {
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
};


const AdminLayout = ({ user, setUser }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  if (!user || !user.verified || !user.role) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user.role === "COMPANY_ADMIN";
  const isHR = user.role === "HR";



  const logout = () => {
    localStorage.removeItem("auth_user");
    setUser(null);
  };

  return (
    <BranchProvider>
      <div className="app-root">
        <Navbar
          user={user}
          onToggleSidebar={() => setCollapsed((prev) => !prev)}
          onLogout={logout}
        />

        <div className="main-wrapper">
          <Sidebar collapsed={collapsed} user={user} />

          <main className="main-content">
            <Routes>
              <Route index element={<Navigate to="dashboard" replace />} />

              <Route path="dashboard" element={<Dashboard user={user} />} />

              <Route
                path="employees"
                element={
                  <PermissionProtectedRoute
                    user={user}
                    permissions={JSON.parse(localStorage.getItem("hr_permissions") || "[]")}
                    moduleKey="EMPLOYEE_MASTER"
                  >
                    <EmployeeList />
                  </PermissionProtectedRoute>
                }
              />

              <Route
                path="attendance"
                element={
                  <PermissionProtectedRoute
                    user={user}
                    permissions={JSON.parse(localStorage.getItem("hr_permissions") || "[]")}
                    moduleKey="ATTENDANCE"
                  >
                    <Attendance />
                  </PermissionProtectedRoute>
                }
              />

              <Route
                path="leavemanagement"
                element={
                  <PermissionProtectedRoute
                    user={user}
                    permissions={JSON.parse(localStorage.getItem("hr_permissions") || "[]")}
                    moduleKey="LEAVE_MASTER"
                  >
                    <LeaveManagement />
                  </PermissionProtectedRoute>
                }
              />

              <Route
                path="payroll/*"
                element={
                  <PermissionProtectedRoute
                    user={user}
                    permissions={JSON.parse(localStorage.getItem("hr_permissions") || "[]")}
                    moduleKey="PAYROLL"
                  >
                    <PayrollManagement />
                  </PermissionProtectedRoute>
                }
              />

              <Route
                path="holidays"
                element={
                  <PermissionProtectedRoute
                    user={user}
                    permissions={JSON.parse(localStorage.getItem("hr_permissions") || "[]")}
                    moduleKey="HOLIDAYS"
                  >
                    <HolidaysPage />
                  </PermissionProtectedRoute>
                }
              />

              <Route
                path="departments"
                element={
                  <RoleProtectedRoute allowedRoles={["COMPANY_ADMIN"]} user={user}>
                    <DepartmentDesignation user={user} />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="employee-types"
                element={
                  <RoleProtectedRoute allowedRoles={["COMPANY_ADMIN"]} user={user}>
                    <EmployeeTypeList user={user} />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="shifts"
                element={
                  <RoleProtectedRoute allowedRoles={["COMPANY_ADMIN"]} user={user}>
                    <ShiftList user={user} />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="branches"
                element={
                  <RoleProtectedRoute allowedRoles={["COMPANY_ADMIN"]} user={user}>
                    <BranchList user={user} />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="organization/emp-code"
                element={
                  <RoleProtectedRoute allowedRoles={["COMPANY_ADMIN"]} user={user}>
                    <EmpCode user={user} />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="organization/documents"
                element={
                  <RoleProtectedRoute allowedRoles={["COMPANY_ADMIN"]} user={user}>
                    <Documents />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="companies"
                element={
                  <RoleProtectedRoute allowedRoles={["COMPANY_ADMIN"]} user={user}>
                    <Companies user={user} />
                  </RoleProtectedRoute>
                }
              />

              <Route
                path="accounting"
                element={
                  <RoleProtectedRoute allowedRoles={["COMPANY_ADMIN"]} user={user}>
                    <Accounts />
                  </RoleProtectedRoute>
                }
              />
              {/* Reports and Forms - Flattened Routes */}
              <Route
                path="reports"
                element={
                  <RoleProtectedRoute allowedRoles={["COMPANY_ADMIN"]} user={user}>
                    <SoftwareReportsDashboard />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="reports/:reportType"
                element={
                  <RoleProtectedRoute allowedRoles={["COMPANY_ADMIN"]} user={user}>
                    <SoftwareReportsPage />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="forms/*"
                element={
                  <RoleProtectedRoute allowedRoles={["COMPANY_ADMIN"]} user={user}>
                    <FormsRouter />
                  </RoleProtectedRoute>
                }
              />

              {/* New Module Routes */}
              <Route path="manage-content" element={<ManageContent />} />
              <Route path="help-support" element={<HelpSupport />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="manage-broadcast" element={<ManageBroadcast />} />
              <Route
                path="hr-management/:hrId/permissions"
                element={
                  <RoleProtectedRoute allowedRoles={["COMPANY_ADMIN"]} user={user}>
                    <HRPermissions />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="hr-management/*"
                element={
                  <RoleProtectedRoute allowedRoles={["COMPANY_ADMIN"]} user={user}>
                    <HRList />
                  </RoleProtectedRoute>
                }
              />
              <Route path="employees/:id" element={<EmployeeProfile />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BranchProvider>
  );
};

export default function App() {
  const initialUser = useMemo(() => {
    const saved = localStorage.getItem("auth_user");
    return saved ? JSON.parse(saved) : null;
  }, []);

  const [user, setUser] = useState(initialUser);
  const handle_login = (user) => {
    setUser(user);
  };

  return (
    <ToastProvider>
      <BrowserRouter basename="/admin">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login onLogin={setUser} />} />
          <Route path="/super-admin/login" element={<SuperAdmin />} />
          <Route path="/super-admin/*" element={<SuperAdminRoutes />} />
          <Route path="/role" element={<RoleGate />} />
          <Route path="/verify" element={<CodeVerify onVerify={setUser} />} />
          <Route path="/hr/login" element={<HRLogin on_login={handle_login} />} />

          {/* ONLY ONE AdminLayout */}
          <Route
            path="/*"
            element={<AdminLayout user={user} setUser={setUser} />}
          />
        </Routes>
      </BrowserRouter>
    </ToastProvider>

  );
}

import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

import Login from "../modules/auth/Login";
import ForgotPassword from "../modules/auth/ForgotPassword";
import VerifyOtp from "../modules/auth/VerifyOtp";
import ResetPassword from "../modules/auth/ResetPassword";
import SupportPage from "../modules/Help/SupportPage";
import Dashboard from "../modules/Dashboard/Dashboard";
import AttendancePage from "../modules/attendance/AttendancePage";
import Leaves from "../modules/Leaves/Leaves";
import Holiday from "../modules/holiday/Holiday";
import Salary from "../modules/Salary/Salary";
import Profile from "../modules/Profile/Profile";
import Documents from "../modules/Documents/Documents";
import NotFound from "../pages/NotFound";
import MainLayout from "../components/layout/Mainlayout";

const AppRoutes = () => {
  const token = localStorage.getItem("authToken");

  return (
    <Routes>
      {/* Root Redirect */}
      <Route
        path="/"
        element={<Navigate to={token ? "/dashboard" : "/login"} replace />}
      />

      {/* Public Routes (block if logged in) */}
      <Route
        path="/login"
        element={token ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/forgot-password"
        element={token ? <Navigate to="/dashboard" replace /> : <ForgotPassword />}
      />
      <Route
        path="/verify-otp"
        element={token ? <Navigate to="/dashboard" replace /> : <VerifyOtp />}
      />
      <Route
        path="/reset-password"
        element={token ? <Navigate to="/dashboard" replace /> : <ResetPassword />}
      />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/leaves" element={<Leaves />} />
          <Route path="/holiday" element={<Holiday />} />
          <Route path="/salary" element={<Salary />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/support" element={<SupportPage  />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
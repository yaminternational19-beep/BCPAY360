import { Navigate } from "react-router-dom";
import { hasPermission } from "../utils/permissions.js";

export default function PermissionProtectedRoute({
  user,
  permissions,
  moduleKey,
  action = "view",
  children,
}) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  

  if (user.role === "COMPANY_ADMIN") {
    return children;
  }

  if (user.role === "HR") {
    const allowed = hasPermission(permissions, moduleKey, action);
    if (!allowed) {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  }

  return <Navigate to="/login" replace />;
}

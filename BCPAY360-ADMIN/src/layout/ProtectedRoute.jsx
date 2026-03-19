import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles, user }) => {
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
};

export default ProtectedRoute;


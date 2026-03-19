import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  // Check for the token in Local Storage
  const token = localStorage.getItem("authToken");

  // If token exists, show the page (Outlet). If not, kick to /login
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
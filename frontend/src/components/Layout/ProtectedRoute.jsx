import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // send them to their own dashboard instead of a 403 page
    const dashboards = {
      participant: "/dashboard",
      organizer: "/organizer/dashboard",
      admin: "/admin/dashboard",
    };
    return <Navigate to={dashboards[role] || "/login"} replace />;
  }

  return children;
}

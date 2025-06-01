
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const AdminRoute = () => {
  const { user, isAuthenticated, isAdmin, loading } = useAuth();

  // If auth is still initializing, show a loading spinner
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
      </div>
    );
  }

  // If user is not authenticated, redirect to secure admin login
  if (!isAuthenticated) {
    return <Navigate to="/secure-admin-access" replace />;
  }

  // If user is authenticated but not an admin, redirect to doctor dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // If user is authenticated and is an admin, render the children
  return <Outlet />;
};

export default AdminRoute;

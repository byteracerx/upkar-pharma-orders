
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const AdminRoute = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();

  // If auth is still initializing, show a loading spinner
  if (!user && isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
      </div>
    );
  }

  // If user is not authenticated or not an admin, redirect to login
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/admin-login" replace />;
  }

  // If user is authenticated and is an admin, render the children
  return <Outlet />;
};

export default AdminRoute;


import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const DoctorRoute = () => {
  const { user, isAuthenticated, isAdmin, isApproved, loading } = useAuth();

  // If auth is still initializing, show a loading spinner
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user is an admin, redirect to admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // If doctor is not approved, redirect to pending approval page
  if (!isApproved) {
    return <Navigate to="/pending-approval" replace />;
  }

  // If user is authenticated and is an approved doctor, render the children
  return <Outlet />;
};

export default DoctorRoute;


import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const DoctorRoute = () => {
  const { user, isAuthenticated, isAdmin, isDoctor, loading } = useAuth();
  const location = useLocation();

  // If auth is still loading, show a loading spinner
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is an admin, redirect to admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  // If user is not a doctor, show an appropriate message
  if (!isDoctor) {
    return (
      <div className="flex h-screen w-full items-center justify-center flex-col">
        <h1 className="text-xl font-bold mb-2">Account Pending Approval</h1>
        <p className="text-gray-600">Your account is waiting for admin approval.</p>
      </div>
    );
  }

  // If user is authenticated and is a doctor, render the children
  return <Outlet />;
};

export default DoctorRoute;

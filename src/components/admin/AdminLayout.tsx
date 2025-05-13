import { ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, isAdmin } = useAuth();
  
  // Redirect if not logged in or not an admin
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (!isAdmin) {
    // If user is logged in but not an admin, redirect to doctor dashboard
    return <Navigate to="/dashboard" />;
  }
  
  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex-grow overflow-auto bg-gray-50">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
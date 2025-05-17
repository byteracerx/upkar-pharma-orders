import { ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminNotifications from "./AdminNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, isAdmin, logout } = useAuth();
  
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
      <div className="flex flex-col flex-grow overflow-hidden bg-gray-50">
        <header className="bg-white border-b px-6 py-3 flex justify-between items-center">
          <h1 className="text-lg font-semibold text-upkar-blue">Upkar Pharma Admin</h1>
          <div className="flex items-center gap-4">
            <AdminNotifications />
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-upkar-blue text-white">
                  A
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <div className="font-medium">Admin</div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="flex-grow overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
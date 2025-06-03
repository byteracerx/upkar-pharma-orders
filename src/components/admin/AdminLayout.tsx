
import { ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminNotifications from "./AdminNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { getUserDisplayName } from "@/utils/user-helpers";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, isAdmin, logout, loading } = useAuth();
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
      </div>
    );
  }
  
  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/admin-login" />;
  }
  
  // Redirect if not an admin
  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
  const displayName = getUserDisplayName(user);
  
  return (
    <div className="flex h-screen w-full">
      <AdminSidebar />
      <div className="flex flex-col flex-grow overflow-hidden bg-gray-50">
        <header className="bg-white border-b px-6 py-3 flex justify-between items-center">
          <h1 className="text-lg font-semibold text-upkar-blue">Upkar Pharma Admin</h1>
          <div className="flex items-center gap-4">
            <AdminNotifications />
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-upkar-blue text-white">
                  {displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <div className="font-medium">{displayName}</div>
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

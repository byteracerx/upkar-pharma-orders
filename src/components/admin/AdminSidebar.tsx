
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Pill,
  ShoppingCart,
  CreditCard,
  FileText,
  LogOut,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getUserDisplayName } from "@/utils/user-helpers";

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const SidebarLink = ({ to, icon, children }: SidebarLinkProps) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
          isActive
            ? "bg-upkar-blue text-white"
            : "text-gray-600 hover:bg-gray-100"
        )
      }
      end
    >
      {icon}
      <span>{children}</span>
    </NavLink>
  );
};

const AdminSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = getUserDisplayName(user);

  const handleLogout = () => {
    logout();
    navigate("/admin-login");
  };

  return (
    <div className="w-64 bg-white h-full border-r flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Pill className="h-6 w-6 text-upkar-blue" />
          <span className="font-poppins font-bold text-lg text-upkar-blue">
            Upkar Admin
          </span>
        </div>
      </div>

      <div className="p-4 flex-grow">
        <nav className="space-y-2">
          <SidebarLink to="/admin" icon={<LayoutDashboard className="h-5 w-5" />}>
            Dashboard
          </SidebarLink>
          <SidebarLink to="/admin/doctors" icon={<Users className="h-5 w-5" />}>
            Doctors
          </SidebarLink>
          <SidebarLink to="/admin/products" icon={<Pill className="h-5 w-5" />}>
            Products
          </SidebarLink>
          <SidebarLink to="/admin/orders" icon={<ShoppingCart className="h-5 w-5" />}>
            Orders
          </SidebarLink>
          <SidebarLink to="/admin/credits" icon={<CreditCard className="h-5 w-5" />}>
            Credit Management
          </SidebarLink>
          <SidebarLink to="/admin/invoices" icon={<FileText className="h-5 w-5" />}>
            Invoices
          </SidebarLink>
        </nav>
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <p className="font-medium">{displayName}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full flex items-center gap-2 justify-center"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;


import { Route, Routes } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";

// Admin panel pages
import AdminHome from "./Home";
import DoctorApprovals from "./DoctorApprovals";
import AdminProducts from "./Products";
import AdminOrders from "./Orders";
import AdminCredits from "./Credits";
import AdminInvoices from "./Invoices";
import AdminSetupRLS from "./SetupRLS";

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<AdminHome />} />
        <Route path="/doctors" element={<DoctorApprovals />} />
        <Route path="/products" element={<AdminProducts />} />
        <Route path="/orders" element={<AdminOrders />} />
        <Route path="/credits" element={<AdminCredits />} />
        <Route path="/invoices" element={<AdminInvoices />} />
        <Route path="/setup-rls" element={<AdminSetupRLS />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard;

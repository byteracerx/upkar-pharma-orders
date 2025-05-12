
import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

// Admin panel pages
import AdminHome from "./Home";
import DoctorApprovals from "./DoctorApprovals";
import AdminProducts from "./Products";
import AdminOrders from "./Orders";
import AdminCredits from "./Credits";
import AdminInvoices from "./Invoices";

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  
  // Redirect if not logged in or not an admin
  if (!user || !isAdmin) {
    return <Navigate to="/login" />;
  }
  
  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex-grow overflow-auto bg-gray-50">
        <Routes>
          <Route path="/" element={<AdminHome />} />
          <Route path="/doctors" element={<DoctorApprovals />} />
          <Route path="/products" element={<AdminProducts />} />
          <Route path="/orders" element={<AdminOrders />} />
          <Route path="/credits" element={<AdminCredits />} />
          <Route path="/invoices" element={<AdminInvoices />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard;

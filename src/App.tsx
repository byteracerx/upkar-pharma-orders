import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from '@/pages/Home';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import AdminSecureLogin from '@/pages/AdminSecureLogin';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import PendingApproval from '@/pages/PendingApproval';
import RegistrationConfirmation from '@/pages/RegistrationConfirmation';
import DoctorDashboard from '@/pages/doctor/Dashboard';
import ProductsPage from '@/pages/doctor/ProductsPage';
import ProductDetail from '@/pages/doctor/ProductDetail';
import Cart from '@/pages/doctor/Cart';
import Orders from '@/pages/doctor/Orders';
import OrderDetails from '@/pages/doctor/OrderDetails';
import Profile from '@/pages/doctor/Profile';
import CreditHistory from '@/pages/doctor/CreditHistory';
import InvoiceExample from '@/pages/doctor/InvoiceExample';
import ProductCategory from '@/pages/doctor/ProductCategory';
import Dashboard from '@/pages/admin/Dashboard';
import Products from '@/pages/admin/Products';
import EnhancedOrders from '@/pages/admin/Orders';
import Credits from '@/pages/admin/Credits';
import Invoices from '@/pages/admin/Invoices';
import DoctorApprovals from '@/pages/admin/DoctorApprovals';
import AdminLayout from '@/components/admin/AdminLayout';
import NotFound from '@/pages/NotFound';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';
import { QueryClient } from 'react-query';
import RejectedApproval from '@/pages/RejectedApproval';

function App() {
  return (
    <Router>
      <AuthProvider>
        <QueryClient>
          <Toaster />
          <AppContent />
        </QueryClient>
      </AuthProvider>
    </Router>
  );
}

function AppContent() {
  const { isAuthenticated, isAdmin, isApproved, isRejected, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-upkar-blue"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin-login" element={<AdminSecureLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/pending-approval" element={<PendingApproval />} />
      <Route path="/rejected-approval" element={<RejectedApproval />} />
      <Route path="/registration-confirmation" element={<RegistrationConfirmation />} />

      {/* Protected routes for authenticated users */}
      {isAuthenticated && (
        <>
          {/* Handle rejected doctors */}
          {isRejected && (
            <Route path="*" element={<Navigate to="/rejected-approval" replace />} />
          )}
          
          {/* Admin routes */}
          {isAdmin && (
            <>
              <Route path="/admin" element={
                <AdminLayout>
                  <Dashboard />
                </AdminLayout>
              } />
              <Route path="/admin/doctors" element={
                <AdminLayout>
                  <DoctorApprovals />
                </AdminLayout>
              } />
              <Route path="/admin/products" element={
                <AdminLayout>
                  <Products />
                </AdminLayout>
              } />
              <Route path="/admin/orders" element={
                <AdminLayout>
                  <EnhancedOrders />
                </AdminLayout>
              } />
              <Route path="/admin/credits" element={
                <AdminLayout>
                  <Credits />
                </AdminLayout>
              } />
              <Route path="/admin/invoices" element={
                <AdminLayout>
                  <Invoices />
                </AdminLayout>
              } />
            </>
          )}
          
          {/* Doctor routes (only if approved and not rejected) */}
          {!isAdmin && isApproved && !isRejected && (
            <>
              <Route path="/dashboard" element={<DoctorDashboard />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderDetails />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/credit-history" element={<CreditHistory />} />
              <Route path="/invoice-example" element={<InvoiceExample />} />
              <Route path="/products/category/:category" element={<ProductCategory />} />
            </>
          )}
          
          {/* Redirect unapproved (but not rejected) doctors to pending approval */}
          {!isAdmin && !isApproved && !isRejected && (
            <Route path="*" element={<Navigate to="/pending-approval" replace />} />
          )}
        </>
      )}

      {/* Redirect unauthenticated users to login */}
      {!isAuthenticated && (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
      
      {/* 404 for any other routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;

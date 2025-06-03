
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Home from '@/pages/Home';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import AdminSecureLogin from '@/pages/AdminSecureLogin';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import PendingApproval from '@/pages/PendingApproval';
import RegistrationConfirmation from '@/pages/RegistrationConfirmation';
import DoctorDashboard from '@/pages/doctor/Dashboard';
import ProductsPage from '@/pages/Products';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import Orders from '@/pages/doctor/Orders';
import OrderDetails from '@/pages/doctor/OrderDetails';
import Profile from '@/pages/doctor/Profile';
import CreditHistory from '@/pages/doctor/CreditHistory';
import InvoiceExample from '@/pages/InvoiceExample';
import ProductCategory from '@/pages/doctor/ProductCategory';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminHome from '@/pages/admin/Home';
import DoctorsPage from '@/pages/admin/Doctors';
import Products from '@/pages/admin/Products';
import EnhancedOrders from '@/pages/admin/Orders';
import Credits from '@/pages/admin/Credits';
import Invoices from '@/pages/admin/Invoices';
import NotFound from '@/pages/NotFound';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RejectedApproval from '@/pages/RejectedApproval';

const queryClient = new QueryClient();

function App() {
  return (
    <Router>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <AppContent />
        </QueryClientProvider>
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
      {/* Public routes with layout */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        
        {/* Doctor routes (only if approved and not rejected) */}
        {isAuthenticated && !isAdmin && isApproved && !isRejected && (
          <>
            <Route path="dashboard" element={<DoctorDashboard />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="cart" element={<Cart />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetails />} />
            <Route path="profile" element={<Profile />} />
            <Route path="credit-history" element={<CreditHistory />} />
            <Route path="invoice-example" element={<InvoiceExample />} />
            <Route path="products/category/:category" element={<ProductCategory />} />
          </>
        )}
      </Route>

      {/* Auth routes without layout */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin-login" element={<AdminSecureLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/pending-approval" element={<PendingApproval />} />
      <Route path="/rejected-approval" element={<RejectedApproval />} />
      <Route path="/registration-confirmation" element={<RegistrationConfirmation />} />

      {/* Admin routes without main layout */}
      {isAuthenticated && isAdmin && (
        <>
          <Route path="/admin" element={<AdminDashboard />}>
            <Route index element={<AdminHome />} />
            <Route path="doctors" element={<DoctorsPage />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<EnhancedOrders />} />
            <Route path="credits" element={<Credits />} />
            <Route path="invoices" element={<Invoices />} />
          </Route>
        </>
      )}

      {/* Redirect logic */}
      {isAuthenticated && isRejected && (
        <Route path="*" element={<Navigate to="/rejected-approval" replace />} />
      )}
      
      {isAuthenticated && !isAdmin && !isApproved && !isRejected && (
        <Route path="*" element={<Navigate to="/pending-approval" replace />} />
      )}

      {!isAuthenticated && (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;

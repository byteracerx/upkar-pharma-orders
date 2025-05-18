import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';
import AdminRoute from '@/components/auth/AdminRoute';
import DoctorRoute from '@/components/auth/DoctorRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import PendingApproval from '@/pages/PendingApproval'; // New import
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminDoctors from '@/pages/admin/AdminDoctors';
import DoctorApprovals from '@/pages/admin/DoctorApprovals';
import AdminOrderDetails from '@/pages/admin/AdminOrderDetails';
import AdminSettings from '@/pages/admin/AdminSettings';
import Home from '@/pages/Home';
import NotFound from '@/pages/NotFound';
import Cart from '@/pages/Cart';
import Orders from '@/pages/Orders';
import OrderDetails from '@/pages/OrderDetails';
import Profile from '@/pages/Profile';
import Products from '@/pages/Products';
import ProductCategory from '@/pages/ProductCategory';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import RegistrationConfirmation from '@/pages/RegistrationConfirmation';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/admin-login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/registration-confirmation" element={<RegistrationConfirmation />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/pending-approval" element={<PendingApproval />} /> {/* New route */}

          {/* Protected Doctor Routes */}
          <Route element={<DoctorRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetails />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:category" element={<ProductCategory />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/doctors" element={<AdminDoctors />} />
            <Route path="/admin/doctor-approvals" element={<DoctorApprovals />} />
            <Route path="/admin/orders/:id" element={<AdminOrderDetails />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>

          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;

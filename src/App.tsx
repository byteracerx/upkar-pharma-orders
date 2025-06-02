
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import Index from "./pages/Index";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RegistrationConfirmation from "./pages/RegistrationConfirmation";
import PendingApproval from "./pages/PendingApproval";
import Cart from "./pages/Cart";
import NotFound from "./pages/NotFound";
import AdminSecureLogin from "./pages/AdminSecureLogin";
import SetupAdmin from "./pages/SetupAdmin";

// Doctor Routes
import DoctorRoute from "./components/auth/DoctorRoute";
import Dashboard from "./pages/doctor/Dashboard";
import Orders from "./pages/doctor/Orders";
import OrderDetails from "./pages/doctor/OrderDetails";
import ProductCategory from "./pages/doctor/ProductCategory";
import Profile from "./pages/doctor/Profile";
import CreditHistory from "./pages/doctor/CreditHistory";

// Admin Routes
import AdminRoute from "./components/auth/AdminRoute";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminHome from "./pages/admin/Home";
import DoctorApprovals from "./pages/admin/DoctorApprovals";
import AdminProducts from "./pages/admin/Products";
import AdminOrders from "./pages/admin/Orders";
import EnhancedOrders from "./pages/admin/EnhancedOrders";
import AdminCredits from "./pages/admin/Credits";
import AdminInvoices from "./pages/admin/Invoices";

// Auth Routes
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Index />} />
                <Route path="home" element={<Home />} />
                <Route path="about" element={<About />} />
                <Route path="contact" element={<Contact />} />
                <Route path="products" element={<Products />} />
                <Route path="products/:id" element={<ProductDetail />} />
                <Route path="cart" element={<Cart />} />
              </Route>

              {/* Auth Routes (without Layout) */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/registration-confirmation" element={<RegistrationConfirmation />} />
              <Route path="/pending-approval" element={<PendingApproval />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Secure Admin Routes */}
              <Route path="/admin-login" element={<AdminSecureLogin />} />
              <Route path="/secure-admin-access" element={<AdminSecureLogin />} />
              <Route path="/setup-admin" element={<SetupAdmin />} />

              {/* Doctor Protected Routes (with Layout) */}
              <Route path="/" element={<Layout />}>
                <Route path="dashboard" element={<DoctorRoute />}>
                  <Route index element={<Dashboard />} />
                </Route>
                <Route path="orders" element={<DoctorRoute />}>
                  <Route index element={<Orders />} />
                  <Route path=":id" element={<OrderDetails />} />
                </Route>
                <Route path="category/:category" element={<DoctorRoute />}>
                  <Route index element={<ProductCategory />} />
                </Route>
                <Route path="profile" element={<DoctorRoute />}>
                  <Route index element={<Profile />} />
                </Route>
                <Route path="credit-history" element={<DoctorRoute />}>
                  <Route index element={<CreditHistory />} />
                </Route>
              </Route>

              {/* Admin Protected Routes - Using AdminDashboard which includes AdminLayout */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>}>
                <Route index element={<AdminHome />} />
                <Route path="doctors" element={<DoctorApprovals />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="enhanced-orders" element={<EnhancedOrders />} />
                <Route path="credits" element={<AdminCredits />} />
                <Route path="invoices" element={<AdminInvoices />} />
              </Route>

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;


import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Protected Routes
import AdminRoute from "./components/auth/AdminRoute";
import DoctorRoute from "./components/auth/DoctorRoute";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RegistrationConfirmation from "./pages/RegistrationConfirmation";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import About from "./pages/About";
import Contact from "./pages/Contact";
import AdminDashboard from "./pages/admin/Dashboard";
import DoctorDashboard from "./pages/doctor/Dashboard";
import DoctorCreditHistory from "./pages/doctor/CreditHistory";
import DoctorOrders from "./pages/doctor/Orders";
import NotFound from "./pages/NotFound";
import InvoiceExample from "./pages/InvoiceExample";
import CreateAdmin from "./pages/CreateAdmin";
import AdminLogin from "./pages/AdminLogin";
import SetupAdminRLS from "./pages/SetupAdminRLS";

// Import admin pages
import AdminHome from "./pages/admin/Home";
import DoctorApprovals from "./pages/admin/DoctorApprovals";
import AdminProducts from "./pages/admin/Products";
import AdminOrders from "./pages/admin/Orders";
import AdminCredits from "./pages/admin/Credits";
import AdminInvoices from "./pages/admin/Invoices";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/registration-confirmation" element={<RegistrationConfirmation />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/invoice-example" element={<InvoiceExample />} />
            <Route path="/create-admin" element={<CreateAdmin />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/setup-admin-rls" element={<SetupAdminRLS />} />
            
            {/* Admin Routes - Protected */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />}>
                <Route path="" element={<AdminHome />} />
                <Route path="doctors" element={<DoctorApprovals />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="credits" element={<AdminCredits />} />
                <Route path="invoices" element={<AdminInvoices />} />
              </Route>
            </Route>
            
            {/* Doctor Routes - Protected */}
            <Route element={<DoctorRoute />}>
              <Route path="/dashboard" element={<DoctorDashboard />} />
              <Route path="/credit-history" element={<DoctorCreditHistory />} />
              <Route path="/dashboard/orders" element={<DoctorOrders />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster position="top-right" richColors closeButton />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;


import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";
import InvoiceExample from "./pages/InvoiceExample";
import CreateAdmin from "./pages/CreateAdmin";
import AdminLogin from "./pages/AdminLogin";

const queryClient = new QueryClient();

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
            
            {/* Admin Routes - Protected */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/*" element={<AdminDashboard />} />
            </Route>
            
            {/* Doctor Routes - Protected */}
            <Route element={<DoctorRoute />}>
              <Route path="/dashboard/*" element={<DoctorDashboard />} />
              <Route path="/credit-history" element={<DoctorCreditHistory />} />
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

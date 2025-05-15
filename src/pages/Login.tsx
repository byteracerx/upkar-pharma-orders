
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AdminLoginInfo from "@/components/auth/AdminLoginInfo";

const Login = () => {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If the user is already logged in, redirect to the appropriate dashboard
  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin" />;
    }
    return <Navigate to="/dashboard" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form fields
    if (!email || !password) {
      toast.error("Missing Fields", {
        description: "Please enter both email and password"
      });
      return;
    }
    
    setIsLoading(true);

    try {
      // Check if trying to login as admin
      const isAdminLogin = email.toLowerCase() === 'admin@upkar.com';
      
      console.log("Attempting login with:", { email, password: "***" });
      
      // Perform the login directly with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        console.error("Login error:", error);
        
        // If admin login failed, suggest creating the admin account
        if (isAdminLogin) {
          toast.error("Admin Login Failed", {
            description: "Admin account may not exist yet."
          });
        } else {
          toast.error("Login Failed", {
            description: error.message || "Please check your credentials and try again"
          });
        }
      } else {
        console.log("Login successful:", data);
        
        // Get the current user after login
        const currentUser = data.user;
        
        // Check if the user is admin
        const isAdmin = currentUser?.email === 'admin@upkar.com';
        
        toast.success("Login Successful", {
          description: isAdmin 
            ? "Welcome to the Admin Dashboard" 
            : "Welcome back to Upkar Pharma"
        });
        
        // Navigate based on user role
        if (isAdmin) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      console.error("Unexpected login error:", error);
      toast.error("An unexpected error occurred", {
        description: error.message || "Please try again later"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-upkar-blue">Login to Upkar Pharma</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="doctor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-upkar-blue hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
            <p className="text-sm text-center text-gray-600">
              Don't have an account?{" "}
              <Link to="/register" className="text-upkar-blue hover:underline">
                Register
              </Link>
            </p>
            
            <AdminLoginInfo />
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;


import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

const AdminSecureLogin = () => {
  const { user, isAdmin, login, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If the user is already logged in as admin, redirect to admin dashboard
  if (!loading && isAuthenticated && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // If logged in as non-admin, redirect to regular dashboard
  if (!loading && isAuthenticated && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only allow admin emails (updated to include new admin email)
    if (email !== 'admin1@upkar.com' && email !== 'admin1@upkarpharma.com') {
      toast.error("Access Denied", {
        description: "This login is restricted to authorized personnel only"
      });
      return;
    }
    
    if (!email || !password) {
      toast.error("Missing Fields", {
        description: "Please enter both email and password"
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const result = await login(email.trim(), password);

      if (result.success) {
        toast.success("Admin Access Granted", {
          description: "Welcome to the Admin Dashboard"
        });
      } else {
        toast.error("Access Denied", {
          description: "Invalid admin credentials"
        });
      }
    } catch (error: any) {
      console.error("Admin login error:", error);
      toast.error("Login Error", {
        description: "Please try again"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <Card className="w-full max-w-md border-2 border-upkar-blue">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-upkar-blue rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-upkar-blue">Secure Admin Access</CardTitle>
          <CardDescription>Authorized personnel only</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin1@upkarpharma.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardContent>
            <Button
              type="submit"
              className="w-full bg-upkar-blue hover:bg-upkar-blue/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Secure Login"
              )}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
};

export default AdminSecureLogin;

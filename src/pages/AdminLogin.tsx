
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if already logged in
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/admin');
      }
    };
    
    checkSession();
  }, [navigate]);

  const loginAsAdmin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Attempting direct admin login");
      
      // Try to sign in with admin credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@upkar.com',
        password: 'Admin@123'
      });
      
      if (error) {
        console.error("Admin login error:", error);
        
        if (error.message.includes("Invalid login credentials")) {
          setError("Admin account doesn't exist yet. Please create it first.");
          toast({
            title: "Admin Account Not Found",
            description: "Please create the admin account first",
            variant: "destructive"
          });
        } else {
          setError(error.message);
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        console.log("Admin login successful:", data);
        setIsSuccess(true);
        toast({
          title: "Admin Login Successful",
          description: "Redirecting to admin dashboard...",
        });
        
        // Redirect to admin dashboard
        setTimeout(() => {
          navigate('/admin');
        }, 1000);
      }
    } catch (err: any) {
      console.error("Unexpected error during admin login:", err);
      setError(err.message || "An unexpected error occurred");
      toast({
        title: "Login Error",
        description: err.message || "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-upkar-blue">Admin Login</CardTitle>
          <CardDescription>
            Direct login for admin users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="mb-4">
              This will log you in with the admin credentials:
              <br />
              <span className="font-medium">Email:</span> admin@upkar.com
              <br />
              <span className="font-medium">Password:</span> Admin@123
            </p>
            
            {error && (
              <div className="text-red-600 mt-2">
                {error}
                {error.includes("doesn't exist") && (
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/create-admin')}
                    >
                      Create Admin Account
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {isSuccess && (
              <div className="text-green-600 font-medium">
                Login successful! Redirecting...
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={loginAsAdmin}
            disabled={isLoading || isSuccess}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : isSuccess ? (
              "Login Successful"
            ) : (
              "Login as Admin"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminLogin;

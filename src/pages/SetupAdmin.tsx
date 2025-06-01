
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const SetupAdmin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const createAdminAccount = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-admin-account', {
        body: {
          email: 'admin1@upkar.com',
          password: 'Admin@1#123',
          name: 'Admin User'
        }
      });

      if (error) throw error;

      if (data.success) {
        setIsComplete(true);
        toast.success("Admin account created successfully!", {
          description: "The admin account is now ready for use."
        });
      } else {
        throw new Error(data.error || "Failed to create admin account");
      }
    } catch (error: any) {
      console.error("Error creating admin account:", error);
      toast.error("Failed to create admin account", {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-600">Setup Complete</CardTitle>
            <CardDescription>
              Admin account has been created successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> admin1@upkar.com<br />
              <strong>Password:</strong> Admin@1#123
            </p>
            <Button 
              onClick={() => navigate('/admin-login')}
              className="w-full"
            >
              Go to Admin Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-upkar-blue">Setup Admin Account</CardTitle>
          <CardDescription>
            Create the initial admin account for Upkar Pharma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="mb-4 text-sm text-gray-600">
              This will create an admin account with:
              <br />
              <span className="font-medium">Email:</span> admin1@upkar.com
              <br />
              <span className="font-medium">Password:</span> Admin@1#123
            </p>
          </div>
          <Button
            className="w-full"
            onClick={createAdminAccount}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Admin Account...
              </>
            ) : (
              "Create Admin Account"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupAdmin;

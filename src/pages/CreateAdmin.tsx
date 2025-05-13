import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const CreateAdmin = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAdminUser = async () => {
    setIsCreating(true);
    setError(null);
    
    try {
      console.log("Starting admin user creation process");
      
      // First, check if the admin user already exists
      const { data: existingUser, error: checkError } = await supabase.auth.signInWithPassword({
        email: 'admin@upkar.com',
        password: 'Admin@123'
      });
      
      if (!checkError && existingUser.user) {
        console.log("Admin user already exists:", existingUser.user);
        setIsSuccess(true);
        toast.success("Admin user already exists", {
          description: "You can now login with admin@upkar.com / Admin@123"
        });
        setIsCreating(false);
        return;
      }
      
      console.log("Admin user doesn't exist, creating new user");
      
      // Create a new user with admin credentials
      const { data, error } = await supabase.auth.signUp({
        email: 'admin@upkar.com',
        password: 'Admin@123',
        options: {
          data: {
            name: 'Admin User',
            role: 'admin'
          }
        }
      });
      
      if (error) {
        console.error("Error during signUp:", error);
        throw error;
      }
      
      console.log("User created:", data);
      
      // In a real environment, we would need to confirm the email
      // For this demo, we'll wait a moment and then try to sign in
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Try to sign in with the new account
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'admin@upkar.com',
        password: 'Admin@123'
      });
      
      if (signInError) {
        console.error("Error during sign in:", signInError);
        throw signInError;
      }
      
      console.log("Sign in successful:", signInData);
      
      setIsSuccess(true);
      toast.success("Admin user created successfully", {
        description: "You can now login with admin@upkar.com / Admin@123"
      });
    } catch (err: any) {
      console.error("Error creating admin user:", err);
      setError(err.message || "Failed to create admin user");
      toast.error("Failed to create admin user", {
        description: err.message || "Please try again"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-upkar-blue">Create Admin User</CardTitle>
          <CardDescription>
            This page creates a default admin user for the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            {isSuccess ? (
              <div className="text-green-600 font-medium">
                Admin user created successfully!
                <p className="mt-2 text-sm text-gray-600">
                  Email: admin@upkar.com<br />
                  Password: Admin@123
                </p>
              </div>
            ) : error ? (
              <div className="text-red-600">
                {error}
              </div>
            ) : (
              <p>
                This will create an admin user with the following credentials:
                <br />
                <span className="font-medium">Email:</span> admin@upkar.com
                <br />
                <span className="font-medium">Password:</span> Admin@123
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={createAdminUser}
            disabled={isCreating || isSuccess}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Admin...
              </>
            ) : isSuccess ? (
              "Admin Created"
            ) : (
              "Create Admin User"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CreateAdmin;
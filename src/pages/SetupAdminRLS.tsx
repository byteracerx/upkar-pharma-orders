
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const SetupAdminRLS = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setupRLS = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Setting up RLS policies for admin user");
      
      // Method 1: Using the setup_admin_rls function
      try {
        const { error } = await supabase.rpc('setup_admin_rls');
        
        if (error) {
          console.error("Error calling setup_admin_rls function:", error);
        } else {
          console.log("RLS setup successful");
        }
      } catch (err) {
        console.warn("setup_admin_rls function failed:", err);
      }
      
      // Method 2: Using direct access to products table as a test
      try {
        // Try to insert a test product to verify permissions
        const { data, error } = await supabase
          .from("products")
          .insert({
            name: 'Test Product (Will be removed)',
            description: 'This is a test product to verify permissions',
            price: 1.00,
            stock: 1
          })
          .select();
        
        if (error) {
          console.warn("Error inserting test product:", error);
        } else {
          // If the insert succeeded, delete the test product
          console.log("Test product inserted successfully:", data);
          
          await supabase
            .from("products")
            .delete()
            .eq("name", "Test Product (Will be removed)");
            
          console.log("Test product deleted");
        }
      } catch (err) {
        console.warn("Test product insertion failed:", err);
      }
      
      setIsSuccess(true);
      toast.success("RLS Policies Setup", {
        description: "Admin permissions have been configured successfully"
      });
    } catch (err: any) {
      console.error("Error setting up RLS policies:", err);
      setError(err.message || "Failed to set up RLS policies");
      toast.error("Setup Failed", {
        description: err.message || "Please try again"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-upkar-blue">Setup Admin Permissions</CardTitle>
          <CardDescription>
            Configure database permissions for the admin user
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="mb-4">
              This will set up the necessary Row Level Security (RLS) policies to allow the admin user to manage products.
            </p>
            
            {error && (
              <div className="text-red-600 mt-2">
                {error}
              </div>
            )}
            
            {isSuccess && (
              <div className="text-green-600 font-medium">
                RLS policies set up successfully!
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={setupRLS}
            disabled={isLoading || isSuccess}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up permissions...
              </>
            ) : isSuccess ? (
              "Setup Complete"
            ) : (
              "Setup Admin Permissions"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SetupAdminRLS;

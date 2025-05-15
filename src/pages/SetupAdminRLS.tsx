
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";
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
      
      // Call setup_admin_rls function
      const { error } = await supabase.rpc('setup_admin_rls');
      
      if (error) {
        console.warn("Error calling setup_admin_rls function:", error);
        throw error;
      } else {
        console.log("RLS setup successful");
        setIsSuccess(true);
        toast.success("RLS Policies Setup", {
          description: "Admin permissions have been configured"
        });
      }
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-upkar-blue" />
            Row Level Security Setup
          </CardTitle>
          <CardDescription>
            Configure database permissions for the admin user
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-4">
              This will set up the necessary Row Level Security (RLS) policies to allow the admin user to manage products.
              If you're experiencing permission errors when adding or editing products, run this setup.
            </p>
            
            {error && (
              <div className="text-red-600 mt-2 p-3 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            
            {isSuccess && (
              <div className="text-green-600 font-medium p-3 bg-green-50 rounded-md">
                RLS policies set up successfully! You should now be able to manage products.
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

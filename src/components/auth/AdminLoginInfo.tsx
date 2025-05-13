import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Info } from "lucide-react";

const AdminLoginInfo = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const fillAdminCredentials = () => {
    setIsLoading(true);
    
    // Fill the form fields with admin credentials
    const emailInput = document.getElementById("email") as HTMLInputElement;
    const passwordInput = document.getElementById("password") as HTMLInputElement;
    
    if (emailInput && passwordInput) {
      // Set values
      emailInput.value = "admin@upkar.com";
      passwordInput.value = "Admin@123";
      
      // Trigger input events to update React state
      const inputEvent = new Event("input", { bubbles: true });
      emailInput.dispatchEvent(inputEvent);
      passwordInput.dispatchEvent(inputEvent);
      
      // Also trigger change events for React state updates
      const changeEvent = new Event("change", { bubbles: true });
      emailInput.dispatchEvent(changeEvent);
      passwordInput.dispatchEvent(changeEvent);
      
      console.log("Admin credentials filled:", {
        email: emailInput.value,
        password: "***"
      });
    } else {
      console.error("Could not find email or password input fields");
    }
    
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="mt-4 text-center">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-xs flex items-center gap-1 mx-auto"
        onClick={toggleVisibility}
      >
        <Info className="h-3 w-3" />
        {isVisible ? "Hide Admin Info" : "Admin Login Info"}
      </Button>
      
      {isVisible && (
        <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm border border-gray-200">
          <p className="text-gray-700 mb-2">
            <strong>Admin Credentials:</strong>
          </p>
          <p className="text-gray-600 mb-2">
            Email: admin@upkar.com<br />
            Password: Admin@123
          </p>
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs w-full"
              onClick={fillAdminCredentials}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Filling...
                </>
              ) : (
                "Fill Admin Credentials"
              )}
            </Button>
            
            <div className="flex flex-col space-y-1 mt-1">
              <a 
                href="/admin-login"
                className="text-xs text-blue-600 hover:underline block text-center"
              >
                Direct Admin Login
              </a>
              
              <a 
                href="/create-admin"
                className="text-xs text-blue-600 hover:underline block text-center"
              >
                Create Admin Account
              </a>
              
              <a 
                href="/setup-admin-rls"
                className="text-xs text-blue-600 hover:underline block text-center"
              >
                Setup Admin Permissions
              </a>
              
              <a 
                href="/admin/setup-rls"
                className="text-xs text-blue-600 hover:underline block text-center"
              >
                Fix Admin Permissions
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLoginInfo;
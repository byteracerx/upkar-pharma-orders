
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";

const RegistrationConfirmation = () => {
  const navigate = useNavigate();
  
  // Redirect to login after a certain time
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 30000); // 30 seconds
    
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-upkar-blue">Registration Successful!</CardTitle>
          <CardDescription>Your account has been created and is pending approval</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-gray-600">
            Thank you for registering with Upkar Pharma. Your account has been created successfully.
          </p>
          
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h3 className="font-medium text-blue-800">What happens next?</h3>
            <p className="text-sm text-blue-700 mt-1">
              Our admin team will review your registration details and approve your account.
              You will receive notification once your account is approved.
            </p>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-500">
              You can try logging in to check your approval status. If your account is still 
              pending approval, you'll see a pending approval message.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline"
            asChild
          >
            <Link to="/">
              Go Home
            </Link>
          </Button>
          <Button asChild>
            <Link to="/login">
              Login Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RegistrationConfirmation;

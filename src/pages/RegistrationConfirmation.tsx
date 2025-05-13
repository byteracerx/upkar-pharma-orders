
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const RegistrationConfirmation = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-upkar-blue">Registration Submitted</CardTitle>
          <CardDescription>Your account is pending approval</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              Thank you for registering with Upkar Pharmaceuticals. Your account has been created and is now pending approval from our admin team.
            </p>
            <p>
              You will receive a notification once your account is approved. This typically takes 1-2 business days.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button asChild className="w-full">
            <Link to="/login">Return to Login</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Go to Home Page</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RegistrationConfirmation;

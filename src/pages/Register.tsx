
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegisterForm } from "@/components/auth/RegisterForm";

const Register = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const handleRegistrationSuccess = () => {
    // Navigation is now handled in the RegisterForm component
    console.log('Registration successful, navigating to pending approval');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-upkar-blue">Register for Upkar Pharma</CardTitle>
          <CardDescription>
            Create an account to place orders and manage your inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm onSuccess={handleRegistrationSuccess} />
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-center text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-upkar-blue hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;

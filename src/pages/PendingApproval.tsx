
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { HourglassIcon, LogOut } from "lucide-react";

const PendingApproval = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Get user name with fallback
  const userName = user?.name || user?.user_metadata?.name || 'Doctor';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-yellow-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <HourglassIcon className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-upkar-blue">Approval Pending</CardTitle>
          <CardDescription>Your account is awaiting admin approval</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-600">
            Hello {userName},
          </p>
          <p className="text-gray-600">
            Your registration has been received and is currently under review by our admin team.
            You will be able to access the platform once your account has been approved.
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-6">
            <h3 className="font-medium text-blue-800">What happens next?</h3>
            <ul className="mt-2 text-sm text-blue-700 list-disc list-inside">
              <li>Our team verifies your submitted information</li>
              <li>Once approved, you will receive an email notification</li>
              <li>You can then log in to access the full platform</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button 
            onClick={handleLogout}
            className="w-full"
            variant="outline"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
          <p className="text-xs text-center text-gray-500">
            For any queries, please contact our support team at support@upkarpharma.com
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PendingApproval;

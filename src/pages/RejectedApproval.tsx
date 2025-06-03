
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RejectedApproval = () => {
  const { rejectionReason, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-600">Application Rejected</CardTitle>
          <CardDescription>
            We're sorry, but your application has been declined.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-medium text-red-800 mb-2">Reason for rejection:</h3>
            <p className="text-red-700 text-sm">
              {rejectionReason || "Your application did not meet our requirements."}
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">What you can do:</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-blue-500" />
                <span>Contact our support team for clarification</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-green-500" />
                <span>Call us for assistance with your application</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>Need help?</strong> Contact us at support@upkarpharma.com or call +91-XXXXXXXXXX
            </p>
          </div>
          
          <Button 
            onClick={handleLogout}
            className="w-full"
            variant="outline"
          >
            Return to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RejectedApproval;

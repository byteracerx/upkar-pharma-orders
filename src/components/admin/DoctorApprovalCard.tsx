
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, X, User } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface DoctorApprovalCardProps {
  doctor: {
    id: string;
    name: string;
    email: string;
    phone: string;
    gstNumber: string;
    registrationDate: string;
  };
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const DoctorApprovalCard = ({
  doctor,
  onApprove,
  onReject
}: DoctorApprovalCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const handleApprove = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      onApprove(doctor.id);
      toast({
        title: "Doctor Approved",
        description: `${doctor.name} has been approved successfully.`
      });
    } catch (error) {
      console.error("Error approving doctor:", error);
      toast({
        title: "Error",
        description: "Failed to approve the doctor. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReject = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      onReject(doctor.id);
      toast({
        title: "Doctor Rejected",
        description: `${doctor.name}'s application has been rejected.`
      });
    } catch (error) {
      console.error("Error rejecting doctor:", error);
      toast({
        title: "Error",
        description: "Failed to reject the doctor. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="bg-upkar-light-blue/20 p-2 rounded-full">
            <User className="h-5 w-5 text-upkar-blue" />
          </div>
          <div>
            <CardTitle>{doctor.name}</CardTitle>
            <CardDescription>Registered on {doctor.registrationDate}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="font-medium">Email:</span>
            <span>{doctor.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Phone:</span>
            <span>{doctor.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">GST Number:</span>
            <span>{doctor.gstNumber}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleReject}
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          <X className="h-4 w-4" />
          Reject
        </Button>
        <Button
          onClick={handleApprove}
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          <Check className="h-4 w-4" />
          Approve
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DoctorApprovalCard;

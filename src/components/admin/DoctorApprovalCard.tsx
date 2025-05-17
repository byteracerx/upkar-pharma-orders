
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
import { toast } from "@/hooks/use-toast";

interface DoctorApprovalCardProps {
  doctor: {
    id: string;
    name: string;
    email: string;
    phone: string;
    gstNumber: string;
    registrationDate: string;
    address?: string;
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

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await onApprove(doctor.id);
    } catch (error: any) {
      console.error("Error approving doctor:", error);
      toast.error("Error", {
        description: "Failed to approve the doctor. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await onReject(doctor.id);
    } catch (error: any) {
      console.error("Error rejecting doctor:", error);
      toast.error("Error", {
        description: "Failed to reject the doctor. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gray-50">
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
      <CardContent className="pt-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Email:</span>
            <span className="text-right">{doctor.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Phone:</span>
            <span className="text-right">{doctor.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">GST Number:</span>
            <span className="text-right">{doctor.gstNumber}</span>
          </div>
          {doctor.address && (
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Address:</span>
              <span className="text-right max-w-[200px] truncate" title={doctor.address}>
                {doctor.address}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between bg-gray-50 border-t">
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

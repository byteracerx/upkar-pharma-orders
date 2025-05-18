
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DoctorApprovalCardProps {
  doctor: {
    id: string;
    name: string;
    email: string;
    phone: string;
    gstNumber: string;
    registrationDate: string;
    address?: string;
    clinic_name?: string;
    city?: string;
    state?: string;
    pincode?: string;
    license_number?: string;
    specialization?: string;
  };
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
  isProcessing?: boolean;
}

const DoctorApprovalCard = ({
  doctor,
  onApprove,
  onReject,
  isProcessing = false
}: DoctorApprovalCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await onApprove(doctor.id);
      toast.success(`Doctor ${doctor.name} has been approved`);
    } catch (error: any) {
      console.error("Error approving doctor:", error);
      toast.error("Failed to approve doctor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await onReject(doctor.id, rejectionReason);
      setRejectionReason("");
      setIsRejectDialogOpen(false);
      toast.success(`Doctor ${doctor.name} has been rejected`);
    } catch (error: any) {
      console.error("Error rejecting doctor:", error);
      toast.error("Failed to reject doctor.");
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
          {doctor.clinic_name && (
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Clinic:</span>
              <span className="text-right max-w-[200px] truncate" title={doctor.clinic_name}>
                {doctor.clinic_name}
              </span>
            </div>
          )}
          {doctor.license_number && (
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">License:</span>
              <span className="text-right">{doctor.license_number}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between bg-gray-50 border-t">
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              disabled={isLoading || isProcessing}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Reject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Doctor Application</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting {doctor.name}'s application. This will be included in the notification.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Enter reason for rejection"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                onClick={handleReject} 
                disabled={isLoading || isProcessing}
              >
                {isLoading ? "Rejecting..." : "Reject Application"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Button
          onClick={handleApprove}
          disabled={isLoading || isProcessing}
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

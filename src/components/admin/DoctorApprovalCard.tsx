
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
import { Check, X, User, Mail, Phone, Building, MapPin, FileText } from "lucide-react";
import { useState } from "react";

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
  onApprove: () => void;
  onReject: (reason?: string) => void;
  isProcessing?: boolean;
}

const DoctorApprovalCard = ({
  doctor,
  onApprove,
  onReject,
  isProcessing = false
}: DoctorApprovalCardProps) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const handleApprove = () => {
    onApprove();
  };

  const handleReject = () => {
    onReject(rejectionReason);
    setRejectionReason("");
    setIsRejectDialogOpen(false);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex items-center gap-3">
          <div className="bg-upkar-blue/10 p-2 rounded-full">
            <User className="h-5 w-5 text-upkar-blue" />
          </div>
          <div>
            <CardTitle className="text-lg">{doctor.name}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <span>Registered on {doctor.registrationDate}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-3">
        <div className="grid gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Email:</span>
            <span className="text-gray-700 truncate">{doctor.email}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Phone:</span>
            <span className="text-gray-700">{doctor.phone}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="font-medium">GST:</span>
            <span className="text-gray-700 font-mono text-xs">{doctor.gstNumber}</span>
          </div>
          
          {doctor.clinic_name && (
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Clinic:</span>
              <span className="text-gray-700 truncate">{doctor.clinic_name}</span>
            </div>
          )}
          
          {doctor.address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <span className="font-medium">Address:</span>
                <p className="text-gray-700 text-xs mt-1">{doctor.address}</p>
                {(doctor.city || doctor.state || doctor.pincode) && (
                  <p className="text-gray-600 text-xs">
                    {[doctor.city, doctor.state, doctor.pincode].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {doctor.license_number && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="font-medium">License:</span>
              <span className="text-gray-700 font-mono text-xs">{doctor.license_number}</span>
            </div>
          )}
          
          {doctor.specialization && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Specialization:</span>
              <span className="text-gray-700">{doctor.specialization}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between bg-gray-50 border-t p-4">
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              disabled={isProcessing}
              className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
              Reject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Doctor Application</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting {doctor.name}'s application. This will be included in the notification sent to the doctor.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Enter reason for rejection (optional)"
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
                disabled={isProcessing}
                variant="destructive"
              >
                {isProcessing ? "Rejecting..." : "Reject Application"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Button
          onClick={handleApprove}
          disabled={isProcessing}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          <Check className="h-4 w-4" />
          {isProcessing ? "Processing..." : "Approve"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DoctorApprovalCard;

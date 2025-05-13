import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface UpdateShippingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    trackingNumber: string;
    shippingCarrier: string;
    estimatedDeliveryDate?: string;
  }) => void;
  initialData?: {
    tracking_number?: string;
    shipping_carrier?: string;
    estimated_delivery_date?: string;
  };
}

const UpdateShippingDialog = ({
  open,
  onOpenChange,
  onSubmit,
  initialData = {}
}: UpdateShippingDialogProps) => {
  const [trackingNumber, setTrackingNumber] = useState(initialData.tracking_number || "");
  const [shippingCarrier, setShippingCarrier] = useState(initialData.shipping_carrier || "");
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(
    initialData.estimated_delivery_date 
      ? new Date(initialData.estimated_delivery_date).toISOString().split('T')[0]
      : ""
  );
  const [submitting, setSubmitting] = useState(false);
  
  const handleSubmit = () => {
    if (!trackingNumber || !shippingCarrier) {
      return;
    }
    
    setSubmitting(true);
    
    onSubmit({
      trackingNumber,
      shippingCarrier,
      estimatedDeliveryDate: estimatedDeliveryDate || undefined
    });
    
    setSubmitting(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Shipping Information</DialogTitle>
          <DialogDescription>
            Enter tracking details for this order
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="tracking-number">Tracking Number</Label>
            <Input
              id="tracking-number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="shipping-carrier">Shipping Carrier</Label>
            <Input
              id="shipping-carrier"
              value={shippingCarrier}
              onChange={(e) => setShippingCarrier(e.target.value)}
              placeholder="Enter shipping carrier (e.g., DHL, FedEx)"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="estimated-delivery">Estimated Delivery Date</Label>
            <Input
              id="estimated-delivery"
              type="date"
              value={estimatedDeliveryDate}
              onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !trackingNumber || !shippingCarrier}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Shipping Info"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateShippingDialog;
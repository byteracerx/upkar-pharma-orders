
import { useState } from "react";
import { CreditSummary } from "@/services/creditService";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor: CreditSummary | null;
  onRecordPayment: (amount: number, notes: string) => Promise<void>;
  processing: boolean;
}

const PaymentDialog = ({ 
  open, 
  onOpenChange, 
  doctor, 
  onRecordPayment,
  processing 
}: PaymentDialogProps) => {
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentNotes, setPaymentNotes] = useState("");

  const handleRecordPayment = async () => {
    if (paymentAmount === '' || paymentAmount <= 0) return;
    await onRecordPayment(paymentAmount, paymentNotes);
    setPaymentAmount('');
    setPaymentNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment from {doctor?.doctor_name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="current-credit">Current Credit Balance</Label>
            <Input
              id="current-credit"
              value={`₹${doctor?.total_credit.toLocaleString() || 0}`}
              disabled
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="payment-amount">Payment Amount (₹)</Label>
            <Input
              id="payment-amount"
              type="number"
              placeholder="Enter amount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="payment-notes">Notes (Optional)</Label>
            <Textarea
              id="payment-notes"
              placeholder="Add payment details"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRecordPayment}
            disabled={processing || paymentAmount === '' || paymentAmount <= 0}
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Record Payment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;

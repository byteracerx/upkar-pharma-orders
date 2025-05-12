
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, CreditCard, Loader2, Search } from "lucide-react";
import { CreditSummary, fetchAllDoctorCredits, recordDoctorPayment } from "@/services/creditService";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const AdminCredits = () => {
  const [doctorCredits, setDoctorCredits] = useState<CreditSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<CreditSummary | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentNotes, setPaymentNotes] = useState("");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    setLoading(true);
    try {
      const data = await fetchAllDoctorCredits();
      setDoctorCredits(data);
    } catch (error) {
      console.error("Error fetching credits:", error);
      toast({
        title: "Error",
        description: "Could not fetch doctor credits. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedDoctor || paymentAmount === '' || paymentAmount <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid payment amount.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const success = await recordDoctorPayment(
        selectedDoctor.doctor_id,
        paymentAmount,
        paymentNotes
      );

      if (success) {
        toast({
          title: "Payment Recorded",
          description: `₹${paymentAmount} payment recorded for ${selectedDoctor.doctor_name}.`,
        });
        
        // Notify doctor about payment
        try {
          await supabase.functions.invoke('notify-doctor-payment', {
            body: {
              doctorId: selectedDoctor.doctor_id,
              doctorName: selectedDoctor.doctor_name,
              doctorPhone: selectedDoctor.doctor_phone,
              doctorEmail: selectedDoctor.doctor_email,
              paymentAmount,
              paymentNotes
            }
          });
        } catch (notifyError) {
          console.error("Error notifying doctor about payment:", notifyError);
          // We don't fail the payment just because notification failed
        }
        
        setPaymentDialogOpen(false);
        setPaymentAmount('');
        setPaymentNotes("");
        fetchCredits(); // Refresh data
      } else {
        toast({
          title: "Error",
          description: "Could not record payment. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const sortedAndFilteredDoctors = [...doctorCredits]
    .filter(
      (doctor) =>
        doctor.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.doctor_phone.includes(searchTerm)
    )
    .sort((a, b) => {
      return sortOrder === 'asc'
        ? a.total_credit - b.total_credit
        : b.total_credit - a.total_credit;
    });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Credit Management</h1>
      
      <div className="flex items-center justify-between mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            placeholder="Search doctors..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Button onClick={fetchCredits} variant="outline" className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Doctor Credit Summary</CardTitle>
          <CardDescription>
            View and manage credit balances for all registered doctors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
            </div>
          ) : (
            <Table>
              <TableCaption>Click on a doctor to view detailed credit history</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead onClick={toggleSortOrder} className="cursor-pointer">
                    <div className="flex items-center gap-1">
                      Credit Balance
                      <ChevronDown 
                        className={`h-4 w-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} 
                      />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredDoctors.length > 0 ? (
                  sortedAndFilteredDoctors.map((doctor) => (
                    <TableRow key={doctor.doctor_id}>
                      <TableCell className="font-medium">{doctor.doctor_name}</TableCell>
                      <TableCell>{doctor.doctor_phone}</TableCell>
                      <TableCell>
                        <Badge 
                          className={`${
                            doctor.total_credit > 10000
                              ? "bg-red-100 text-red-800"
                              : doctor.total_credit > 5000
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          ₹{doctor.total_credit.toLocaleString()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedDoctor(doctor);
                                setPaymentDialogOpen(true);
                              }}
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              Record Payment
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                // Handle viewing detailed credit history
                                console.log("View credit history for doctor:", doctor.doctor_id);
                              }}
                            >
                              View Credit History
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={async () => {
                                try {
                                  await supabase.functions.invoke('send-credit-summary', {
                                    body: {
                                      doctorId: doctor.doctor_id
                                    }
                                  });
                                  toast({
                                    title: "Email Sent",
                                    description: `Credit summary email sent to ${doctor.doctor_name}.`,
                                  });
                                } catch (error) {
                                  console.error("Error sending credit summary:", error);
                                  toast({
                                    title: "Error",
                                    description: "Failed to send credit summary email.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              Send Credit Summary
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      {searchTerm
                        ? "No doctors found matching your search."
                        : "No doctors with credit balances."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment from {selectedDoctor?.doctor_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-credit">Current Credit Balance</Label>
              <Input
                id="current-credit"
                value={`₹${selectedDoctor?.total_credit.toLocaleString() || 0}`}
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
              onClick={() => setPaymentDialogOpen(false)}
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
    </div>
  );
};

export default AdminCredits;

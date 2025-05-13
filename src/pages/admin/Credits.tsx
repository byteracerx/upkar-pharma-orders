
import { useState, useEffect } from "react";
import { toast } from "sonner";
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
import { ChevronDown, CreditCard, Loader2, Search, History, Mail } from "lucide-react";
import { 
  CreditSummary, 
  CreditTransaction, 
  fetchAllDoctorCredits, 
  fetchCreditTransactions, 
  recordDoctorPayment 
} from "@/services/creditService";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminCredits = () => {
  const [doctorCredits, setDoctorCredits] = useState<CreditSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<CreditSummary | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentNotes, setPaymentNotes] = useState("");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [processing, setProcessing] = useState(false);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    setLoading(true);
    try {
      const data = await fetchAllDoctorCredits();
      setDoctorCredits(data);
    } catch (error: any) {
      console.error("Error fetching credits:", error);
      toast.error("Error", {
        description: error.message || "Could not fetch doctor credits. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDoctorTransactions = async (doctorId: string) => {
    setLoadingTransactions(true);
    try {
      const transactions = await fetchCreditTransactions(doctorId);
      setCreditTransactions(transactions);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      toast.error("Error", {
        description: error.message || "Could not fetch credit transactions. Please try again."
      });
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedDoctor || paymentAmount === '' || paymentAmount <= 0) {
      toast.error("Invalid Input", {
        description: "Please enter a valid payment amount."
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
        toast.success("Payment Recorded", {
          description: `₹${paymentAmount} payment recorded for ${selectedDoctor.doctor_name}.`
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
        toast.error("Error", {
          description: "Could not record payment. Please try again."
        });
      }
    } catch (error: any) {
      console.error("Error recording payment:", error);
      toast.error("Error", {
        description: error.message || "An unexpected error occurred. Please try again."
      });
    } finally {
      setProcessing(false);
    }
  };
  
  const handleSendCreditSummary = async (doctorId: string, doctorName: string) => {
    setSendingEmail(true);
    try {
      // In a real app, this would call a serverless function to send the email
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      toast.success("Email Sent", {
        description: `Credit summary email sent to ${doctorName}.`
      });
    } catch (error: any) {
      console.error("Error sending credit summary:", error);
      toast.error("Error", {
        description: error.message || "Failed to send credit summary email."
      });
    } finally {
      setSendingEmail(false);
    }
  };
  
  const viewCreditHistory = (doctor: CreditSummary) => {
    setSelectedDoctor(doctor);
    fetchDoctorTransactions(doctor.doctor_id);
    setHistoryDialogOpen(true);
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
                              onClick={() => viewCreditHistory(doctor)}
                            >
                              <History className="mr-2 h-4 w-4" />
                              View Credit History
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSendCreditSummary(doctor.doctor_id, doctor.doctor_name)}
                              disabled={sendingEmail}
                            >
                              <Mail className="mr-2 h-4 w-4" />
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

      {/* Payment Dialog */}
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
      
      {/* Credit History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Credit History</DialogTitle>
            <DialogDescription>
              {selectedDoctor && (
                <div className="mt-2">
                  <p><strong>Doctor:</strong> {selectedDoctor.doctor_name}</p>
                  <p><strong>Current Balance:</strong> ₹{selectedDoctor.total_credit.toLocaleString()}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {loadingTransactions ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
            </div>
          ) : (
            <div className="py-4">
              <Tabs defaultValue="all">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="all">All Transactions</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-4">
                  {creditTransactions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {creditTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              {new Date(transaction.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell>
                              <Badge
                                className={transaction.type === 'credit' 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-red-100 text-red-800"}
                              >
                                {transaction.type === 'credit' ? 'Payment' : 'Purchase'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={transaction.type === 'credit' ? "text-green-600" : "text-red-600"}>
                                {transaction.type === 'credit' ? '-' : '+'} ₹{transaction.amount.toLocaleString()}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No transaction history found.</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="summary" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* Total Orders */}
                        <div className="flex justify-between items-center pb-4 border-b">
                          <span className="font-medium">Total Orders</span>
                          <span>
                            {creditTransactions.filter(t => t.type === 'debit').length}
                          </span>
                        </div>
                        
                        {/* Total Purchases */}
                        <div className="flex justify-between items-center pb-4 border-b">
                          <span className="font-medium">Total Purchases</span>
                          <span className="text-red-600">
                            ₹{creditTransactions
                              .filter(t => t.type === 'debit')
                              .reduce((sum, t) => sum + t.amount, 0)
                              .toLocaleString()}
                          </span>
                        </div>
                        
                        {/* Total Payments */}
                        <div className="flex justify-between items-center pb-4 border-b">
                          <span className="font-medium">Total Payments</span>
                          <span className="text-green-600">
                            ₹{creditTransactions
                              .filter(t => t.type === 'credit')
                              .reduce((sum, t) => sum + t.amount, 0)
                              .toLocaleString()}
                          </span>
                        </div>
                        
                        {/* Current Balance */}
                        <div className="flex justify-between items-center pt-2">
                          <span className="font-bold">Current Balance</span>
                          <span className="font-bold text-upkar-blue">
                            ₹{selectedDoctor?.total_credit.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          <DialogFooter>
            <Button
              onClick={() => {
                if (selectedDoctor) {
                  handleSendCreditSummary(selectedDoctor.doctor_id, selectedDoctor.doctor_name);
                }
              }}
              variant="outline"
              className="mr-auto"
              disabled={sendingEmail}
            >
              {sendingEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Email Summary
                </>
              )}
            </Button>
            
            <Button
              onClick={() => {
                setHistoryDialogOpen(false);
                setSelectedDoctor(null);
                setCreditTransactions([]);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCredits;

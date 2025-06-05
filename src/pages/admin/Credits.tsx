
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, DollarSign, CreditCard, Plus } from "lucide-react";
import { toast } from "sonner";
import { 
  getAllDoctorsCredits, 
  recordPayment, 
  getDoctorCreditSummary,
  getCreditTransactions,
  type CreditSummary,
  type CreditTransaction
} from "@/services/enhancedCreditService";

interface DoctorCredit {
  id: string;
  name: string;
  phone: string;
  email?: string;
  gst_number: string;
  creditSummary: CreditSummary | null;
}

const AdminCredits = () => {
  const [doctors, setDoctors] = useState<DoctorCredit[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<DoctorCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Payment dialog state
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorCredit | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // Credit details dialog state
  const [isCreditDetailsOpen, setIsCreditDetailsOpen] = useState(false);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    loadDoctorsCredits();
  }, []);

  useEffect(() => {
    // Filter doctors based on search term
    const filtered = doctors.filter(doctor =>
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.phone.includes(searchTerm) ||
      doctor.gst_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDoctors(filtered);
  }, [doctors, searchTerm]);

  const loadDoctorsCredits = async () => {
    setLoading(true);
    try {
      const data = await getAllDoctorsCredits();
      setDoctors(data);
    } catch (error) {
      console.error('Error loading doctors credits:', error);
      toast.error('Failed to load credit data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = (doctor: DoctorCredit) => {
    setSelectedDoctor(doctor);
    setPaymentAmount("");
    setPaymentNotes("");
    setIsPaymentDialogOpen(true);
  };

  const handleViewCreditDetails = async (doctor: DoctorCredit) => {
    setSelectedDoctor(doctor);
    setIsCreditDetailsOpen(true);
    setLoadingTransactions(true);
    
    try {
      const transactions = await getCreditTransactions(doctor.id);
      setCreditTransactions(transactions);
    } catch (error) {
      console.error('Error loading credit transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const submitPayment = async () => {
    if (!selectedDoctor || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    setIsRecordingPayment(true);
    try {
      const success = await recordPayment(selectedDoctor.id, amount, paymentNotes);
      if (success) {
        setIsPaymentDialogOpen(false);
        loadDoctorsCredits(); // Refresh the data
      }
    } catch (error) {
      console.error('Error recording payment:', error);
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 1000) return "text-green-600";
    if (balance > 0) return "text-blue-600";
    return "text-red-600";
  };

  const getBalanceBadgeColor = (balance: number) => {
    if (balance > 1000) return "bg-green-100 text-green-800";
    if (balance > 0) return "bg-blue-100 text-blue-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Credit Management</h1>
          <p className="text-gray-600">Manage doctor credits and payments</p>
        </div>
        <Button onClick={loadDoctorsCredits}>
          Refresh Data
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            placeholder="Search by doctor name, phone, or GST number..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <Card key={doctor.id}>
              <CardHeader>
                <CardTitle className="text-lg">{doctor.name}</CardTitle>
                <CardDescription>
                  {doctor.phone} • GST: {doctor.gst_number}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {doctor.creditSummary ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Current Balance:</span>
                      <Badge className={getBalanceBadgeColor(doctor.creditSummary.current_balance)}>
                        ₹{doctor.creditSummary.current_balance.toFixed(2)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Total Credit:</span>
                        <div className="font-medium">₹{doctor.creditSummary.total_credit.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Paid:</span>
                        <div className="font-medium">₹{doctor.creditSummary.total_paid.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewCreditDetails(doctor)}
                        className="flex-1"
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRecordPayment(doctor)}
                        className="flex-1"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Payment
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <p>No credit data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredDoctors.length === 0 && !loading && (
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? "No doctors found matching your search." : "No doctors found."}
          </p>
        </div>
      )}

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for Dr. {selectedDoctor?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Payment Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Payment notes..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsPaymentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={submitPayment}
              disabled={isRecordingPayment || !paymentAmount}
            >
              {isRecordingPayment ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credit Details Dialog */}
      <Dialog open={isCreditDetailsOpen} onOpenChange={setIsCreditDetailsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Credit Details - Dr. {selectedDoctor?.name}</DialogTitle>
            <DialogDescription>
              Complete credit transaction history
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedDoctor?.creditSummary && (
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    ₹{selectedDoctor.creditSummary.total_credit.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Total Credit</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    ₹{selectedDoctor.creditSummary.total_paid.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Total Paid</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className={`text-lg font-bold ${getBalanceColor(selectedDoctor.creditSummary.current_balance)}`}>
                    ₹{selectedDoctor.creditSummary.current_balance.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Current Balance</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">
                    ₹{selectedDoctor.creditSummary.pending_orders_amount.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Pending Orders</div>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Transaction History</h3>
              {loadingTransactions ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : creditTransactions.length > 0 ? (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {creditTransactions.map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={
                            transaction.type === 'credit' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {transaction.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No transactions found
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCredits;

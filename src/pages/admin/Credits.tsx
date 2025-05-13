
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { 
  CreditSummary, 
  CreditTransaction, 
  fetchAllDoctorCredits, 
  fetchCreditTransactions, 
  recordDoctorPayment 
} from "@/services/creditService";
import { supabase } from "@/integrations/supabase/client";
import CreditSummaryTable from "@/components/admin/credit/CreditSummaryTable";
import PaymentDialog from "@/components/admin/credit/PaymentDialog";
import CreditHistoryDialog from "@/components/admin/credit/CreditHistoryDialog";

const AdminCredits = () => {
  const [doctorCredits, setDoctorCredits] = useState<CreditSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<CreditSummary | null>(null);
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

  const handleRecordPayment = async (paymentAmount: number, paymentNotes: string) => {
    if (!selectedDoctor) return;

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
            <CreditSummaryTable 
              credits={sortedAndFilteredDoctors}
              sortOrder={sortOrder}
              toggleSortOrder={toggleSortOrder}
              onRecordPayment={(doctor) => {
                setSelectedDoctor(doctor);
                setPaymentDialogOpen(true);
              }}
              onViewHistory={viewCreditHistory}
              onSendSummary={handleSendCreditSummary}
              sendingEmail={sendingEmail}
            />
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <PaymentDialog 
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        doctor={selectedDoctor}
        onRecordPayment={handleRecordPayment}
        processing={processing}
      />
      
      {/* Credit History Dialog */}
      <CreditHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        doctor={selectedDoctor}
        transactions={creditTransactions}
        isLoading={loadingTransactions}
        sendingEmail={sendingEmail}
        onSendSummary={handleSendCreditSummary}
        onClose={() => {
          setHistoryDialogOpen(false);
          setSelectedDoctor(null);
          setCreditTransactions([]);
        }}
      />
    </div>
  );
};

export default AdminCredits;

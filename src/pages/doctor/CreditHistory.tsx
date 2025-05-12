
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CreditCard, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  CreditSummary, 
  CreditTransaction, 
  Payment,
  fetchDoctorCreditSummary, 
  fetchCreditTransactions,
  fetchDoctorPayments
} from "@/services/creditService";
import { supabase } from "@/integrations/supabase/client";

const DoctorCreditHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [creditSummary, setCreditSummary] = useState<CreditSummary | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchCreditData(user.id);
    }
  }, [user]);

  const fetchCreditData = async (doctorId: string) => {
    setLoading(true);
    try {
      const summary = await fetchDoctorCreditSummary(doctorId);
      const transactionData = await fetchCreditTransactions(doctorId);
      const paymentData = await fetchDoctorPayments(doctorId);
      
      setCreditSummary(summary);
      setTransactions(transactionData);
      setPayments(paymentData);
    } catch (error) {
      console.error("Error fetching credit data:", error);
      toast({
        title: "Error",
        description: "Failed to load your credit information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const requestCreditSummary = async () => {
    if (!user?.id) return;
    
    try {
      await supabase.functions.invoke('send-credit-summary', {
        body: { doctorId: user.id }
      });
      
      toast({
        title: "Email Sent",
        description: "Credit summary has been sent to your email."
      });
    } catch (error) {
      console.error("Error requesting credit summary:", error);
      toast({
        title: "Error",
        description: "Failed to send credit summary email.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return <Navigate to="/login" />;
  }

  const lastPayment = payments.length > 0 ? payments[0] : null;

  if (loading) {
    return (
      <Layout>
        <div className="container-custom py-8 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-custom py-8">
        <h1 className="text-3xl font-bold mb-6">Credit Management</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Current Credit Due
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{creditSummary?.total_credit.toLocaleString() || "0"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Outstanding balance
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Last Payment Made
              </CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {lastPayment ? `₹${lastPayment.amount.toLocaleString()}` : "No payments"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {lastPayment 
                  ? `on ${new Date(lastPayment.payment_date).toLocaleDateString()}` 
                  : "Make your first payment"
                }
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Transactions
              </CardTitle>
              <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactions.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Credit and debit entries
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={requestCreditSummary} variant="outline" size="sm" className="w-full">
                Email Credit Summary
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="transactions">Credit Transactions</TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Credit Transaction History</CardTitle>
                <CardDescription>
                  View all your order and payment transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableCaption>Your complete credit history</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length > 0 ? (
                      transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {new Date(transaction.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>
                            {transaction.reference_id 
                              ? transaction.reference_id.substring(0, 8) + "..." 
                              : "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={transaction.type === 'credit' 
                              ? "text-red-600" 
                              : "text-green-600"
                            }>
                              {transaction.type === 'credit' ? '+' : '-'} ₹{transaction.amount.toLocaleString()}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                          No transactions found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  View all your payment records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableCaption>Your payment history</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length > 0 ? (
                      payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            ₹{payment.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>{payment.notes || "N/A"}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                          No payment records found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default DoctorCreditHistory;

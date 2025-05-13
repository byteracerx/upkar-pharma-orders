import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchDoctorCreditSummary, fetchCreditTransactions, CreditTransaction, CreditSummary } from "@/services/creditService";
import { 
  CreditCard, 
  Clock, 
  ArrowLeftCircle, 
  ArrowRightCircle, 
  BadgeDollarSign, 
  ShoppingBag, 
  Loader2 
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit', 
    month: 'short', 
    year: 'numeric'
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

const CreditHistory = () => {
  const { user } = useAuth();
  const [creditSummary, setCreditSummary] = useState<CreditSummary | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      
      try {
        const summary = await fetchDoctorCreditSummary(user.id);
        const transactionData = await fetchCreditTransactions(user.id);
        
        setCreditSummary(summary);
        setTransactions(transactionData);
      } catch (error) {
        console.error("Error fetching credit data:", error);
        toast.error("Error", {
          description: "Failed to load credit information. Please try again later."
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user?.id]);
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container py-12 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
        </div>
      </Layout>
    );
  }
  
  if (!creditSummary) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <Card>
            <CardContent className="p-8">
              <BadgeDollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No Credit Information</h2>
              <p className="text-gray-600 mb-6">
                We couldn't find any credit information for your account.
              </p>
              <Button asChild>
                <a href="/products">Browse Products</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Credit History</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <Card className="bg-white shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <CreditCard className="h-8 w-8 text-upkar-blue" />
                  <div>
                    <h2 className="text-lg font-semibold">Credit Summary</h2>
                    <p className="text-gray-500">
                      As of {formatDate(new Date().toISOString())}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">Total Credit:</p>
                    <p className="text-2xl font-semibold">
                      {formatCurrency(creditSummary.total_credit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Account Details:</p>
                    <p>Name: {creditSummary.doctor_name}</p>
                    <p>Phone: {creditSummary.doctor_phone}</p>
                    <p>Email: {creditSummary.doctor_email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <div className="bg-white shadow rounded-md overflow-x-auto">
              <table className="min-w-full leading-normal">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-5 py-5 border-b border-gray-200 text-sm">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 text-sm">
                        {transaction.description}
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 text-sm text-center">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 text-sm text-center">
                        {transaction.type === 'credit' ? (
                          <span className="relative inline-block px-3 py-1 font-semibold text-green-900 leading-tight">
                            <span aria-hidden className="absolute inset-0 bg-green-200 opacity-50 rounded-full"></span>
                            <span className="relative">Credit</span>
                          </span>
                        ) : (
                          <span className="relative inline-block px-3 py-1 font-semibold text-red-900 leading-tight">
                            <span aria-hidden className="absolute inset-0 bg-red-200 opacity-50 rounded-full"></span>
                            <span className="relative">Debit</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default CreditHistory;


import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditSummaryCard } from "@/components/credit/CreditSummaryCard";
import { History, CreditCard, TrendingDown, TrendingUp } from "lucide-react";
import { 
  getDoctorCreditSummary, 
  getCreditTransactions,
  type CreditSummary,
  type CreditTransaction
} from "@/services/enhancedCreditService";

const CreditHistory = () => {
  const { user } = useAuth();
  const [creditSummary, setCreditSummary] = useState<CreditSummary | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadCreditData();
    }
  }, [user?.id]);

  const loadCreditData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const [summaryData, transactionsData] = await Promise.all([
        getDoctorCreditSummary(user.id),
        getCreditTransactions(user.id)
      ]);
      
      setCreditSummary(summaryData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading credit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    return type === 'credit' ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getTransactionColor = (type: string) => {
    return type === 'credit' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="container-custom py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Credit History</h1>
        <p className="text-gray-600">Track your account balance and transaction history</p>
      </div>

      {creditSummary && (
        <div className="mb-8">
          <CreditSummaryCard creditSummary={creditSummary} loading={loading} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <CardDescription>
            Complete record of all credit and debit transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>
                </div>
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <div className="font-medium text-gray-900">
                        {transaction.description}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {transaction.reference_id && (
                        <div className="text-xs text-gray-400 mt-1">
                          Ref: {transaction.reference_id}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getTransactionColor(transaction.type)}`}>
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
                      {transaction.type === 'credit' ? 'Credit' : 'Payment'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Yet</h3>
              <p className="text-gray-500">
                Your credit transactions will appear here once you start placing orders.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditHistory;

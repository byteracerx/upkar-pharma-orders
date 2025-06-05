
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, TrendingUp, Clock, DollarSign } from "lucide-react";
import type { CreditSummary } from "@/services/enhancedCreditService";

interface CreditSummaryCardProps {
  creditSummary: CreditSummary;
  loading?: boolean;
}

export const CreditSummaryCard = ({ creditSummary, loading }: CreditSummaryCardProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Credit</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            ₹{creditSummary.total_credit.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            From completed orders
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            creditSummary.current_balance >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            ₹{creditSummary.current_balance.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Available balance
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-700">
            ₹{creditSummary.total_paid.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Payments received
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            ₹{creditSummary.pending_orders_amount.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            In progress orders
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

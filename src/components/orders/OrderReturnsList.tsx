
import { Return } from "@/services/orderService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

interface OrderReturnsListProps {
  returns: Return[];
  isAdmin?: boolean;
  onUpdateReturnStatus?: (returnId: string, status: string) => void;
}

const OrderReturnsList = ({ returns, isAdmin = false, onUpdateReturnStatus }: OrderReturnsListProps) => {
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return "bg-yellow-100 text-yellow-800";
      case 'approved':
        return "bg-green-100 text-green-800";
      case 'rejected':
        return "bg-red-100 text-red-800";
      case 'processing':
        return "bg-blue-100 text-blue-800";
      case 'completed':
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Return Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {returns.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No returns found for this order</p>
          ) : (
            returns.map((returnItem) => (
              <div key={returnItem.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Return ID</p>
                    <p className="font-medium">{returnItem.id.substring(0, 8)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="text-sm">{formatDate(returnItem.created_at)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-medium">{formatCurrency(returnItem.amount)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge className={getStatusBadgeColor(returnItem.status)}>
                      {returnItem.status.charAt(0).toUpperCase() + returnItem.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-1">Reason for Return</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {returnItem.reason}
                  </p>
                </div>
                
                {returnItem.items && returnItem.items.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Items</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {returnItem.items.map(item => (
                          <TableRow key={item.id}>
                            <TableCell>{item.product?.name || 'Unknown Product'}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.total_price)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                
                {isAdmin && onUpdateReturnStatus && returnItem.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      className="text-green-600 border-green-200 hover:bg-green-50" 
                      onClick={() => onUpdateReturnStatus(returnItem.id, 'approved')}
                    >
                      Approve Return
                    </Button>
                    <Button 
                      variant="outline" 
                      className="text-red-600 border-red-200 hover:bg-red-50" 
                      onClick={() => onUpdateReturnStatus(returnItem.id, 'rejected')}
                    >
                      Reject Return
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderReturnsList;

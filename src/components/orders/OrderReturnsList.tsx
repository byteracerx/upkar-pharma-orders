
import { useState } from 'react';
import { OrderReturn } from '@/services/orderService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface OrderReturnsListProps {
  returns: OrderReturn[];
}

const OrderReturnsList = ({ returns }: OrderReturnsListProps) => {
  const [expandedReturnId, setExpandedReturnId] = useState<string | null>(null);
  
  if (!returns.length) {
    return (
      <div className="text-center py-6 border rounded-md bg-gray-50">
        <p className="text-gray-500">No return requests for this order</p>
      </div>
    );
  }
  
  const toggleExpand = (returnId: string) => {
    setExpandedReturnId(expandedReturnId === returnId ? null : returnId);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'completed':
        return <Badge className="bg-purple-100 text-purple-800">Completed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <div className="space-y-4">
      {returns.map((returnItem) => (
        <Card key={returnItem.id} className="overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Return #{returnItem.id.substring(0, 8)}</p>
                <p className="text-sm text-gray-500">
                  Initiated on {formatDate(returnItem.created_at)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(returnItem.status)}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpand(returnItem.id)}
                >
                  {expandedReturnId === returnItem.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {expandedReturnId === returnItem.id && (
              <div className="mt-4 border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Return Reason</p>
                    <p className="text-sm">{returnItem.reason}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Refund Amount</p>
                    <p className="text-sm font-medium">₹{returnItem.amount.toFixed(2)}</p>
                  </div>
                  
                  {returnItem.notes && (
                    <div className="col-span-1 md:col-span-2">
                      <p className="text-sm text-gray-500 mb-1">Notes</p>
                      <p className="text-sm">{returnItem.notes}</p>
                    </div>
                  )}
                  
                  {returnItem.processed_by && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Processed By</p>
                      <p className="text-sm">{returnItem.processed_by}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                    <p className="text-sm">{formatDate(returnItem.updated_at)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default OrderReturnsList;

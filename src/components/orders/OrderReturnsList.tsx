
import { OrderReturn } from "@/services/orderService";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderReturnsListProps {
  returns: OrderReturn[];
  isAdmin?: boolean;
  onUpdateReturnStatus?: (returnId: string, status: string) => void;
}

const OrderReturnsList = ({ returns, isAdmin = false, onUpdateReturnStatus }: OrderReturnsListProps) => {
  const [processingReturnId, setProcessingReturnId] = useState<string | null>(null);

  // Function to get badge color based on status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default"; // Changed from "success" to "default"
      case "pending":
        return "secondary"; // Changed from "warning" to "secondary"
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Function to handle return status update
  const handleStatusUpdate = async (returnId: string, status: string) => {
    if (!onUpdateReturnStatus) return;
    
    setProcessingReturnId(returnId);
    try {
      await onUpdateReturnStatus(returnId, status);
    } finally {
      setProcessingReturnId(null);
    }
  };

  if (!returns || returns.length === 0) {
    return <p className="text-gray-500 text-center py-4">No returns found for this order.</p>;
  }

  return (
    <div className="space-y-6">
      {returns.map((returnItem) => (
        <div
          key={returnItem.id}
          className="border rounded-md p-4 bg-gray-50"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-gray-500" />
              <h4 className="font-medium">Return #{returnItem.id.slice(0, 8)}</h4>
            </div>
            <Badge variant={getStatusBadgeVariant(returnItem.status)}>
              {returnItem.status.charAt(0).toUpperCase() + returnItem.status.slice(1)}
            </Badge>
          </div>

          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Date Requested:</span>
              <span>{formatDate(returnItem.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium">{formatCurrency(returnItem.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reason:</span>
              <span className="text-right">{returnItem.reason}</span>
            </div>
            {returnItem.notes && (
              <div className="flex justify-between">
                <span className="text-gray-600">Notes:</span>
                <span className="text-right">{returnItem.notes}</span>
              </div>
            )}
          </div>

          {returnItem.items && returnItem.items.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h5 className="font-medium mb-2">Returned Items</h5>
              <div className="space-y-2">
                {returnItem.items.map((item, index) => (
                  <div key={item.id || index} className="flex justify-between text-sm">
                    <span>
                      {item.product?.name || "Unknown product"} x {item.quantity}
                    </span>
                    <span>{formatCurrency(item.total_price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isAdmin && returnItem.status === "pending" && (
            <div className="mt-4 border-t pt-4 flex items-center justify-between">
              <span className="text-sm font-medium">Update Status:</span>
              <div className="flex gap-2">
                <Select
                  disabled={!!processingReturnId}
                  onValueChange={(value) => handleStatusUpdate(returnItem.id, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Change status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approve</SelectItem>
                    <SelectItem value="rejected">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default OrderReturnsList;

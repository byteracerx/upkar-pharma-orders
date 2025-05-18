
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ArrowLeft, BoxOpen, Check, Package } from "lucide-react";

export interface OrderReturn {
  id: string;
  order_id: string;
  doctor_id: string;
  reason: string;
  status: string;
  amount: number;
  created_at: string;
  updated_at: string;
  processed_by?: string;
  notes?: string;
  items?: {
    id: string;
    product_id: string;
    quantity: number;
    price_per_unit: number;
    total_price: number;
    reason?: string;
    condition?: string;
    product?: {
      name: string;
      price: number;
      category?: string;
    };
  }[];
}

export interface OrderReturnsListProps {
  returns: OrderReturn[];
  isAdmin?: boolean;
  onUpdateReturnStatus?: (returnId: string, status: string) => void;
}

const OrderReturnsList = ({ returns, isAdmin, onUpdateReturnStatus }: OrderReturnsListProps) => {
  if (!returns || returns.length === 0) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP");
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium flex items-center gap-2">
        <BoxOpen className="h-5 w-5" />
        Returns ({returns.length})
      </h3>

      {returns.map((returnItem) => (
        <Card key={returnItem.id} className="overflow-hidden">
          <CardHeader className="bg-gray-50 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  Return #{returnItem.id.substring(0, 8)}
                </CardTitle>
                <CardDescription>
                  Created on {formatDate(returnItem.created_at)}
                </CardDescription>
              </div>
              <Badge className={getStatusColor(returnItem.status)}>
                {returnItem.status.charAt(0).toUpperCase() +
                  returnItem.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Return Reason:</h4>
                <p className="text-sm text-gray-600">{returnItem.reason}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Items:</h4>
                <div className="space-y-2">
                  {returnItem.items && returnItem.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span>
                          {item.product?.name || "Product"} x {item.quantity}
                        </span>
                      </div>
                      <span className="font-medium">
                        ${item.total_price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Refund:</span>
                <span className="text-lg font-bold">
                  ${returnItem.amount.toFixed(2)}
                </span>
              </div>

              {isAdmin && onUpdateReturnStatus && returnItem.status === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="w-1/2"
                    onClick={() =>
                      onUpdateReturnStatus(returnItem.id, "rejected")
                    }
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    className="w-1/2"
                    onClick={() =>
                      onUpdateReturnStatus(returnItem.id, "approved")
                    }
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </div>
              )}

              {returnItem.notes && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Notes:</span> {returnItem.notes}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OrderReturnsList;

import { OrderStatusHistory } from "@/services/orderService";
import { formatDate } from "@/lib/utils";
import { 
  CheckCircle2, 
  Clock, 
  Package, 
  Truck, 
  XCircle, 
  RotateCcw,
  ShoppingBag
} from "lucide-react";

interface OrderStatusTimelineProps {
  statusHistory: OrderStatusHistory[];
}

const OrderStatusTimeline = ({ statusHistory }: OrderStatusTimelineProps) => {
  // Function to get icon based on status
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'processing':
        return <Package className="h-5 w-5 text-yellow-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'return_initiated':
      case 'returned':
        return <RotateCcw className="h-5 w-5 text-orange-500" />;
      case 'shipping_updated':
        return <Truck className="h-5 w-5 text-indigo-500" />;
      default:
        return <ShoppingBag className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Function to get title based on status
  const getStatusTitle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Order Placed';
      case 'processing':
        return 'Processing Order';
      case 'shipped':
        return 'Order Shipped';
      case 'delivered':
        return 'Order Delivered';
      case 'cancelled':
        return 'Order Cancelled';
      case 'return_initiated':
        return 'Return Initiated';
      case 'returned':
        return 'Order Returned';
      case 'shipping_updated':
        return 'Shipping Updated';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
    }
  };
  
  return (
    <div className="space-y-6">
      {statusHistory.map((status, index) => (
        <div key={status.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
              {getStatusIcon(status.status)}
            </div>
            {index < statusHistory.length - 1 && (
              <div className="h-full w-px bg-gray-200 my-1"></div>
            )}
          </div>
          <div className="space-y-1 pt-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{getStatusTitle(status.status)}</p>
              <span className="text-xs text-gray-500">{formatDate(status.created_at)}</span>
            </div>
            {status.notes && (
              <p className="text-sm text-gray-600">{status.notes}</p>
            )}
            {status.created_by && status.admin_name && (
              <p className="text-xs text-gray-500">Updated by {status.admin_name}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderStatusTimeline;
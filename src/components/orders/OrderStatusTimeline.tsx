
import { StatusHistory } from '@/services/order/types';
import { formatDate } from '@/lib/utils';
import {
  Truck,
  Package,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  User
} from 'lucide-react';

interface OrderStatusTimelineProps {
  statusHistory: StatusHistory[];
}

const OrderStatusTimeline = ({ statusHistory = [] }: OrderStatusTimelineProps) => {
  // Sort status history by date (newest first)
  const sortedHistory = [...statusHistory].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ShoppingBag className="h-5 w-5 text-blue-500" />;
      case 'processing':
        return <Package className="h-5 w-5 text-yellow-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'return_initiated':
        return <RotateCcw className="h-5 w-5 text-orange-500" />;
      case 'returned':
        return <RotateCcw className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  // Function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-blue-600';
      case 'processing':
        return 'text-yellow-600';
      case 'shipped':
        return 'text-purple-600';
      case 'delivered':
        return 'text-green-600';
      case 'cancelled':
        return 'text-red-600';
      case 'return_initiated':
        return 'text-orange-600';
      case 'returned':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  // Function to get status description
  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Order has been placed and is awaiting processing';
      case 'processing':
        return 'Order is being prepared for shipment';
      case 'shipped':
        return 'Order has been shipped and is on the way';
      case 'delivered':
        return 'Order has been delivered successfully';
      case 'cancelled':
        return 'Order has been cancelled';
      case 'return_initiated':
        return 'Return has been initiated for this order';
      case 'returned':
        return 'Order has been returned';
      default:
        return 'Status updated';
    }
  };

  // Render empty state if no status history
  if (!sortedHistory || sortedHistory.length === 0) {
    return <div className="text-gray-500 italic">No status history available</div>;
  }

  return (
    <div className="space-y-6">
      {sortedHistory.map((status, index) => (
        <div key={status.id} className="relative flex">
          {/* Left timeline */}
          <div className="flex flex-col items-center mr-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-200 bg-white">
              {getStatusIcon(status.status)}
            </div>
            {index !== sortedHistory.length - 1 && (
              <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-col pb-6">
            <div className={`font-medium text-lg ${getStatusColor(status.status)}`}>
              {status.status.charAt(0).toUpperCase() + status.status.slice(1).replace('_', ' ')}
            </div>
            <div className="text-gray-600 mb-1">{getStatusDescription(status.status)}</div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDate(status.created_at)}
              </div>
              {status.admin_name && (
                <div className="flex items-center gap-1 ml-3">
                  <User className="h-4 w-4" />
                  <span>Updated by: {status.admin_name}</span>
                </div>
              )}
            </div>
            {status.notes && <div className="mt-1 text-gray-700 italic">{status.notes}</div>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderStatusTimeline;


import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Loader2, Eye, FileText, Truck } from "lucide-react";
import { fetchAllOrders, generateInvoice, updateOrderStatus } from "@/services/admin/orderManagement";
import { Order } from "@/services/order/types";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

export const RecentOrdersCard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  const fetchRecentOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await fetchAllOrders();
      // Get the 5 most recent orders
      setOrders(allOrders.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      toast.error('Failed to load recent orders');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const result = await generateInvoice(orderId);
      if (result) {
        // Update local state
        setOrders(orders.map(order => 
          order.id === orderId 
            ? { ...order, invoice_generated: true }
            : order
        ));
        toast.success("Invoice generated successfully");
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusUpdate = async (orderId: string, status: string) => {
    setActionLoading(orderId);
    try {
      const success = await updateOrderStatus(orderId, status);
      if (success) {
        // Update local state
        setOrders(orders.map(order => 
          order.id === orderId 
            ? { ...order, status }
            : order
        ));
        toast.success(`Order ${status} successfully`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest orders from doctors</CardDescription>
        </div>
        <Link to="/admin/orders">
          <Button variant="outline" size="sm">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {order.invoice_number || `Order ${order.id.substring(0, 8)}...`}
                    </span>
                    <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(order.total_amount)}</span>
                </div>
                
                <div className="text-sm text-gray-600">
                  <div>Dr. {order.doctor?.name || 'Unknown'}</div>
                  <div className="text-xs text-gray-500">
                    {formatDate(order.created_at)}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Link to={`/admin/enhanced-orders`}>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      View
                    </Button>
                  </Link>
                  
                  {!order.invoice_generated && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => handleGenerateInvoice(order.id)}
                      disabled={actionLoading === order.id}
                    >
                      {actionLoading === order.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <FileText className="h-3 w-3" />
                      )}
                      Invoice
                    </Button>
                  )}

                  {order.status === 'pending' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => handleStatusUpdate(order.id, 'processing')}
                      disabled={actionLoading === order.id}
                    >
                      {actionLoading === order.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Truck className="h-3 w-3" />
                      )}
                      Process
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-4 text-gray-500">
            No recent orders found
          </div>
        )}
      </CardContent>
    </Card>
  );
};

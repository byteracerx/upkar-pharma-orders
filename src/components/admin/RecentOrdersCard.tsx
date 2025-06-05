
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Loader2, Eye } from "lucide-react";

interface RecentOrder {
  id: string;
  doctor_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  invoice_number?: string;
}

export const RecentOrdersCard = () => {
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  const fetchRecentOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          invoice_number,
          doctor:doctor_id (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const formattedOrders = data.map(order => ({
        id: order.id,
        doctor_name: order.doctor?.name || 'Unknown Doctor',
        total_amount: order.total_amount,
        status: order.status,
        created_at: order.created_at,
        invoice_number: order.invoice_number
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
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
              <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {order.invoice_number || `Order ${order.id.substring(0, 8)}...`}
                    </span>
                    <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>Dr. {order.doctor_name}</div>
                    <div>₹{order.total_amount.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <Link to={`/admin/orders`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
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

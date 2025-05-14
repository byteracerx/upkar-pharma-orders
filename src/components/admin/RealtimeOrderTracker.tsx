import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface OrderCount {
  status: string;
  count: number;
}

const RealtimeOrderTracker = () => {
  const [orderCounts, setOrderCounts] = useState<OrderCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderCounts();

    // Set up real-time subscription
    const ordersChannel = supabase
      .channel('order-status-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrderCounts(); // Refresh counts on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  const fetchOrderCounts = async () => {
    try {
      setLoading(true);

      // Try using RPC function if available
      try {
        const { data, error } = await supabase.rpc('get_order_counts_by_status');
        
        if (!error && data) {
          setOrderCounts(data);
          return;
        }
      } catch (rpcError) {
        console.warn("RPC function get_order_counts_by_status failed, falling back to direct query:", rpcError);
      }

      // Fallback to direct queries
      const statuses = ['pending', 'processing', 'delivered', 'cancelled'];
      const counts: OrderCount[] = [];

      for (const status of statuses) {
        const { count, error } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', status);

        if (error) {
          console.error(`Error fetching ${status} orders count:`, error);
          continue;
        }

        counts.push({
          status,
          count: count || 0
        });
      }

      setOrderCounts(counts);
    } catch (error) {
      console.error("Error fetching order counts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Order Status Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-5 w-5 animate-spin text-upkar-blue" />
          </div>
        ) : (
          <div className="space-y-2">
            {orderCounts.map((item) => (
              <Link 
                key={item.status} 
                to="/admin/orders" 
                className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(item.status)}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Badge>
                </div>
                <span className="font-medium">{item.count}</span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RealtimeOrderTracker;
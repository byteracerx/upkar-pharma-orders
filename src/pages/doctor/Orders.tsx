
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, ArrowUpRight, AlertCircle, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { fetchDoctorOrdersReliable } from "@/services/doctorOrderService";
import { Order as OrderType } from "@/services/order/types";

// Extend the Order type to include items_count which is needed in this component
interface Order extends OrderType {
  items_count: number;
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        const ordersData = await fetchDoctorOrdersReliable(user.id);
        
        // Transform orders data to include items_count
        const ordersWithItemCount = ordersData.map(order => ({
          ...order,
          items_count: 0 // Default value since we don't have this info from the API
        }));
        
        setOrders(ordersWithItemCount);
        setFilteredOrders(ordersWithItemCount);
      } catch (error: any) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to load orders", {
          description: error.message || "Please try again later"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrders();
  }, [user?.id]);
  
  useEffect(() => {
    // Filter orders based on active tab
    if (activeTab === "all") {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === activeTab));
    }
  }, [activeTab, orders]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const getOrderStatusClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Layout>
      <div className="container-custom py-8">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>
        
        <Tabs defaultValue="all" onValueChange={handleTabChange} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="shipped">Shipped</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            <Card>
              <CardHeader>
                <CardTitle>{activeTab === "all" ? "All Orders" : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Orders`}</CardTitle>
                <CardDescription>
                  {activeTab === "all" 
                    ? "View all your orders" 
                    : `Orders with status: ${activeTab}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
                  </div>
                ) : filteredOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-500 border-b">
                          <th className="pb-3 pl-2">Order ID</th>
                          <th className="pb-3">Date</th>
                          <th className="pb-3">Items</th>
                          <th className="pb-3">Total</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order) => (
                          <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="py-3 pl-2">{order.id.substring(0, 8)}...</td>
                            <td className="py-3">{new Date(order.created_at).toLocaleDateString()}</td>
                            <td className="py-3">{order.items_count}</td>
                            <td className="py-3">₹{order.total_amount.toLocaleString()}</td>
                            <td className="py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getOrderStatusClass(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="sm" asChild>
                                  <Link to={`/orders/${order.id}`}>
                                    <FileText className="h-4 w-4 mr-1" />
                                    Details
                                  </Link>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <AlertCircle className="h-6 w-6 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
                    <p className="text-gray-500 mb-6">
                      {activeTab === "all" 
                        ? "You haven't placed any orders yet."
                        : `You don't have any ${activeTab} orders.`}
                    </p>
                    <Button asChild>
                      <Link to="/products">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Browse Products
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Orders;

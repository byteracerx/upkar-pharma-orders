import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  Truck,
  CreditCard,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  CreditSummary, 
  CreditTransaction, 
  fetchDoctorCreditSummary, 
  fetchCreditTransactions 
} from "@/services/creditService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  items_count?: number;
}

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [creditSummary, setCreditSummary] = useState<CreditSummary | null>(null);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch orders
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .eq("doctor_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);
          
        if (ordersError) throw ordersError;
        
        // Count pending orders
        const { count: pendingCount, error: pendingError } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("doctor_id", user.id)
          .in("status", ["pending", "processing"]);
          
        if (pendingError) throw pendingError;
        
        // Count total orders
        const { count: totalCount, error: totalError } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("doctor_id", user.id);
          
        if (totalError) throw totalError;
        
        // Get order items count for each order
        const ordersWithItemCount = await Promise.all(
          ordersData.map(async (order) => {
            const { count, error } = await supabase
              .from("order_items")
              .select("*", { count: "exact", head: true })
              .eq("order_id", order.id);
              
            return {
              ...order,
              items_count: count || 0
            };
          })
        );
        
        // Fetch credit summary
        const creditData = await fetchDoctorCreditSummary(user.id);
        
        // Fetch credit transactions
        const transactionsData = await fetchCreditTransactions(user.id);
        
        setOrders(ordersWithItemCount);
        setPendingOrdersCount(pendingCount || 0);
        setTotalOrdersCount(totalCount || 0);
        setCreditSummary(creditData);
        setCreditTransactions(transactionsData);
        
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data", {
          description: error.message
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user.id]);
  
  const viewOrderDetails = async (order: Order) => {
    setSelectedOrder(order);
    setOrderDetailsOpen(true);
    
    try {
      setLoadingOrderDetails(true);
      
      const { data, error } = await supabase
        .from("order_items")
        .select(`
          *,
          product:product_id (name, category)
        `)
        .eq("order_id", order.id);
        
      if (error) throw error;
      
      setOrderItems(data);
    } catch (error: any) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to load order details", {
        description: error.message
      });
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  return (
    <Layout>
      <div className="container-custom py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user.name || 'Doctor'}</h1>
            <p className="text-gray-600">Manage your orders and account details</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/products">Browse Products</Link>
            </Button>
            <Button asChild>
              <Link to="/cart">View Cart</Link>
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Orders
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingOrdersCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Currently being processed
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Credit Balance
                  </CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{creditSummary?.total_credit.toLocaleString() || "0"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Outstanding balance
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Orders
                  </CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalOrdersCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Lifetime orders placed
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Tabs defaultValue="orders" className="space-y-4">
              <TabsList>
                <TabsTrigger value="orders">Recent Orders</TabsTrigger>
                <TabsTrigger value="credit">Credit History</TabsTrigger>
              </TabsList>
              <TabsContent value="orders" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>
                      View and track your recent orders
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {orders.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left text-sm text-gray-500 border-b">
                              <th className="pb-3">Order ID</th>
                              <th className="pb-3">Date</th>
                              <th className="pb-3">Items</th>
                              <th className="pb-3">Total</th>
                              <th className="pb-3">Status</th>
                              <th className="pb-3"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.map((order) => (
                              <tr key={order.id} className="border-b last:border-0">
                                <td className="py-3">{order.id.substring(0, 8)}...</td>
                                <td className="py-3">{new Date(order.created_at).toLocaleDateString()}</td>
                                <td className="py-3">{order.items_count}</td>
                                <td className="py-3">₹{order.total_amount.toLocaleString()}</td>
                                <td className="py-3">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      order.status === "delivered"
                                        ? "bg-green-100 text-green-800"
                                        : order.status === "processing"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : order.status === "pending"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {order.status === "delivered" ? (
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                    ) : (
                                      <Truck className="h-3 w-3 mr-1" />
                                    )}
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                  </span>
                                </td>
                                <td className="py-3">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => viewOrderDetails(order)}
                                  >
                                    View
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">You haven't placed any orders yet.</p>
                        <Button className="mt-4" asChild>
                          <Link to="/products">Browse Products</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="credit" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Credit History</CardTitle>
                    <CardDescription>
                      Track your credits and payments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {creditTransactions.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left text-sm text-gray-500 border-b">
                              <th className="pb-3">ID</th>
                              <th className="pb-3">Date</th>
                              <th className="pb-3">Description</th>
                              <th className="pb-3">Amount</th>
                              <th className="pb-3"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {creditTransactions.map((item) => (
                              <tr key={item.id} className="border-b last:border-0">
                                <td className="py-3">{item.id.substring(0, 8)}...</td>
                                <td className="py-3">{new Date(item.date).toLocaleDateString()}</td>
                                <td className="py-3">{item.description}</td>
                                <td className="py-3">
                                  <span
                                    className={
                                      item.type === "credit"
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }
                                  >
                                    {item.type === "credit" ? "+" : "-"} ₹{item.amount.toLocaleString()}
                                  </span>
                                </td>
                                <td className="py-3">
                                  {item.type === "debit" && item.reference_id && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => {
                                        // In a real app, this would download the invoice
                                        toast.info("Invoice Download", {
                                          description: "This would download the invoice in a real app."
                                        });
                                      }}
                                    >
                                      <FileText className="h-4 w-4 mr-1" />
                                      Invoice
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No credit transactions found.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
      
      {/* Order Details Dialog */}
      <Dialog open={orderDetailsOpen} onOpenChange={setOrderDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrder && (
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Order ID:</span> {selectedOrder.id}
                  <br />
                  <span className="font-medium">Date:</span> {new Date(selectedOrder.created_at).toLocaleString()}
                  <br />
                  <span className="font-medium">Status:</span> {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {loadingOrderDetails ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
            </div>
          ) : orderItems.length > 0 ? (
            <div className="py-4">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3">Product</th>
                    <th className="pb-3">Quantity</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-3">{item.product?.name || "Unknown Product"}</td>
                      <td className="py-3">{item.quantity}</td>
                      <td className="py-3">₹{item.price_per_unit.toLocaleString()}</td>
                      <td className="py-3 text-right">₹{item.total_price.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="mt-4 text-right">
                <p className="font-bold">
                  Total: ₹{selectedOrder?.total_amount.toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center p-4">
              <p className="text-gray-500">No items found for this order.</p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                // In a real app, this would download the invoice
                toast.info("Invoice Download", {
                  description: "This would download the invoice in a real app."
                });
              }}
              className="mr-auto"
            >
              <FileText className="h-4 w-4 mr-2" />
              Download Invoice
            </Button>
            
            <Button
              onClick={() => {
                setOrderDetailsOpen(false);
                setSelectedOrder(null);
                setOrderItems([]);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default DoctorDashboard;

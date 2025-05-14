
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Eye, FileText, Send, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { fetchAllOrders, updateOrderStatus, generateInvoice, synchronizeOrders } from "@/services/adminService";
import { fetchOrderItems } from "@/services/orderService";
import { subscribeToOrders } from "@/services/realtimeService";

type Order = {
  id: string;
  created_at: string;
  doctor_id: string;
  status: string;
  total_amount: number;
  doctor_name?: string;
  doctor_phone?: string;
  invoice_number?: string;
  invoice_generated?: boolean;
  invoice_url?: string;
  doctor?: {
    name: string;
    phone: string;
  };
};

type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  product: {
    name: string;
    category: string | null;
  } | null;
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Fetch orders from Supabase
  useEffect(() => {
    loadOrders();
    
    // Set up real-time subscription for orders table
    const unsubscribe = subscribeToOrders((payload) => {
      console.log('Orders table changed:', payload);
      loadOrders(); // Refresh data on any change
    });
    
    return () => {
      unsubscribe(); // Clean up subscription on unmount
    };
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log("Loading orders...");
      
      // Try to synchronize orders first to ensure all pending orders are visible
      await synchronizeOrders();
      
      // Fetch all orders using the service
      const data = await fetchAllOrders();
      console.log(`Fetched ${data.length} orders from service`);
      
      // Check for pending orders in the fetched data
      const pendingOrders = data.filter((order: any) => order.status === 'pending');
      console.log(`Found ${pendingOrders.length} pending orders in fetched data`);
      
      setOrders(data);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders", {
        description: error.message || "Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch order details
  const fetchOrderDetails = async (orderId: string) => {
    try {
      setIsLoadingDetails(true);
      
      // Use the orderService function
      const items = await fetchOrderItems(orderId);
      setOrderItems(items);
    } catch (error: any) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to load order details", {
        description: error.message || "Please try again."
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setIsUpdatingStatus(true);
      
      const success = await updateOrderStatus(orderId, newStatus);
      
      if (success) {
        // Update local state
        setOrders(
          orders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );

        toast.success("Status Updated", {
          description: `Order ${orderId.substring(0, 8)}... status changed to ${newStatus}`
        });
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error: any) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status", {
        description: error.message || "Please try again."
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  
  // Generate invoice
  const handleGenerateInvoice = async (orderId: string) => {
    try {
      setIsGeneratingInvoice(true);
      
      const success = await generateInvoice(orderId);
      
      if (success) {
        toast.success("Invoice Generated", {
          description: "The invoice has been generated and sent to the doctor."
        });
        
        // Update orders list to reflect invoice generation
        loadOrders();
      } else {
        throw new Error("Failed to generate invoice");
      }
    } catch (error: any) {
      console.error("Error generating invoice:", error);
      toast.error("Failed to generate invoice", {
        description: error.message || "Please try again."
      });
    } finally {
      setIsGeneratingInvoice(false);
    }
  };
  
  // Send notification
  const sendNotification = async (orderId: string) => {
    try {
      setIsSendingNotification(true);
      
      // Get the order details
      const order = orders.find(o => o.id === orderId);
      
      if (!order) {
        throw new Error("Order not found");
      }
      
      // Create notification record in database
      const { error: notificationError } = await supabase
        .from("order_notifications")
        .insert({
          order_id: orderId,
          notification_type: "status_update",
          recipient: order.doctor_id,
          content: `Your order status has been updated to: ${order.status}`,
          status: "sent"
        });
        
      if (notificationError) {
        throw notificationError;
      }
      
      toast.success("Notification Sent", {
        description: `Notification sent to doctor: ${order.doctor_name}`
      });
      
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification", {
        description: error.message || "Please try again."
      });
    } finally {
      setIsSendingNotification(false);
    }
  };
  
  // View order details
  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    fetchOrderDetails(order.id);
    setIsOrderDetailsOpen(true);
  };

  // Filter orders based on search term
  const filteredOrders = orders.filter(
    (order) =>
      (order.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.doctor_phone && order.doctor_phone.includes(searchTerm))
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Order Management</h1>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            placeholder="Search by doctor name, phone or order ID..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadOrders}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          
          <Button 
            variant="outline" 
            onClick={async () => {
              try {
                setLoading(true);
                
                // Direct query for pending orders
                const { data, error } = await supabase
                  .from("orders")
                  .select(`
                    *,
                    doctor:doctor_id (
                      id,
                      name,
                      phone
                    )
                  `)
                  .eq("status", "pending")
                  .order("created_at", { ascending: false });
                  
                if (error) throw error;
                
                console.log(`Found ${data.length} pending orders via direct query`);
                
                if (data.length === 0) {
                  toast.info("No pending orders found");
                  return;
                }
                
                // Process the data
                const processedOrders = data.map(order => ({
                  ...order,
                  doctor_name: order.doctor?.name || "Unknown",
                  doctor_phone: order.doctor?.phone || "N/A"
                }));
                
                // Update the orders state with only pending orders
                setOrders(processedOrders);
                
                toast.success(`Found ${processedOrders.length} pending orders`);
              } catch (error: any) {
                console.error("Error fetching pending orders:", error);
                toast.error("Failed to load pending orders", {
                  description: error.message || "Please try again."
                });
              } finally {
                setLoading(false);
              }
            }}
            className="flex items-center gap-2"
          >
            Show Pending Only
          </Button>
          
          <Button 
            variant="outline" 
            onClick={async () => {
              try {
                setLoading(true);
                toast.info("Synchronizing orders...");
                
                const success = await synchronizeOrders();
                
                if (success) {
                  toast.success("Orders synchronized successfully");
                  loadOrders(); // Reload orders after synchronization
                } else {
                  toast.error("Failed to synchronize orders");
                }
              } catch (error: any) {
                console.error("Error synchronizing orders:", error);
                toast.error("Failed to synchronize orders", {
                  description: error.message || "Please try again."
                });
              } finally {
                setLoading(false);
              }
            }}
            className="flex items-center gap-2"
          >
            Sync Orders
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            Manage and track all orders placed by doctors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
            </div>
          ) : filteredOrders.length > 0 ? (
            <Table>
              <TableCaption>A list of all orders</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Update Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.invoice_number || order.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>{order.doctor_name}</TableCell>
                    <TableCell>{order.doctor_phone}</TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>₹{order.total_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        className={`${
                          order.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "processing"
                            ? "bg-yellow-100 text-yellow-800"
                            : order.status === "pending"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                        disabled={isUpdatingStatus}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => viewOrderDetails(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {!order.invoice_generated && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleGenerateInvoice(order.id)}
                            disabled={isGeneratingInvoice}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-8">
              <p className="text-gray-500">
                No orders found. {searchTerm && "Try a different search term."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Order Details Dialog */}
      <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
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
                  <span className="font-medium">Doctor:</span> {selectedOrder.doctor_name}
                  <br />
                  <span className="font-medium">Status:</span> {selectedOrder.status}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingDetails ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
            </div>
          ) : orderItems.length > 0 ? (
            <div className="py-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product?.name || "Unknown Product"}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>₹{item.price_per_unit.toFixed(2)}</TableCell>
                      <TableCell>₹{item.total_price.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-4 text-right">
                <p className="font-bold">
                  Total: ₹{selectedOrder?.total_amount.toFixed(2)}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center p-4">
              <p className="text-gray-500">No items found for this order.</p>
            </div>
          )}
          
          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => selectedOrder && handleGenerateInvoice(selectedOrder.id)}
                disabled={isGeneratingInvoice || (selectedOrder?.invoice_generated)}
              >
                {isGeneratingInvoice ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Generate Invoice
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => selectedOrder && sendNotification(selectedOrder.id)}
                disabled={isSendingNotification}
              >
                {isSendingNotification ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send Notification
              </Button>
            </div>
            
            <Button
              variant="default"
              onClick={() => setIsOrderDetailsOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;

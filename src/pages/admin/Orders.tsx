
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
import { Loader2, Search, Eye, FileText, Send, RefreshCw, Filter, Calendar } from "lucide-react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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

const OrderStatusBadge = ({ status }: { status: string }) => {
  let colorClass = "";
  
  switch (status) {
    case "pending":
      colorClass = "bg-blue-100 text-blue-800";
      break;
    case "processing":
      colorClass = "bg-yellow-100 text-yellow-800";
      break;
    case "shipped":
      colorClass = "bg-purple-100 text-purple-800";
      break;
    case "delivered":
      colorClass = "bg-green-100 text-green-800";
      break;
    case "cancelled":
      colorClass = "bg-red-100 text-red-800";
      break;
    default:
      colorClass = "bg-gray-100 text-gray-800";
  }
  
  return (
    <Badge className={colorClass}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
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
  const [activeTab, setActiveTab] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [messageInput, setMessageInput] = useState("");
  
  // Fetch orders from Supabase
  useEffect(() => {
    loadOrders();
    
    // Set up real-time subscription for orders table
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Orders table changed:', payload);
          loadOrders(); // Refresh data on any change
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log("Loading orders...");
      
      // Fetch all orders with doctor information
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          doctor:doctor_id (
            name,
            phone
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      console.log(`Fetched ${data.length} orders`);
      
      // Process the data to ensure it has the correct structure
      const processedOrders = data.map(order => ({
        ...order,
        doctor_name: order.doctor?.name || "Unknown",
        doctor_phone: order.doctor?.phone || "N/A"
      }));
      
      setOrders(processedOrders);
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
      
      // Fetch order items with product details
      const { data, error } = await supabase
        .from("order_items")
        .select(`
          *,
          product:product_id (
            name,
            category
          )
        `)
        .eq("order_id", orderId);
      
      if (error) throw error;
      
      setOrderItems(data);
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
      
      // Update order status
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId);
      
      if (error) throw error;
      
      // Create status history entry
      await supabase
        .from("order_status_history")
        .insert({
          order_id: orderId,
          status: newStatus,
          notes: `Status updated to ${newStatus} by admin`
        });
      
      // Update local state
      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      toast.success("Status Updated", {
        description: `Order status changed to ${newStatus}`
      });
      
      // Get the order and doctor information for notification
      const order = orders.find(o => o.id === orderId);
      
      if (order && order.doctor_phone) {
        // Send notification to doctor
        try {
          await supabase.functions.invoke("notify-doctor-status-update", {
            body: {
              orderId: orderId,
              doctorName: order.doctor_name || "Doctor",
              doctorPhone: order.doctor_phone,
              doctorEmail: "",
              newStatus: newStatus
            }
          });
          
          toast.success("Notification Sent", {
            description: "Doctor has been notified of the status change"
          });
        } catch (notifyError) {
          console.error("Error sending notification:", notifyError);
        }
      }
      
      // If status changes to delivered and no invoice exists, generate one
      if (newStatus === "delivered" && !order?.invoice_generated) {
        handleGenerateInvoice(orderId);
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
      
      // Call the generate-invoice function
      const { data, error } = await supabase.functions.invoke("generate-invoice", {
        body: { orderId }
      });
      
      if (error) throw error;
      
      if (data.success) {
        // Update the order in local state
        setOrders(
          orders.map((order) =>
            order.id === orderId ? { 
              ...order, 
              invoice_generated: true,
              invoice_number: data.invoiceNumber,
              invoice_url: data.pdfUrl
            } : order
          )
        );
        
        toast.success("Invoice Generated", {
          description: "The invoice has been generated and sent to the doctor"
        });
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
  
  // Send custom message
  const sendCustomMessage = async () => {
    if (!selectedOrder || !messageInput.trim()) return;
    
    try {
      setIsSendingNotification(true);
      
      // Create notification record in database
      const { error } = await supabase
        .from("order_communications")
        .insert({
          order_id: selectedOrder.id,
          sender_id: "admin", // Special admin ID
          recipient_id: selectedOrder.doctor_id,
          message: messageInput
        });
        
      if (error) throw error;
      
      // Send notification to doctor
      if (selectedOrder.doctor_phone) {
        try {
          await supabase.functions.invoke("notify-doctor-status-update", {
            body: {
              orderId: selectedOrder.id,
              doctorName: selectedOrder.doctor_name || "Doctor",
              doctorPhone: selectedOrder.doctor_phone,
              doctorEmail: "",
              newStatus: "custom_message",
              customMessage: messageInput
            }
          });
        } catch (notifyError) {
          console.error("Error sending notification:", notifyError);
        }
      }
      
      toast.success("Message Sent", {
        description: "Your message has been sent to the doctor"
      });
      
      setMessageInput("");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message", {
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

  // Filter orders based on active tab, search, and date
  const filteredOrders = orders.filter(order => {
    // Filter by tab (status)
    if (activeTab !== 'all' && order.status !== activeTab) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const orderIdMatch = order.id.toLowerCase().includes(searchLower);
      const nameMatch = order.doctor_name?.toLowerCase().includes(searchLower) || false;
      const phoneMatch = order.doctor_phone?.includes(searchTerm) || false;
      const invoiceMatch = order.invoice_number?.toLowerCase().includes(searchLower) || false;
      
      if (!orderIdMatch && !nameMatch && !phoneMatch && !invoiceMatch) {
        return false;
      }
    }
    
    // Filter by date
    if (dateFilter !== 'all') {
      const orderDate = new Date(order.created_at);
      const today = new Date();
      
      if (dateFilter === 'today') {
        return orderDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        return orderDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(today.getMonth() - 1);
        return orderDate >= monthAgo;
      }
    }
    
    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });
  
  // Count orders by status
  const getOrderCounts = () => {
    const counts = {
      all: orders.length,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0, 
      cancelled: 0
    };
    
    orders.forEach(order => {
      if (order.status in counts) {
        counts[order.status as keyof typeof counts]++;
      }
    });
    
    return counts;
  };
  
  const orderCounts = getOrderCounts();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Order Management</h1>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
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
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <SelectValue placeholder="Filter by date" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-2"
          >
            <Filter className={`h-4 w-4 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
            {sortOrder === 'asc' ? 'Oldest' : 'Newest'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={loadOrders}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="all">
            All
            <span className="ml-1 text-xs">({orderCounts.all})</span>
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            <span className="ml-1 text-xs">({orderCounts.pending})</span>
          </TabsTrigger>
          <TabsTrigger value="processing">
            Processing
            <span className="ml-1 text-xs">({orderCounts.processing})</span>
          </TabsTrigger>
          <TabsTrigger value="shipped">
            Shipped
            <span className="ml-1 text-xs">({orderCounts.shipped})</span>
          </TabsTrigger>
          <TabsTrigger value="delivered">
            Delivered
            <span className="ml-1 text-xs">({orderCounts.delivered})</span>
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled
            <span className="ml-1 text-xs">({orderCounts.cancelled})</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
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
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>A list of all orders</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Doctor</TableHead>
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
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.doctor_name}</div>
                          <div className="text-sm text-gray-500">{order.doctor_phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>₹{order.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
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
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => viewOrderDetails(order)}
                            className="h-8 px-2"
                          >
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                          
                          {!order.invoice_generated && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateInvoice(order.id)}
                              disabled={isGeneratingInvoice}
                              className="h-8 px-2"
                            >
                              {isGeneratingInvoice ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <FileText className="h-4 w-4 mr-1" />
                              )}
                              Invoice
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrder && (
                <div className="text-sm text-gray-500">
                  <div className="flex flex-wrap justify-between">
                    <div>
                      <span className="font-medium">Order ID:</span> {selectedOrder.id}
                      <br />
                      <span className="font-medium">Date:</span> {new Date(selectedOrder.created_at).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Doctor:</span> {selectedOrder.doctor_name}
                      <br />
                      <span className="font-medium">Phone:</span> {selectedOrder.doctor_phone}
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="font-medium">Status:</span>{' '}
                    <OrderStatusBadge status={selectedOrder.status} />
                  </div>
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
              
              {/* Invoice Link */}
              {selectedOrder?.invoice_url && (
                <div className="mt-4">
                  <a 
                    href={selectedOrder.invoice_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-upkar-blue hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    View Invoice {selectedOrder.invoice_number}
                  </a>
                </div>
              )}
              
              {/* Send Message Form */}
              <div className="mt-6 border-t pt-4">
                <h3 className="font-medium mb-2">Send Message to Doctor</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendCustomMessage}
                    disabled={!messageInput.trim() || isSendingNotification}
                    className="flex items-center gap-2"
                  >
                    {isSendingNotification ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-4">
              <p className="text-gray-500">No items found for this order.</p>
            </div>
          )}
          
          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Select
                value={selectedOrder?.status || ""}
                onValueChange={(value) => selectedOrder && handleStatusChange(selectedOrder.id, value)}
                disabled={isUpdatingStatus}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              {selectedOrder && !selectedOrder.invoice_generated && (
                <Button
                  variant="outline"
                  onClick={() => selectedOrder && handleGenerateInvoice(selectedOrder.id)}
                  disabled={isGeneratingInvoice}
                  className="flex items-center gap-2"
                >
                  {isGeneratingInvoice ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  Generate Invoice
                </Button>
              )}
            </div>
            
            <Button
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

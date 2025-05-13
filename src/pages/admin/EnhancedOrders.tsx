import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  fetchAllOrders, 
  fetchOrderDetails, 
  updateOrderStatus, 
  generateInvoice,
  updateShippingInfo,
  addOrderCommunication,
  updateReturnStatus,
  Order,
  OrderDetails
} from "@/services/orderService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatCurrency } from "@/lib/utils";
import { 
  Search, 
  Eye, 
  FileText, 
  Truck, 
  Loader2,
  ShoppingBag,
  Package,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Filter,
  Calendar,
  Download
} from "lucide-react";
import OrderDetailsView from "@/components/orders/OrderDetailsView";
import UpdateShippingDialog from "@/components/admin/orders/UpdateShippingDialog";
import { toast } from "sonner";

const AdminOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isShippingDialogOpen, setIsShippingDialogOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Fetch all orders
  useEffect(() => {
    fetchOrders();
  }, []);
  
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchAllOrders();
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
  
  // View order details
  const viewOrderDetails = async (orderId: string) => {
    setSelectedOrder(orderId);
    setIsDetailsLoading(true);
    setIsDetailsOpen(true);
    
    try {
      const details = await fetchOrderDetails(orderId);
      setOrderDetails(details);
    } catch (error: any) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to load order details", {
        description: error.message || "Please try again."
      });
    } finally {
      setIsDetailsLoading(false);
    }
  };
  
  // Handle update order status
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const success = await updateOrderStatus(
        orderId, 
        newStatus, 
        `Status updated to ${newStatus} by admin`, 
        user?.id
      );
      
      if (success) {
        toast.success("Status Updated", {
          description: `Order status has been updated to ${newStatus}.`
        });
        
        // Update local state
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
        
        // If details are open, refresh them
        if (isDetailsOpen && selectedOrder === orderId) {
          const details = await fetchOrderDetails(orderId);
          setOrderDetails(details);
        }
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status", {
        description: error.message || "Please try again."
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  
  // Handle generate invoice
  const handleGenerateInvoice = async (orderId: string) => {
    setIsGeneratingInvoice(true);
    try {
      const success = await generateInvoice(orderId);
      
      if (success) {
        toast.success("Invoice Generated", {
          description: "The invoice has been generated and sent to the doctor."
        });
        
        // Refresh order details
        if (isDetailsOpen && selectedOrder === orderId) {
          const details = await fetchOrderDetails(orderId);
          setOrderDetails(details);
        }
        
        // Update orders list
        fetchOrders();
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
  
  // Handle update shipping info
  const handleUpdateShipping = async (data: {
    trackingNumber: string;
    shippingCarrier: string;
    estimatedDeliveryDate?: string;
  }) => {
    if (!selectedOrder) return;
    
    try {
      const success = await updateShippingInfo(
        selectedOrder,
        data.trackingNumber,
        data.shippingCarrier,
        data.estimatedDeliveryDate
      );
      
      if (success) {
        toast.success("Shipping Info Updated", {
          description: "The shipping information has been updated successfully."
        });
        
        // Close the dialog
        setIsShippingDialogOpen(false);
        
        // Refresh order details
        if (isDetailsOpen && selectedOrder) {
          const details = await fetchOrderDetails(selectedOrder);
          setOrderDetails(details);
        }
        
        // Update orders list
        fetchOrders();
      } else {
        throw new Error("Failed to update shipping info");
      }
    } catch (error: any) {
      console.error("Error updating shipping info:", error);
      toast.error("Failed to update shipping info", {
        description: error.message || "Please try again."
      });
    }
  };
  
  // Handle send message
  const handleSendMessage = async (orderId: string, message: string) => {
    if (!user?.id) return;
    
    try {
      // Get the doctor ID from the order
      const order = orders.find(o => o.id === orderId);
      if (!order) throw new Error("Order not found");
      
      const messageId = await addOrderCommunication(
        orderId,
        'admin', // Admin ID
        order.doctor_id,
        message
      );
      
      if (messageId) {
        // Refresh order details to show the new message
        const details = await fetchOrderDetails(orderId);
        setOrderDetails(details);
        
        toast.success("Message Sent", {
          description: "Your message has been sent to the doctor."
        });
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message", {
        description: error.message || "Please try again."
      });
    }
  };
  
  // Handle update return status
  const handleUpdateReturnStatus = async (returnId: string, status: string) => {
    if (!user?.id) return;
    
    try {
      const success = await updateReturnStatus(
        returnId,
        status,
        user.id,
        `Return ${status} by admin`
      );
      
      if (success) {
        toast.success("Return Status Updated", {
          description: `Return status has been updated to ${status}.`
        });
        
        // Refresh order details
        if (isDetailsOpen && selectedOrder) {
          const details = await fetchOrderDetails(selectedOrder);
          setOrderDetails(details);
        }
      } else {
        throw new Error("Failed to update return status");
      }
    } catch (error: any) {
      console.error("Error updating return status:", error);
      toast.error("Failed to update return status", {
        description: error.message || "Please try again."
      });
    }
  };
  
  // Filter orders based on tab, search term, and date filter
  const filteredOrders = orders.filter(order => {
    // Filter by tab
    if (activeTab !== 'all' && order.status !== activeTab) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        order.id.toLowerCase().includes(searchLower) ||
        (order.invoice_number && order.invoice_number.toLowerCase().includes(searchLower)) ||
        (order.doctor?.name && order.doctor.name.toLowerCase().includes(searchLower)) ||
        (order.doctor?.phone && order.doctor.phone.includes(searchTerm))
      );
    }
    
    // Filter by date
    if (dateFilter !== 'all') {
      const orderDate = new Date(order.created_at);
      const today = new Date();
      
      if (dateFilter === 'today') {
        return (
          orderDate.getDate() === today.getDate() &&
          orderDate.getMonth() === today.getMonth() &&
          orderDate.getFullYear() === today.getFullYear()
        );
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
    // Sort by date
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });
  
  // Get counts for each status
  const getStatusCounts = () => {
    const counts = {
      all: orders.length,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };
    
    orders.forEach(order => {
      if (counts[order.status as keyof typeof counts] !== undefined) {
        counts[order.status as keyof typeof counts]++;
      }
    });
    
    return counts;
  };
  
  const statusCounts = getStatusCounts();
  
  // Function to get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return "bg-blue-100 text-blue-800";
      case 'processing':
        return "bg-yellow-100 text-yellow-800";
      case 'shipped':
        return "bg-purple-100 text-purple-800";
      case 'delivered':
        return "bg-green-100 text-green-800";
      case 'cancelled':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <Button onClick={fetchOrders} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            placeholder="Search by doctor name, phone, order ID..."
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
            size="icon"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="w-10 h-10"
          >
            {sortOrder === 'asc' ? (
              <Filter className="h-4 w-4 rotate-180" />
            ) : (
              <Filter className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="all" className="relative">
            All
            {statusCounts.all > 0 && (
              <span className="ml-1 text-xs">({statusCounts.all})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            <ShoppingBag className="h-4 w-4 mr-1" />
            Pending
            {statusCounts.pending > 0 && (
              <span className="ml-1 text-xs">({statusCounts.pending})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="processing" className="relative">
            <Package className="h-4 w-4 mr-1" />
            Processing
            {statusCounts.processing > 0 && (
              <span className="ml-1 text-xs">({statusCounts.processing})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="shipped" className="relative">
            <Truck className="h-4 w-4 mr-1" />
            Shipped
            {statusCounts.shipped > 0 && (
              <span className="ml-1 text-xs">({statusCounts.shipped})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="delivered" className="relative">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Delivered
            {statusCounts.delivered > 0 && (
              <span className="ml-1 text-xs">({statusCounts.delivered})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="relative">
            <XCircle className="h-4 w-4 mr-1" />
            Cancelled
            {statusCounts.cancelled > 0 && (
              <span className="ml-1 text-xs">({statusCounts.cancelled})</span>
            )}
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.invoice_number || order.id.substring(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.doctor?.name || "Unknown"}</div>
                          <div className="text-sm text-gray-500">{order.doctor?.phone || "N/A"}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1"
                            onClick={() => viewOrderDetails(order.id)}
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                          
                          <Select
                            value={order.status}
                            onValueChange={(value) => handleUpdateStatus(order.id, value)}
                            disabled={isUpdatingStatus}
                          >
                            <SelectTrigger className="h-8 w-[110px]">
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
                          
                          {!order.invoice_generated && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleGenerateInvoice(order.id)}
                              disabled={isGeneratingInvoice}
                            >
                              <FileText className="h-3 w-3" />
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
              <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchTerm
                  ? "No orders found matching your search."
                  : activeTab !== 'all'
                  ? `No ${activeTab} orders found.`
                  : "No orders found."}
              </p>
              {(searchTerm || dateFilter !== 'all' || activeTab !== 'all') && (
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchTerm("");
                    setDateFilter("all");
                    setActiveTab("all");
                  }}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              View and manage order details
            </DialogDescription>
          </DialogHeader>
          
          {isDetailsLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
            </div>
          ) : orderDetails ? (
            <OrderDetailsView
              orderDetails={orderDetails}
              isAdmin={true}
              onUpdateStatus={handleUpdateStatus}
              onSendMessage={handleSendMessage}
              onDownloadInvoice={(orderId) => {
                // Find the order
                const order = orders.find(o => o.id === orderId);
                
                if (order?.invoice_url) {
                  window.open(order.invoice_url, '_blank');
                } else {
                  toast.error("Invoice Not Available", {
                    description: "The invoice for this order is not available yet."
                  });
                }
              }}
            />
          ) : (
            <div className="text-center p-4">
              <p className="text-gray-500">Failed to load order details.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Update Shipping Dialog */}
      {selectedOrder && (
        <UpdateShippingDialog
          open={isShippingDialogOpen}
          onOpenChange={setIsShippingDialogOpen}
          onSubmit={handleUpdateShipping}
          initialData={
            orders.find(o => o.id === selectedOrder) || {
              tracking_number: "",
              shipping_carrier: "",
              estimated_delivery_date: ""
            }
          }
        />
      )}
    </div>
  );
};

export default AdminOrders;
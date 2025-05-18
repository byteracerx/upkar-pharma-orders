import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getOrderDetails, 
  processReturn,
  addOrderCommunication, 
  Order,
  OrderDetails,
  OrderItem
} from "@/services/orderService";
import { fetchDoctorOrdersReliable, subscribeToDoctorOrdersReliable } from "@/services/doctorOrderService";
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
import { formatDate, formatCurrency } from "@/lib/utils";
import { 
  Search, 
  Eye, 
  RotateCcw, 
  Download, 
  Loader2,
  ShoppingBag,
  Package,
  Truck,
  CheckCircle2,
  XCircle
} from "lucide-react";
import OrderDetailsView from "@/components/orders/OrderDetailsView";
import InitiateReturnDialog from "@/components/orders/InitiateReturnDialog";
import { toast } from "@/hooks/use-toast";

const DoctorOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  
  // Fetch doctor's orders
  useEffect(() => {
    if (user?.id) {
      fetchOrders();
      
      // Set up real-time subscription for the doctor's orders
      const unsubscribe = subscribeToDoctorOrdersReliable(
        user.id,
        fetchOrders // Refresh orders when changes are detected
      );
      
      return () => {
        unsubscribe(); // Clean up subscription when component unmounts
      };
    }
  }, [user]);
  
  const fetchOrders = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      console.log("Fetching orders for doctor:", user.id);
      const data = await fetchDoctorOrdersReliable(user.id);
      console.log(`Received ${data.length} orders`);
      setOrders(data);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
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
      const details = await getOrderDetails(orderId);
      setOrderDetails(details);
      setOrderItems(details.items);
    } catch (error: any) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to load order details");
    } finally {
      setIsDetailsLoading(false);
    }
  };
  
  // Handle reorder
  const handleReorder = async (orderId: string) => {
    if (!user?.id) return;
    
    setIsReordering(true);
    try {
      // This functionality needs to be implemented
      // For now we'll show a toast that this feature is coming soon
      toast.info("Reorder functionality coming soon");
      
      // Refresh orders
      fetchOrders();
      setIsReordering(false);
    } catch (error: any) {
      console.error("Error reordering:", error);
      toast.error("Failed to reorder");
      setIsReordering(false);
    }
  };
  
  // Handle send message
  const handleSendMessage = async (orderId: string, message: string) => {
    if (!user?.id) return;
    
    try {
      const success = await addOrderCommunication(
        orderId, 
        message, 
        user.id,
        "doctor"
      );
      
      if (success) {
        // Refresh order details to show the new message
        const details = await getOrderDetails(orderId);
        setOrderDetails(details);
        
        toast.success("Message Sent");
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };
  
  // Handle initiate return
  const handleInitiateReturn = (orderId: string) => {
    setSelectedOrder(orderId);
    setIsReturnDialogOpen(true);
  };
  
  // Handle return completion
  const handleReturnComplete = async () => {
    if (selectedOrder) {
      // Refresh order details
      const details = await getOrderDetails(selectedOrder);
      setOrderDetails(details);
    }
  };
  
  // Handle download invoice
  const handleDownloadInvoice = (orderId: string) => {
    // Find the order
    const order = orders.find(o => o.id === orderId);
    
    if (order?.invoice_number) {
      // We don't have direct access to invoice_url in the type,
      // Let's download based on invoice_number instead
      window.open(`/invoices/${order.invoice_number}.pdf`, '_blank');
    } else {
      toast.error("Invoice Not Available");
    }
  };
  
  // Filter orders based on tab and search term
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
        (order.invoice_number && order.invoice_number.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
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
      const status = order.status as keyof typeof counts;
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });
    
    return counts;
  };
  
  const statusCounts = getStatusCounts();
  
  // Function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ShoppingBag className="h-4 w-4 text-blue-500" />;
      case 'processing':
        return <Package className="h-4 w-4 text-yellow-500" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-purple-500" />;
      case 'delivered':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <ShoppingBag className="h-4 w-4" />;
    }
  };
  
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
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            placeholder="Search by order ID or invoice number..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
          <CardTitle>Order History</CardTitle>
          <CardDescription>
            View and manage your orders
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
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.invoice_number || order.id.substring(0, 8)}
                      </TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          <Badge className={getStatusBadgeColor(order.status)}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.tracking_number ? (
                          <span className="text-sm">{order.tracking_number}</span>
                        ) : (
                          <span className="text-sm text-gray-500">Not available</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => viewOrderDetails(order.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {order.status === 'delivered' && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleReorder(order.id)}
                              disabled={isReordering}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {order.invoice_generated && order.invoice_url && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDownloadInvoice(order.id)}
                            >
                              <Download className="h-4 w-4" />
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
                  ? `You don't have any ${activeTab} orders.`
                  : "You haven't placed any orders yet."}
              </p>
              {searchTerm && (
                <Button
                  variant="link"
                  onClick={() => setSearchTerm("")}
                  className="mt-2"
                >
                  Clear search
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
              View detailed information about your order
            </DialogDescription>
          </DialogHeader>
          
          {isDetailsLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
            </div>
          ) : orderDetails ? (
            <OrderDetailsView
              orderDetails={orderDetails}
              onSendMessage={handleSendMessage}
              onInitiateReturn={handleInitiateReturn}
              onReorder={handleReorder}
              onDownloadInvoice={handleDownloadInvoice}
            />
          ) : (
            <div className="text-center p-4">
              <p className="text-gray-500">Failed to load order details.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Initiate Return Dialog */}
      {selectedOrder && orderDetails && (
        <InitiateReturnDialog
          open={isReturnDialogOpen}
          onOpenChange={setIsReturnDialogOpen}
          orderId={selectedOrder}
          doctorId={orderDetails.order.doctor_id}
          orderItems={orderItems}
          onReturnComplete={handleReturnComplete}
        />
      )}
    </div>
  );
};

export default DoctorOrders;

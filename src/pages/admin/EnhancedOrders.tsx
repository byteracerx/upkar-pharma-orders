import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Order,
  ShippingInfo
} from "@/services/orderService";
import {
  fetchAllOrders,
  updateOrderStatus,
  updateShippingInfo,
  generateInvoice,
  synchronizeOrders
} from "@/services/adminService";
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
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatCurrency } from "@/lib/utils";
import { 
  Search, 
  MoreVertical, 
  FileText, 
  Eye, 
  TruckIcon,
  RefreshCw,
  ShoppingBag,
  Package,
  Truck,
  CheckCircle2,
  XCircle
} from "lucide-react";
import UpdateShippingDialog from "@/components/admin/orders/UpdateShippingDialog";
import { toast } from "sonner";

const EnhancedOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isShippingDialogOpen, setIsShippingDialogOpen] = useState(false);
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Fetch orders data
  useEffect(() => {
    fetchOrders();
  }, []);
  
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchAllOrders();
      console.log(`Fetched ${data.length} orders`);
      setOrders(data);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle order status change
  const handleStatusChange = async (orderId: string, status: string) => {
    setIsActionInProgress(true);
    try {
      const success = await updateOrderStatus(orderId, status);
      if (success) {
        toast.success("Order Status Updated", {
          description: `Order #${orderId.substring(0, 8)} has been marked as ${status}`
        });
        
        // Update local state
        setOrders(orders.map(order => {
          if (order.id === orderId) {
            return { ...order, status };
          }
          return order;
        }));
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error: any) {
      console.error("Error changing status:", error);
      toast.error("Status Update Failed", {
        description: error.message || "Please try again"
      });
    } finally {
      setIsActionInProgress(false);
    }
  };
  
  // Handle invoice generation
  const handleGenerateInvoice = async (orderId: string) => {
    setIsActionInProgress(true);
    try {
      const invoiceUrl = await generateInvoice(orderId);
      
      if (invoiceUrl) {
        toast.success("Invoice Generated", {
          description: "Invoice has been generated successfully"
        });
        
        // Update local state
        setOrders(orders.map(order => {
          if (order.id === orderId) {
            return { 
              ...order, 
              invoice_generated: true,
              invoice_url: invoiceUrl 
            };
          }
          return order;
        }));
        
        // Open the invoice in a new tab
        window.open(invoiceUrl, '_blank');
      } else {
        throw new Error("No invoice URL returned");
      }
    } catch (error: any) {
      console.error("Error generating invoice:", error);
      toast.error("Invoice Generation Failed", {
        description: error.message || "Please try again"
      });
    } finally {
      setIsActionInProgress(false);
    }
  };
  
  // Handle opening shipping dialog
  const handleUpdateShipping = (order: Order) => {
    setSelectedOrder(order);
    setIsShippingDialogOpen(true);
  };
  
  // Handle shipping info update
  const handleShippingInfoUpdate = async (
    orderId: string, 
    shippingInfo: ShippingInfo
  ) => {
    setIsActionInProgress(true);
    try {
      const success = await updateShippingInfo(
        orderId,
        shippingInfo.tracking_number || "",
        shippingInfo.shipping_carrier || "",
        shippingInfo.estimated_delivery_date
      );
      
      if (success) {
        toast.success("Shipping Information Updated", {
          description: "The order has been marked as shipped"
        });
        
        // Update local state
        setOrders(orders.map(order => {
          if (order.id === orderId) {
            return { 
              ...order, 
              status: 'shipped',
              tracking_number: shippingInfo.tracking_number,
              shipping_carrier: shippingInfo.shipping_carrier,
              estimated_delivery_date: shippingInfo.estimated_delivery_date
            };
          }
          return order;
        }));
        
        // Close dialog
        setIsShippingDialogOpen(false);
      } else {
        throw new Error("Failed to update shipping info");
      }
    } catch (error: any) {
      console.error("Error updating shipping:", error);
      toast.error("Update Failed", {
        description: error.message || "Please try again"
      });
    } finally {
      setIsActionInProgress(false);
    }
  };
  
  // Handle sync orders action
  const handleSyncOrders = async () => {
    setIsSyncing(true);
    try {
      await synchronizeOrders();
      // Refresh orders after sync
      fetchOrders();
    } catch (error) {
      console.error("Error syncing orders:", error);
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Filter orders based on tab, status filter and search term
  const filteredOrders = orders.filter(order => {
    // Filter by tab
    if (activeTab !== 'all' && order.status !== activeTab) {
      return false;
    }
    
    // Filter by status dropdown if selected
    if (statusFilter && order.status !== statusFilter) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        order.id.toLowerCase().includes(searchLower) ||
        (order.invoice_number && order.invoice_number.toLowerCase().includes(searchLower)) ||
        (order.doctor?.name && order.doctor.name.toLowerCase().includes(searchLower)) ||
        (order.doctor?.phone && order.doctor.phone.toLowerCase().includes(searchLower))
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
      if (counts.hasOwnProperty(order.status)) {
        counts[order.status as keyof typeof counts]++;
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
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <Button 
          variant="outline"
          className="flex items-center"
          onClick={handleSyncOrders}
          disabled={isSyncing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Orders'}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="col-span-full md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={statusFilter || ""}
              onValueChange={(value) => setStatusFilter(value || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Status</SelectLabel>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        
        <Card className="col-span-full md:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                placeholder="Search by order ID, invoice number, or doctor name..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
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
            View and manage customer orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                          <p className="font-medium">{order.doctor?.name || "Unknown"}</p>
                          <p className="text-xs text-gray-500">{order.doctor?.phone || "No phone"}</p>
                        </div>
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
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem 
                              onClick={() => window.location.href = `/admin/orders/${order.id}`}
                              className="cursor-pointer"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(order.id, 'pending')}
                              disabled={order.status === 'pending' || isActionInProgress}
                              className="cursor-pointer"
                            >
                              <ShoppingBag className="h-4 w-4 mr-2 text-blue-500" />
                              Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(order.id, 'processing')}
                              disabled={order.status === 'processing' || isActionInProgress}
                              className="cursor-pointer"
                            >
                              <Package className="h-4 w-4 mr-2 text-yellow-500" />
                              Processing
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateShipping(order)}
                              disabled={isActionInProgress}
                              className="cursor-pointer"
                            >
                              <Truck className="h-4 w-4 mr-2 text-purple-500" />
                              Mark as Shipped
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(order.id, 'delivered')}
                              disabled={order.status === 'delivered' || isActionInProgress}
                              className="cursor-pointer"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                              Delivered
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(order.id, 'cancelled')}
                              disabled={order.status === 'cancelled' || isActionInProgress}
                              className="cursor-pointer"
                            >
                              <XCircle className="h-4 w-4 mr-2 text-red-500" />
                              Cancel
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem
                              onClick={() => handleGenerateInvoice(order.id)}
                              disabled={order.invoice_generated || isActionInProgress}
                              className="cursor-pointer"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              {order.invoice_generated ? 'Invoice Generated' : 'Generate Invoice'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                {searchTerm || statusFilter
                  ? "No orders found matching your filters."
                  : activeTab !== 'all'
                  ? `No orders with status "${activeTab}".`
                  : "No orders found."}
              </p>
              {(searchTerm || statusFilter) && (
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter(null);
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
      
      {/* Update Shipping Dialog */}
      {selectedOrder && (
        <UpdateShippingDialog
          open={isShippingDialogOpen}
          onOpenChange={setIsShippingDialogOpen}
          order={selectedOrder}
          onSubmit={(shippingInfo) => 
            handleShippingInfoUpdate(selectedOrder.id, shippingInfo)
          }
        />
      )}
    </div>
  );
};

export default EnhancedOrders;

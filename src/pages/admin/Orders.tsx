
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
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Eye, FileText, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

type Order = {
  id: string;
  created_at: string;
  doctor_id: string;
  status: string;
  total_amount: number;
  doctor: {
    name: string;
    phone: string;
  } | null;
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

  // Fetch orders from Supabase
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(`
            *,
            doctor:doctor_id (name, phone)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          setOrders(data as Order[]);
        }
      } catch (error: any) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to load orders", {
          description: error.message || "Please try again."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Fetch order details
  const fetchOrderDetails = async (orderId: string) => {
    try {
      setIsLoadingDetails(true);
      
      const { data, error } = await supabase
        .from("order_items")
        .select(`
          *,
          product:product_id (name, category)
        `)
        .eq("order_id", orderId);

      if (error) {
        throw error;
      }

      setOrderItems(data as OrderItem[]);
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
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) {
        throw error;
      }

      // Update local state
      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      toast.success("Status Updated", {
        description: `Order ${orderId.substring(0, 8)}... status changed to ${newStatus}`
      });
      
      // Get the order details for notifications
      const order = orders.find(o => o.id === orderId);
      
      if (order && order.doctor) {
        // Send notification to doctor about status change
        try {
          await supabase.functions.invoke('notify-doctor-status-update', {
            body: {
              orderId,
              doctorName: order.doctor.name,
              doctorPhone: order.doctor.phone,
              doctorEmail: order.doctor.email || '',
              newStatus
            }
          });
          
          toast.success("Notification Sent", {
            description: `WhatsApp notification sent to ${order.doctor.name}`
          });
        } catch (notifyError) {
          console.error("Error sending notification:", notifyError);
          toast.error("Notification Failed", {
            description: "Could not send WhatsApp notification to doctor."
          });
        }
      }
      
      // If status changed to accepted, generate invoice
      if (newStatus === "accepted") {
        try {
          await supabase.functions.invoke('generate-invoice', {
            body: { orderId }
          });
          
          toast.success("Invoice Generated", {
            description: "The invoice has been generated and sent to the doctor."
          });
        } catch (invoiceError) {
          console.error("Error generating invoice:", invoiceError);
          toast.error("Invoice Generation Failed", {
            description: "Could not generate invoice for this order."
          });
        }
      }
    } catch (error: any) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status", {
        description: error.message || "Please try again."
      });
    }
  };
  
  // Generate invoice
  const generateInvoice = async (orderId: string) => {
    try {
      setIsGeneratingInvoice(true);
      
      // Call the serverless function to generate the invoice
      await supabase.functions.invoke('generate-invoice', {
        body: { orderId }
      });
      
      toast.success("Invoice Generated", {
        description: "The invoice has been generated and sent to the doctor."
      });
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
      
      if (!order || !order.doctor) {
        throw new Error("Order or doctor information not found");
      }
      
      // Send notification to doctor
      await supabase.functions.invoke('notify-doctor-status-update', {
        body: {
          orderId,
          doctorName: order.doctor.name,
          doctorPhone: order.doctor.phone,
          doctorEmail: order.doctor.email || '',
          newStatus: order.status
        }
      });
      
      toast.success("Notification Sent", {
        description: `WhatsApp notification sent to ${order.doctor.name}`
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
      (order.doctor?.name && order.doctor.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.doctor?.phone.includes(searchTerm)
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Order Management</h1>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            placeholder="Search by doctor name, phone or order ID..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
                      {order.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>{order.doctor?.name || "Unknown"}</TableCell>
                    <TableCell>{order.doctor?.phone || "N/A"}</TableCell>
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
                  <span className="font-medium">Doctor:</span> {selectedOrder.doctor?.name || "Unknown"}
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
                onClick={() => selectedOrder && generateInvoice(selectedOrder.id)}
                disabled={isGeneratingInvoice}
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

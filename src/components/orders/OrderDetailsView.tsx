import { useState } from "react";
import { OrderDetails, OrderStatusHistory, OrderCommunication } from "@/services/orderService";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatCurrency } from "@/lib/utils";
import { 
  Package, 
  Truck, 
  Calendar, 
  FileText, 
  MessageSquare, 
  RotateCcw, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Download
} from "lucide-react";
import OrderItemsList from "./OrderItemsList";
import OrderStatusTimeline from "./OrderStatusTimeline";
import OrderCommunicationPanel from "./OrderCommunicationPanel";
import OrderReturnsList from "./OrderReturnsList";
import OrderTrackingInfo from "./OrderTrackingInfo";

interface OrderDetailsViewProps {
  orderDetails: OrderDetails;
  isAdmin?: boolean;
  onUpdateStatus?: (orderId: string, newStatus: string) => void;
  onSendMessage?: (orderId: string, message: string) => void;
  onInitiateReturn?: (orderId: string) => void;
  onReorder?: (orderId: string) => void;
  onDownloadInvoice?: (orderId: string) => void;
}

const OrderDetailsView = ({
  orderDetails,
  isAdmin = false,
  onUpdateStatus,
  onSendMessage,
  onInitiateReturn,
  onReorder,
  onDownloadInvoice
}: OrderDetailsViewProps) => {
  const [activeTab, setActiveTab] = useState("details");
  const { order, items, statusHistory, communications, returns } = orderDetails;
  
  // Get the latest status update
  const latestStatusUpdate = statusHistory && statusHistory.length > 0 
    ? statusHistory[0] 
    : null;
  
  // Check if there are unread messages for the current user
  const hasUnreadMessages = communications && communications.some(
    comm => !comm.read && (isAdmin ? comm.sender_id !== 'admin' : comm.sender_id === 'admin')
  );
  
  // Format the order status for display
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
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
      case 'return_initiated':
      case 'returned':
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Order Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">
                Order #{order.invoice_number || order.id.substring(0, 8)}
              </CardTitle>
              <CardDescription>
                Placed on {formatDate(order.created_at)}
              </CardDescription>
            </div>
            <Badge className={getStatusBadgeColor(order.status)}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Total Amount</p>
              <p className="text-lg font-bold">{formatCurrency(order.total_amount)}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Payment Status</p>
              <Badge variant={order.payment_status === 'paid' ? 'default' : 'outline'}>
                {order.payment_status?.charAt(0).toUpperCase() + order.payment_status?.slice(1) || 'Pending'}
              </Badge>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p className="text-sm">{formatDate(order.updated_at)}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 pt-0">
          {onDownloadInvoice && order.invoice_generated && (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={() => onDownloadInvoice(order.id)}
            >
              <Download className="h-4 w-4" />
              Download Invoice
            </Button>
          )}
          
          {onReorder && (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={() => onReorder(order.id)}
            >
              <RotateCcw className="h-4 w-4" />
              Reorder
            </Button>
          )}
          
          {onInitiateReturn && order.status === 'delivered' && !returns?.some(r => r.status === 'pending') && (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={() => onInitiateReturn(order.id)}
            >
              <RotateCcw className="h-4 w-4" />
              Return Items
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Order Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 md:grid-cols-5">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="messages" className="relative">
            Messages
            {hasUnreadMessages && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                !
              </span>
            )}
          </TabsTrigger>
          {returns && returns.length > 0 && (
            <TabsTrigger value="returns">Returns</TabsTrigger>
          )}
        </TabsList>
        
        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderItemsList items={items} />
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Shipping Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Shipping Information</CardTitle>
              </CardHeader>
              <CardContent>
                {order.shipping_address ? (
                  <div className="space-y-2">
                    <p className="whitespace-pre-line">{order.shipping_address}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No shipping address provided</p>
                )}
              </CardContent>
            </Card>
            
            {/* Billing Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Billing Information</CardTitle>
              </CardHeader>
              <CardContent>
                {order.billing_address ? (
                  <div className="space-y-2">
                    <p className="whitespace-pre-line">{order.billing_address}</p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Payment Method:</span> {order.payment_method || 'Not specified'}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No billing address provided</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Order Notes */}
          {order.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{order.notes}</p>
              </CardContent>
            </Card>
          )}
          
          {/* Admin Actions */}
          {isAdmin && onUpdateStatus && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Update Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={order.status === 'pending' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => onUpdateStatus(order.id, 'pending')}
                    disabled={order.status === 'pending'}
                  >
                    Pending
                  </Button>
                  <Button 
                    variant={order.status === 'processing' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => onUpdateStatus(order.id, 'processing')}
                    disabled={order.status === 'processing'}
                  >
                    Processing
                  </Button>
                  <Button 
                    variant={order.status === 'shipped' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => onUpdateStatus(order.id, 'shipped')}
                    disabled={order.status === 'shipped'}
                  >
                    Shipped
                  </Button>
                  <Button 
                    variant={order.status === 'delivered' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => onUpdateStatus(order.id, 'delivered')}
                    disabled={order.status === 'delivered'}
                  >
                    Delivered
                  </Button>
                  <Button 
                    variant={order.status === 'cancelled' ? 'default' : 'outline'} 
                    size="sm"
                    className="bg-red-100 text-red-800 hover:bg-red-200"
                    onClick={() => onUpdateStatus(order.id, 'cancelled')}
                    disabled={order.status === 'cancelled'}
                  >
                    Cancelled
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Tracking Tab */}
        <TabsContent value="tracking">
          <OrderTrackingInfo 
            order={order} 
            isAdmin={isAdmin}
            onUpdateTracking={isAdmin ? (data) => console.log('Update tracking', data) : undefined}
          />
        </TabsContent>
        
        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {statusHistory && statusHistory.length > 0 ? (
                <OrderStatusTimeline statusHistory={statusHistory} />
              ) : (
                <p className="text-gray-500 italic">No status history available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Messages Tab */}
        <TabsContent value="messages">
          <OrderCommunicationPanel 
            orderId={order.id}
            communications={communications || []}
            isAdmin={isAdmin}
            onSendMessage={onSendMessage}
            doctorId={order.doctor_id}
            doctorName={order.doctor?.name || 'Doctor'}
          />
        </TabsContent>
        
        {/* Returns Tab */}
        {returns && returns.length > 0 && (
          <TabsContent value="returns">
            <OrderReturnsList 
              returns={returns} 
              isAdmin={isAdmin}
              onUpdateReturnStatus={isAdmin ? (returnId, status) => console.log('Update return status', returnId, status) : undefined}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default OrderDetailsView;
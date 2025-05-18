
import React, { useState } from 'react';
import { Truck, Calendar, MapPin, ExternalLink, ClipboardCopy } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Order } from '@/services/orderService';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface OrderTrackingInfoProps {
  order: Order;
  isAdmin?: boolean;
  onUpdateShipping?: () => void;
}

const OrderTrackingInfo: React.FC<OrderTrackingInfoProps> = ({ 
  order, 
  isAdmin = false,
  onUpdateShipping
}) => {
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not available';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Get tracking link based on carrier
  const getTrackingLink = () => {
    if (!order.tracking_number) return null;
    
    switch(order.shipping_carrier?.toLowerCase()) {
      case 'delhivery':
        return `https://www.delhivery.com/track/#package=${order.tracking_number}`;
      case 'bluedart':
        return `https://www.bluedart.com/tracking?trackfor=${order.tracking_number}`;
      case 'dtdc':
        return `https://www.dtdc.com/tracking/${order.tracking_number}`;
      case 'professional':
        return `https://www.pcscourier.com/track/index?tck=${order.tracking_number}`;
      case 'fedex':
        return `https://www.fedex.com/apps/fedextrack/?tracknumbers=${order.tracking_number}`;
      case 'dhl':
        return `https://www.dhl.com/in-en/home/tracking/tracking-express.html?submit=1&tracking-id=${order.tracking_number}`;
      default:
        return null;
    }
  };
  
  const hasShippingInfo = Boolean(
    order.tracking_number || 
    order.shipping_carrier || 
    order.estimated_delivery_date || 
    order.actual_delivery_date
  );
  
  const copyTrackingNumber = () => {
    if (order.tracking_number) {
      navigator.clipboard.writeText(order.tracking_number);
      toast.success("Tracking number copied to clipboard");
    }
  };
  
  const displayStatus = () => {
    let statusColor = "";
    let statusIcon = null;
    let statusText = "";
    
    switch(order.status) {
      case 'pending':
        statusColor = "bg-blue-100 text-blue-800";
        statusIcon = <span className="w-4 h-4 mr-1">⏳</span>;
        statusText = "Order Pending";
        break;
      case 'processing':
        statusColor = "bg-yellow-100 text-yellow-800";
        statusIcon = <span className="w-4 h-4 mr-1">⚙️</span>;
        statusText = "Processing";
        break;
      case 'shipped':
        statusColor = "bg-purple-100 text-purple-800";
        statusIcon = <Truck className="w-4 h-4 mr-1" />;
        statusText = "Shipped";
        break;
      case 'delivered':
        statusColor = "bg-green-100 text-green-800";
        statusIcon = <span className="w-4 h-4 mr-1">✅</span>;
        statusText = "Delivered";
        break;
      case 'cancelled':
        statusColor = "bg-red-100 text-red-800";
        statusIcon = <span className="w-4 h-4 mr-1">❌</span>;
        statusText = "Cancelled";
        break;
      default:
        statusColor = "bg-gray-100 text-gray-800";
        statusIcon = <span className="w-4 h-4 mr-1">❓</span>;
        statusText = order.status || "Unknown";
    }
    
    return (
      <Badge className={`flex items-center ${statusColor}`}>
        {statusIcon}
        {statusText}
      </Badge>
    );
  };
  
  const trackingLink = getTrackingLink();
  
  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center">
          <Truck className="h-5 w-5 mr-2 text-gray-500" />
          Shipping Information
        </h3>
        <div className="flex items-center">
          {displayStatus()}
          {isAdmin && onUpdateShipping && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onUpdateShipping} 
              className="ml-2"
            >
              Update
            </Button>
          )}
        </div>
      </div>
      
      <Separator />
      
      {hasShippingInfo ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Tracking Number</p>
              <p className="font-medium flex items-center">
                {order.tracking_number ? (
                  <>
                    {order.tracking_number}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 ml-1" 
                      onClick={copyTrackingNumber}
                    >
                      <ClipboardCopy className="h-3 w-3" />
                    </Button>
                    {trackingLink && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        asChild
                      >
                        <a href={trackingLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </>
                ) : (
                  <span className="text-gray-400">Not available</span>
                )}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Shipping Carrier</p>
              <p className="font-medium">
                {order.shipping_carrier || <span className="text-gray-400">Not available</span>}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Estimated Delivery</p>
              <p className="font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                {order.estimated_delivery_date ? 
                  formatDate(order.estimated_delivery_date) : 
                  <span className="text-gray-400">Not available</span>}
              </p>
            </div>
            
            {order.actual_delivery_date && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Delivery Date</p>
                <p className="font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-green-500" />
                  {formatDate(order.actual_delivery_date)}
                </p>
              </div>
            )}
          </div>
          
          {trackingLink && (
            <Button 
              variant="outline" 
              className="w-full mt-2"
              onClick={() => setIsTrackingOpen(true)}
            >
              <Truck className="h-4 w-4 mr-2" />
              Track Package
            </Button>
          )}
          
          <Dialog open={isTrackingOpen} onOpenChange={setIsTrackingOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Track Your Package</DialogTitle>
                <DialogDescription>
                  Use the information below to track your package
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div>
                  <p className="text-sm text-gray-500">Tracking Number</p>
                  <p className="font-medium flex items-center">
                    {order.tracking_number}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 ml-1" 
                      onClick={copyTrackingNumber}
                    >
                      <ClipboardCopy className="h-4 w-4" />
                    </Button>
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Shipping Carrier</p>
                  <p className="font-medium">{order.shipping_carrier}</p>
                </div>
                
                {order.estimated_delivery_date && (
                  <div>
                    <p className="text-sm text-gray-500">Estimated Delivery</p>
                    <p className="font-medium">
                      {formatDate(order.estimated_delivery_date)}
                    </p>
                  </div>
                )}
                
                <div className="pt-2">
                  <p className="text-sm text-gray-500 mb-2">Track via carrier website</p>
                  <Button 
                    variant="default" 
                    className="w-full"
                    asChild
                  >
                    <a href={trackingLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Track on {order.shipping_carrier} Website
                    </a>
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div className="text-center py-6">
          <Truck className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">No shipping information available yet</p>
          {order.status === 'pending' && (
            <p className="text-sm text-gray-400 mt-2">
              Shipping details will be available once your order is processed
            </p>
          )}
          {isAdmin && onUpdateShipping && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={onUpdateShipping}
            >
              Add Shipping Details
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderTrackingInfo;

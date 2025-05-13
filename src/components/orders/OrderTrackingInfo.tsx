import { useState } from "react";
import { Order } from "@/services/orderService";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import { 
  Truck, 
  Calendar, 
  Package, 
  ExternalLink, 
  CheckCircle2, 
  Clock,
  AlertCircle
} from "lucide-react";

interface OrderTrackingInfoProps {
  order: Order;
  isAdmin?: boolean;
  onUpdateTracking?: (data: {
    trackingNumber: string;
    shippingCarrier: string;
    estimatedDeliveryDate?: string;
  }) => void;
}

const OrderTrackingInfo = ({
  order,
  isAdmin = false,
  onUpdateTracking
}: OrderTrackingInfoProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || "");
  const [shippingCarrier, setShippingCarrier] = useState(order.shipping_carrier || "");
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(
    order.estimated_delivery_date 
      ? new Date(order.estimated_delivery_date).toISOString().split('T')[0]
      : ""
  );
  
  const handleSaveTracking = () => {
    if (onUpdateTracking) {
      onUpdateTracking({
        trackingNumber,
        shippingCarrier,
        estimatedDeliveryDate: estimatedDeliveryDate || undefined
      });
    }
    setIsEditing(false);
  };
  
  // Function to get tracking URL based on carrier
  const getTrackingUrl = () => {
    if (!order.tracking_number) return null;
    
    const carrier = order.shipping_carrier?.toLowerCase() || '';
    
    if (carrier.includes('dhl')) {
      return `https://www.dhl.com/in-en/home/tracking/tracking-express.html?submit=1&tracking-id=${order.tracking_number}`;
    } else if (carrier.includes('fedex')) {
      return `https://www.fedex.com/fedextrack/?trknbr=${order.tracking_number}`;
    } else if (carrier.includes('bluedart')) {
      return `https://www.bluedart.com/tracking?trackingId=${order.tracking_number}`;
    } else if (carrier.includes('dtdc')) {
      return `https://www.dtdc.in/tracking/tracking.asp?TrkType=Tracking_Dtdc&TrkNo=${order.tracking_number}`;
    } else if (carrier.includes('delhivery')) {
      return `https://www.delhivery.com/track/?tracking_id=${order.tracking_number}`;
    } else {
      return null;
    }
  };
  
  // Get tracking URL
  const trackingUrl = getTrackingUrl();
  
  // Get delivery status
  const getDeliveryStatus = () => {
    if (order.status === 'delivered') {
      return {
        icon: <CheckCircle2 className="h-6 w-6 text-green-500" />,
        text: 'Delivered',
        description: order.actual_delivery_date 
          ? `Delivered on ${formatDate(order.actual_delivery_date)}` 
          : 'Your order has been delivered'
      };
    } else if (order.status === 'shipped') {
      return {
        icon: <Truck className="h-6 w-6 text-purple-500" />,
        text: 'In Transit',
        description: order.estimated_delivery_date 
          ? `Estimated delivery on ${formatDate(order.estimated_delivery_date)}` 
          : 'Your order is on the way'
      };
    } else if (order.status === 'processing') {
      return {
        icon: <Package className="h-6 w-6 text-yellow-500" />,
        text: 'Processing',
        description: 'Your order is being prepared for shipping'
      };
    } else if (order.status === 'cancelled') {
      return {
        icon: <AlertCircle className="h-6 w-6 text-red-500" />,
        text: 'Cancelled',
        description: 'This order has been cancelled'
      };
    } else {
      return {
        icon: <Clock className="h-6 w-6 text-blue-500" />,
        text: 'Pending',
        description: 'Your order is pending processing'
      };
    }
  };
  
  const deliveryStatus = getDeliveryStatus();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Shipping & Tracking</CardTitle>
        <CardDescription>
          Track your order and view shipping details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Delivery Status */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          {deliveryStatus.icon}
          <div>
            <h3 className="font-medium">{deliveryStatus.text}</h3>
            <p className="text-sm text-gray-500">{deliveryStatus.description}</p>
          </div>
        </div>
        
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="tracking-number">Tracking Number</Label>
              <Input
                id="tracking-number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="shipping-carrier">Shipping Carrier</Label>
              <Input
                id="shipping-carrier"
                value={shippingCarrier}
                onChange={(e) => setShippingCarrier(e.target.value)}
                placeholder="Enter shipping carrier (e.g., DHL, FedEx)"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="estimated-delivery">Estimated Delivery Date</Label>
              <Input
                id="estimated-delivery"
                type="date"
                value={estimatedDeliveryDate}
                onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTracking}>
                Save Tracking Info
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {order.tracking_number ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Tracking Number</h3>
                    <p className="font-medium">{order.tracking_number}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Shipping Carrier</h3>
                    <p>{order.shipping_carrier || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {order.estimated_delivery_date && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Estimated Delivery</h3>
                      <p>{formatDate(order.estimated_delivery_date)}</p>
                    </div>
                  )}
                  
                  {order.actual_delivery_date && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Actual Delivery</h3>
                      <p>{formatDate(order.actual_delivery_date)}</p>
                    </div>
                  )}
                </div>
                
                {trackingUrl && (
                  <Button 
                    variant="outline" 
                    className="gap-2 mt-2"
                    onClick={() => window.open(trackingUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Track Package
                  </Button>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No tracking information available yet</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {isAdmin && onUpdateTracking && !isEditing && (
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setIsEditing(true)}
          >
            {order.tracking_number ? 'Update Tracking Info' : 'Add Tracking Info'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default OrderTrackingInfo;
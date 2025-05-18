
import { useState } from 'react';
import { Order } from '@/services/orderService';
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
  Clock, 
  CheckCircle2,
  Loader2 
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '');
  const [shippingCarrier, setShippingCarrier] = useState(order.shipping_carrier || '');
  const [estimatedDelivery, setEstimatedDelivery] = useState(
    order.estimated_delivery_date 
      ? new Date(order.estimated_delivery_date).toISOString().split('T')[0]
      : ''
  );
  
  const handleSaveTracking = () => {
    if (!onUpdateTracking) return;
    
    if (!trackingNumber.trim() || !shippingCarrier.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    
    onUpdateTracking({
      trackingNumber,
      shippingCarrier,
      estimatedDeliveryDate: estimatedDelivery || undefined
    });
    
    // Reset state after submission
    setIsSubmitting(false);
    setIsEditing(false);
  };
  
  const getDeliveryStatusMessage = () => {
    if (order.status === 'delivered' && order.actual_delivery_date) {
      return `Delivered on ${formatDate(order.actual_delivery_date)}`;
    }
    
    if (order.status === 'shipped' && order.tracking_number) {
      if (order.estimated_delivery_date) {
        const estimatedDate = new Date(order.estimated_delivery_date);
        const today = new Date();
        
        if (estimatedDate < today) {
          return 'Expected to be delivered soon';
        } else {
          return `Expected delivery by ${formatDate(order.estimated_delivery_date)}`;
        }
      } else {
        return 'In transit';
      }
    }
    
    if (order.status === 'processing') {
      return 'Preparing for shipment';
    }
    
    if (order.status === 'pending') {
      return 'Order confirmed, waiting to be processed';
    }
    
    if (order.status === 'cancelled') {
      return 'Order has been cancelled';
    }
    
    return 'Status not available';
  };
  
  const getDeliveryIcon = () => {
    if (order.status === 'delivered') {
      return <CheckCircle2 className="h-10 w-10 text-green-500" />;
    }
    
    if (order.status === 'shipped') {
      return <Truck className="h-10 w-10 text-purple-500" />;
    }
    
    if (order.status === 'processing') {
      return <Clock className="h-10 w-10 text-yellow-500" />;
    }
    
    if (order.status === 'cancelled') {
      return <Truck className="h-10 w-10 text-red-500" />;
    }
    
    return <Calendar className="h-10 w-10 text-blue-500" />;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracking Information</CardTitle>
        <CardDescription>
          Track your order delivery status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Delivery Status */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          {getDeliveryIcon()}
          <div>
            <p className="font-medium text-lg">{getDeliveryStatusMessage()}</p>
            {order.status === 'shipped' && (
              <p className="text-sm text-gray-500">
                Your package is on its way
              </p>
            )}
          </div>
        </div>
        
        {/* Tracking Details */}
        {(order.tracking_number || isEditing) ? (
          <div className="space-y-4">
            {isEditing ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tracking-number">Tracking Number</Label>
                    <Input
                      id="tracking-number"
                      placeholder="Enter tracking number"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carrier">Shipping Carrier</Label>
                    <Input
                      id="carrier"
                      placeholder="Enter shipping carrier"
                      value={shippingCarrier}
                      onChange={(e) => setShippingCarrier(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated-delivery">Estimated Delivery Date</Label>
                  <Input
                    id="estimated-delivery"
                    type="date"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveTracking}
                    disabled={
                      isSubmitting || 
                      !trackingNumber.trim() || 
                      !shippingCarrier.trim()
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Tracking Info'
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {order.tracking_number && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Tracking Number</p>
                      <p className="font-medium">{order.tracking_number}</p>
                    </div>
                  )}
                  
                  {order.shipping_carrier && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Shipping Carrier</p>
                      <p className="font-medium">{order.shipping_carrier}</p>
                    </div>
                  )}
                </div>
                
                {order.estimated_delivery_date && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Estimated Delivery Date</p>
                    <p className="font-medium">{formatDate(order.estimated_delivery_date)}</p>
                  </div>
                )}
                
                {isAdmin && onUpdateTracking && order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => setIsEditing(true)}
                  >
                    Update Tracking Info
                  </Button>
                )}
              </>
            )}
          </div>
        ) : (
          <>
            {order.status === 'pending' || order.status === 'processing' ? (
              <div className="text-center p-6">
                <p className="text-gray-500">
                  Tracking information will be available once your order ships.
                </p>
              </div>
            ) : order.status === 'cancelled' ? (
              <div className="text-center p-6">
                <p className="text-gray-500">
                  This order has been cancelled. No tracking information available.
                </p>
              </div>
            ) : (
              <div className="text-center p-6">
                <p className="text-gray-500">
                  Tracking information not available.
                </p>
              </div>
            )}
            
            {isAdmin && onUpdateTracking && order.status !== 'cancelled' && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setIsEditing(true)}
              >
                Add Tracking Information
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderTrackingInfo;

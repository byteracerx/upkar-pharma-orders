
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Order } from "@/services/orderService";
import { CalendarDays, Package, Truck } from "lucide-react";
import { format } from "date-fns";

export interface OrderTrackingInfoProps {
  order: Order;
  isAdmin?: boolean;
  onUpdateTracking?: (data: {
    trackingNumber: string;
    shippingCarrier: string;
    estimatedDeliveryDate?: string;
  }) => void;
}

const OrderTrackingInfo = ({ order, isAdmin, onUpdateTracking }: OrderTrackingInfoProps) => {
  const hasTracking = order.tracking_number && order.shipping_carrier;
  
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Not set";
    try {
      return format(new Date(dateString), "PPP");
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Package className="h-5 w-5" />
            Shipping Information
          </h3>
          
          {isAdmin && onUpdateTracking && order.status !== "delivered" && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onUpdateTracking({
                trackingNumber: order.tracking_number || "",
                shippingCarrier: order.shipping_carrier || "",
                estimatedDeliveryDate: order.estimated_delivery_date || undefined
              })}
            >
              {hasTracking ? "Update Tracking" : "Add Tracking"}
            </Button>
          )}
        </div>
        
        {hasTracking ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Carrier:</span>
              <span className="font-medium">{order.shipping_carrier}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Tracking Number:</span>
              <span className="font-medium">{order.tracking_number}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Status:</span>
              <Badge variant={order.status === "delivered" ? "success" : "default"}>
                {order.status === "delivered" ? "Delivered" : "In Transit"}
              </Badge>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-gray-500">
                  <Truck className="h-4 w-4" />
                  <span>Estimated Delivery:</span>
                </div>
                <span className="font-medium">
                  {order.estimated_delivery_date 
                    ? formatDate(order.estimated_delivery_date) 
                    : "Not specified"}
                </span>
              </div>
              {order.actual_delivery_date && (
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1 text-gray-500">
                    <CalendarDays className="h-4 w-4" />
                    <span>Actual Delivery:</span>
                  </div>
                  <span className="font-medium">
                    {formatDate(order.actual_delivery_date)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No tracking information available yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderTrackingInfo;


import { useState } from 'react';
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OrderItemsList from './OrderItemsList';
import OrderStatusTimeline from './OrderStatusTimeline';
import OrderTrackingInfo from './OrderTrackingInfo';
import OrderCommunicationPanel from './OrderCommunicationPanel';
import OrderReturnsList from './OrderReturnsList';
import { OrderDetails } from '@/services/order/types';
import { useAuth } from "@/contexts/AuthContext";

interface OrderDetailsViewProps {
  orderDetails: OrderDetails;
}

const OrderDetailsView = ({ orderDetails }: OrderDetailsViewProps) => {
  const [activeTab, setActiveTab] = useState('items');
  const { order, items, statusHistory, communications, returns } = orderDetails;
  const { user } = useAuth();

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-xl font-medium mb-2">Order Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-medium">{order.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date Placed</p>
                <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium capitalize">{order.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment</p>
                <p className="font-medium">{order.payment_status || 'Paid'}</p>
              </div>
            </div>
          </div>

          {order.shipping_address && (
            <div className="bg-white rounded-lg border p-4">
              <h2 className="text-xl font-medium mb-2">Shipping Information</h2>
              <p className="whitespace-pre-line">{order.shipping_address}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-xl font-medium mb-2">Order Summary</h2>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span>Total Items:</span>
              <span>{items.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{order.total_amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>₹0</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total:</span>
              <span>₹{order.total_amount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="items" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="timeline">Status History</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>
        
        <TabsContent value="items">
          <OrderItemsList items={items} returnOptions={true} />
        </TabsContent>
        
        <TabsContent value="tracking">
          <OrderTrackingInfo order={order} />
        </TabsContent>
        
        <TabsContent value="timeline">
          <OrderStatusTimeline statusHistory={statusHistory || []} />
        </TabsContent>
        
        <TabsContent value="communication">
          <OrderCommunicationPanel 
            orderId={order.id} 
            communications={communications || []} 
            isAdmin={false}
            doctorId={user?.id || ''}
            doctorName={order.doctor?.name || 'Doctor'}
          />
        </TabsContent>
      </Tabs>

      {returns && returns.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-medium mb-2">Returns</h2>
          <OrderReturnsList returns={returns} />
        </div>
      )}
    </div>
  );
};

export default OrderDetailsView;

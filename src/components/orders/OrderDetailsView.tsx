
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Download, Send } from "lucide-react";
import { OrderDetails } from "@/services/order/types";
import { downloadInvoice, sendInvoiceEmail } from "@/services/invoiceService";
import { toast } from "sonner";
import { useState } from "react";

interface OrderDetailsViewProps {
  orderDetails: OrderDetails;
  isAdmin?: boolean;
}

const OrderDetailsView = ({ orderDetails, isAdmin = false }: OrderDetailsViewProps) => {
  const [isSending, setSending] = useState(false);
  const { order, items, statusHistory } = orderDetails;
  
  const handleDownloadInvoice = () => {
    if (order.invoice_url) {
      downloadInvoice(order.invoice_url, `Invoice_${order.invoice_number || order.id}.pdf`);
    } else {
      toast.error("Invoice not available", { description: "This order doesn't have an invoice generated yet." });
    }
  };
  
  const handleSendInvoiceEmail = async () => {
    try {
      setSending(true);
      const success = await sendInvoiceEmail(order.id);
      if (success) {
        toast.success("Invoice sent", { description: "Invoice has been sent by email." });
      }
    } catch (error) {
      console.error("Error sending invoice:", error);
      toast.error("Failed to send invoice");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Order #{order.id.substring(0, 8)}</h2>
          <p className="text-gray-500">Placed on {formatDate(order.created_at)}</p>
        </div>
        
        <div className="flex gap-2">
          {order.invoice_generated && (
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleDownloadInvoice}
            >
              <Download className="h-4 w-4" />
              Download Invoice
            </Button>
          )}
          
          {isAdmin && order.invoice_generated && (
            <Button 
              variant="default" 
              className="flex items-center gap-2"
              onClick={handleSendInvoiceEmail}
              disabled={isSending}
            >
              <Send className="h-4 w-4" />
              {isSending ? "Sending..." : "Email Invoice"}
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <Badge 
                className={`
                  ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800' : 
                    order.status === 'processing' ? 'bg-orange-100 text-orange-800' : 
                    'bg-gray-100 text-gray-800'}
                `}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
              <span className="text-sm text-gray-500">
                {order.updated_at ? `Last updated: ${formatDate(order.updated_at)}` : ''}
              </span>
            </div>
            
            {order.tracking_number && (
              <div className="mt-4">
                <p className="text-sm font-medium">Tracking Information</p>
                <p className="text-sm">Carrier: {order.shipping_carrier}</p>
                <p className="text-sm">Tracking #: {order.tracking_number}</p>
                {order.estimated_delivery_date && (
                  <p className="text-sm">Estimated Delivery: {formatDate(order.estimated_delivery_date)}</p>
                )}
              </div>
            )}
            
            {statusHistory && statusHistory.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Status History</p>
                <div className="space-y-2">
                  {statusHistory.map((status, index) => (
                    <div key={index} className="text-xs">
                      <div className="flex justify-between">
                        <span className="font-medium">{status.status.replace(/_/g, ' ').charAt(0).toUpperCase() + status.status.replace(/_/g, ' ').slice(1)}</span>
                        <span className="text-gray-500">{formatDate(status.created_at)}</span>
                      </div>
                      {status.notes && <p className="text-gray-600">{status.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Shipping Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="font-medium">{order.doctor?.name || 'N/A'}</p>
              <p>{order.shipping_address || 'No shipping address provided'}</p>
              {order.doctor?.phone && <p>Phone: {order.doctor.phone}</p>}
              {order.doctor?.email && <p>Email: {order.doctor.email}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">Item</th>
                  <th className="px-6 py-3 text-center">Quantity</th>
                  <th className="px-6 py-3 text-right">Price</th>
                  <th className="px-6 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="bg-white">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.product?.name || 'Unknown Product'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-500">{item.quantity}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm text-gray-500">{formatCurrency(item.price_per_unit)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-medium">{formatCurrency(item.total_price)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right font-medium">Subtotal</td>
                  <td className="px-6 py-4 text-right font-medium">{formatCurrency(order.total_amount)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right font-medium">Shipping</td>
                  <td className="px-6 py-4 text-right font-medium">{formatCurrency(order.shipping_cost || 0)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right text-lg font-semibold">Total</td>
                  <td className="px-6 py-4 text-right text-lg font-semibold">
                    {formatCurrency(order.total_amount + (order.shipping_cost || 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderDetailsView;

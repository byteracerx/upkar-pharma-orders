
import { OrderItem } from "@/services/orderService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface OrderItemsListProps {
  items: OrderItem[];
}

const OrderItemsList = ({ items }: OrderItemsListProps) => {
  // Calculate order summary
  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
  
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    {item.product && item.product.image_url && (
                      <div className="h-12 w-12 rounded-md overflow-hidden">
                        <img 
                          src={item.product.image_url} 
                          alt={item.product?.name || 'Product'} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <div>{item.product?.name || 'Unknown Product'}</div>
                      {item.product?.category && (
                        <Badge variant="outline" className="mt-1">
                          {item.product.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(item.price_per_unit)}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.total_price)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderItemsList;

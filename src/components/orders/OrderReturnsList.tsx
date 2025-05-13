import { Return } from "@/services/orderService";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils";

interface OrderReturnsListProps {
  returns: Return[];
  isAdmin?: boolean;
  onUpdateReturnStatus?: (returnId: string, status: string) => void;
}

const OrderReturnsList = ({
  returns,
  isAdmin = false,
  onUpdateReturnStatus
}: OrderReturnsListProps) => {
  // Function to get badge color based on return status
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return "bg-blue-100 text-blue-800";
      case 'approved':
        return "bg-green-100 text-green-800";
      case 'rejected':
        return "bg-red-100 text-red-800";
      case 'completed':
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div className="space-y-4">
      {returns.map((returnItem) => (
        <Card key={returnItem.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">
                  Return #{returnItem.id.substring(0, 8)}
                </CardTitle>
                <CardDescription>
                  Initiated on {formatDate(returnItem.created_at)}
                </CardDescription>
              </div>
              <Badge className={getStatusBadgeColor(returnItem.status)}>
                {returnItem.status.charAt(0).toUpperCase() + returnItem.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Reason for Return</h4>
              <p className="text-sm">{returnItem.reason}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Return Items</h4>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returnItem.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.product?.name || 'Unknown Product'}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.price_per_unit)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.total_price)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium">
                        Total Return Amount
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(returnItem.amount)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
            
            {returnItem.notes && (
              <div>
                <h4 className="text-sm font-medium mb-1">Notes</h4>
                <p className="text-sm">{returnItem.notes}</p>
              </div>
            )}
          </CardContent>
          
          {isAdmin && onUpdateReturnStatus && returnItem.status === 'pending' && (
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="bg-red-100 text-red-800 hover:bg-red-200"
                onClick={() => onUpdateReturnStatus(returnItem.id, 'rejected')}
              >
                Reject Return
              </Button>
              <Button
                onClick={() => onUpdateReturnStatus(returnItem.id, 'approved')}
              >
                Approve Return
              </Button>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
};

export default OrderReturnsList;
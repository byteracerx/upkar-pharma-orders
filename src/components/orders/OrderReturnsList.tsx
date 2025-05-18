
import { useState } from 'react';
import { OrderReturn } from '@/services/orderService';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Box, CheckCircle2, XCircle, Clock, ListFilter } from 'lucide-react';

interface OrderReturnsListProps {
  returns: OrderReturn[];
}

const OrderReturnsList = ({ returns }: OrderReturnsListProps) => {
  const [expandedDefault, setExpandedDefault] = useState<string | null>(null);
  
  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return "bg-yellow-100 text-yellow-800";
      case 'approved':
        return "bg-green-100 text-green-800";
      case 'rejected':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <ListFilter className="h-4 w-4" />;
    }
  };
  
  if (!returns || returns.length === 0) {
    return (
      <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
        <Box className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900">No Returns</h3>
        <p className="text-gray-500 mt-2">This order doesn't have any returns</p>
      </div>
    );
  }
  
  return (
    <Accordion type="single" collapsible defaultValue={expandedDefault || undefined}>
      {returns.map((returnItem) => (
        <AccordionItem key={returnItem.id} value={returnItem.id}>
          <AccordionTrigger className="hover:bg-gray-50 px-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <Box className="h-5 w-5 text-gray-500" />
                <span>Return #{returnItem.id.substring(0, 8)}</span>
                <Badge className={getStatusBadgeColor(returnItem.status)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(returnItem.status)}
                    {returnItem.status.charAt(0).toUpperCase() + returnItem.status.slice(1)}
                  </span>
                </Badge>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatCurrency(returnItem.amount)}</div>
                <div className="text-sm text-gray-500">{formatDate(returnItem.created_at)}</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Reason for Return</p>
                <p className="mt-1">{returnItem.reason}</p>
              </div>
              
              {returnItem.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Additional Notes</p>
                  <p className="mt-1">{returnItem.notes}</p>
                </div>
              )}
              
              {returnItem.items && returnItem.items.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Returned Items</p>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {returnItem.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.product?.name || 'Unknown Product'}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{formatCurrency(item.total_price)}</TableCell>
                            <TableCell>{item.reason || 'Not specified'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default OrderReturnsList;

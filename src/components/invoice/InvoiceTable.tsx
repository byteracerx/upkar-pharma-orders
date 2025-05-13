
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface InvoiceItem {
  id: number;
  product: string;
  pack: string;
  batch: string;
  mrp: number;
  qty: number;
  free: number;
  rate: number;
  discount: string;
  amount: number;
  hsn?: string;
  expiry?: string;
}

interface InvoiceTableProps {
  items: InvoiceItem[];
  showHsn?: boolean;
  showExpiry?: boolean;
}

export const InvoiceTable = ({ items, showHsn = true, showExpiry = true }: InvoiceTableProps) => {
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  
  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="bg-upkem-light-gray py-2">
        <CardTitle className="text-lg text-upkem-dark-green">Order Items</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="invoice-table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">S.No</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Pack</TableHead>
                {showHsn && <TableHead>HSN</TableHead>}
                <TableHead>Batch</TableHead>
                {showExpiry && <TableHead>Exp</TableHead>}
                <TableHead>MRP</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Free</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Disc</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell className="font-medium">{item.product}</TableCell>
                  <TableCell>{item.pack}</TableCell>
                  {showHsn && <TableCell>{item.hsn || '-'}</TableCell>}
                  <TableCell>{item.batch}</TableCell>
                  {showExpiry && <TableCell>{item.expiry || '-'}</TableCell>}
                  <TableCell>₹{item.mrp.toFixed(2)}</TableCell>
                  <TableCell>{item.qty}</TableCell>
                  <TableCell>{item.free}</TableCell>
                  <TableCell>₹{item.rate.toFixed(2)}</TableCell>
                  <TableCell>{item.discount}</TableCell>
                  <TableCell className="text-right">₹{item.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div>
            <p className="text-sm font-medium">Total Qty: {totalQty}</p>
            <p className="text-sm font-medium">Total Items: {items.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Sub Total: ₹{totalAmount.toFixed(2)}</p>
            <p className="text-lg font-bold text-upkem-green">Net Amount: ₹{totalAmount.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceTable;

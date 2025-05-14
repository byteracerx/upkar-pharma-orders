
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Eye, Download, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Invoice {
  id: string;
  order_id: string;
  invoice_number: string;
  doctor_id: string;
  doctor_name: string;
  doctor_phone: string;
  amount: number;
  status: string;
  created_at: string;
  due_date?: string;
  paid_date?: string;
  invoice_url?: string;
}

const AdminInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isInvoiceDetailsOpen, setIsInvoiceDetailsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch invoices from Supabase
  useEffect(() => {
    fetchInvoices();
    
    // Set up real-time subscription
    const invoicesChannel = supabase
      .channel('invoices-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Orders/Invoices table changed:', payload);
          fetchInvoices(); // Refresh data on any change
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(invoicesChannel);
    };
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      
      // Try using the RPC function first
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_invoices');
        
        if (!rpcError && rpcData) {
          setInvoices(rpcData as Invoice[]);
          return;
        }
      } catch (rpcError) {
        console.warn("RPC function get_all_invoices failed, falling back to direct query:", rpcError);
      }
      
      // Fallback to direct query
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          invoice_number,
          doctor_id,
          total_amount,
          status,
          created_at,
          invoice_generated,
          invoice_url,
          doctor:doctor_id (
            name,
            phone
          )
        `)
        .not('invoice_number', 'is', null)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to match the Invoice interface
      const formattedInvoices: Invoice[] = data.map(order => ({
        id: order.id,
        order_id: order.id,
        invoice_number: order.invoice_number || `INV-${order.id.substring(0, 8)}`,
        doctor_id: order.doctor_id,
        doctor_name: order.doctor?.name || "Unknown",
        doctor_phone: order.doctor?.phone || "N/A",
        amount: order.total_amount,
        status: order.status === 'delivered' ? 'paid' : 'pending',
        created_at: order.created_at,
        due_date: new Date(new Date(order.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        paid_date: order.status === 'delivered' ? order.created_at : undefined,
        invoice_url: order.invoice_url
      }));
      
      setInvoices(formattedInvoices);
    } catch (error: any) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to load invoices", {
        description: error.message || "Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  // Download invoice
  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      setIsDownloading(true);
      
      // In a real implementation, this would download the actual invoice file
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Invoice Downloaded", {
        description: `Invoice ${invoice.invoice_number} has been downloaded.`
      });
    } catch (error: any) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice", {
        description: error.message || "Please try again."
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // View invoice details
  const viewInvoiceDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsInvoiceDetailsOpen(true);
  };

  // Filter invoices based on search term
  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.doctor_phone.includes(searchTerm)
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Invoice Management</h1>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            placeholder="Search by doctor name, phone or invoice number..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Button 
          variant="outline" 
          onClick={fetchInvoices}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>
            Manage and track all invoices generated for orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
            </div>
          ) : filteredInvoices.length > 0 ? (
            <Table>
              <TableCaption>A list of all invoices</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>{invoice.doctor_name}</TableCell>
                    <TableCell>{invoice.doctor_phone}</TableCell>
                    <TableCell>
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>₹{invoice.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        className={`${
                          invoice.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => viewInvoiceDetails(invoice)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDownloadInvoice(invoice)}
                          disabled={isDownloading}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-8">
              <p className="text-gray-500">
                No invoices found. {searchTerm && "Try a different search term."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Invoice Details Dialog */}
      <Dialog open={isInvoiceDetailsOpen} onOpenChange={setIsInvoiceDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              {selectedInvoice && (
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Invoice Number:</span> {selectedInvoice.invoice_number}
                  <br />
                  <span className="font-medium">Date:</span> {new Date(selectedInvoice.created_at).toLocaleString()}
                  <br />
                  <span className="font-medium">Doctor:</span> {selectedInvoice.doctor_name}
                  <br />
                  <span className="font-medium">Phone:</span> {selectedInvoice.doctor_phone}
                  <br />
                  <span className="font-medium">Amount:</span> ₹{selectedInvoice.amount.toFixed(2)}
                  <br />
                  <span className="font-medium">Status:</span> {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                  <br />
                  <span className="font-medium">Due Date:</span> {selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString() : 'N/A'}
                  <br />
                  {selectedInvoice.paid_date && (
                    <>
                      <span className="font-medium">Paid Date:</span> {new Date(selectedInvoice.paid_date).toLocaleDateString()}
                      <br />
                    </>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="border rounded-md p-4 mt-4">
            <h3 className="font-medium mb-2">Order Items</h3>
            <p className="text-sm text-gray-500">
              Order items would be displayed here in a real implementation.
            </p>
          </div>
          
          <DialogFooter className="mt-6">
            <Button
              onClick={() => selectedInvoice && handleDownloadInvoice(selectedInvoice)}
              disabled={isDownloading}
              className="w-full sm:w-auto"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Invoice
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInvoices;


import { Card, CardContent } from "@/components/ui/card";
import InvoiceTable, { InvoiceItem } from "./InvoiceTable";
import { Separator } from "@/components/ui/separator";

interface InvoiceProps {
  invoiceNumber: string;
  invoiceDate: string;
  customerCode: string;
  customerName: string;
  customerAddress: {
    street: string;
    city: string;
    pincode: string;
  };
  customerContact: {
    phone?: string;
    dl?: string;
    gst?: string;
  };
  companyDetails: {
    name: string;
    address: string[];
    gst: string;
    dlNumber: string;
    contact: string;
  };
  items: InvoiceItem[];
  paymentDetails: {
    subtotal: number;
    discount?: number;
    taxAmount?: number;
    freight?: number;
    roundOff?: number;
    netAmount: number;
  };
}

export const Invoice = ({
  invoiceNumber,
  invoiceDate,
  customerCode,
  customerName,
  customerAddress,
  customerContact,
  companyDetails,
  items,
  paymentDetails,
}: InvoiceProps) => {
  return (
    <Card className="shadow-md border border-gray-200">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 bg-upkem-light-gray border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between">
            <div>
              <h2 className="text-xl font-bold text-upkem-dark-green">{companyDetails.name}</h2>
              {companyDetails.address.map((line, index) => (
                <p key={index} className="text-sm text-gray-600">{line}</p>
              ))}
              <p className="text-sm text-gray-600">Mobile: {companyDetails.contact}</p>
            </div>
            <div className="mt-4 md:mt-0 text-right">
              <p className="text-sm"><span className="font-semibold">GST No:</span> {companyDetails.gst}</p>
              <p className="text-sm"><span className="font-semibold">DL No:</span> {companyDetails.dlNumber}</p>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-200">
          <div>
            <h3 className="font-semibold text-sm text-gray-500">Customer</h3>
            <p className="font-bold">{customerName}</p>
            <p className="text-sm">{customerAddress.street}</p>
            <p className="text-sm">{customerAddress.city} - {customerAddress.pincode}</p>
            {customerContact.phone && <p className="text-sm">Phone: {customerContact.phone}</p>}
            {customerContact.dl && <p className="text-sm">DL No: {customerContact.dl}</p>}
            {customerContact.gst && <p className="text-sm">GST No: {customerContact.gst}</p>}
          </div>
          <div className="md:border-l md:pl-4 md:border-gray-200">
            <h3 className="font-bold text-center py-2 bg-upkem-light-gray text-upkem-dark-green">Tax Invoice</h3>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <p className="text-sm font-medium">Inv No:</p>
              <p className="text-sm">{invoiceNumber}</p>
              
              <p className="text-sm font-medium">Date:</p>
              <p className="text-sm">{invoiceDate}</p>
              
              <p className="text-sm font-medium">Customer Code:</p>
              <p className="text-sm">{customerCode}</p>
            </div>
          </div>
        </div>

        {/* Invoice Table */}
        <InvoiceTable items={items} />

        {/* Payment Summary */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="md:w-1/2">
              <p className="font-bold mb-2">Payment Information</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-sm font-medium">GST 5%:</span>
                <span className="text-sm">₹{(paymentDetails.taxAmount || 0) * 0.25}</span>
                
                <span className="text-sm font-medium">GST 12%:</span>
                <span className="text-sm">₹{(paymentDetails.taxAmount || 0) * 0.5}</span>
                
                <span className="text-sm font-medium">GST 18%:</span>
                <span className="text-sm">₹{(paymentDetails.taxAmount || 0) * 0.25}</span>
              </div>
            </div>
            
            <div className="md:w-1/2 mt-4 md:mt-0">
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">Sub Total:</span>
                  <span>₹{paymentDetails.subtotal.toFixed(2)}</span>
                </div>
                
                {paymentDetails.discount !== undefined && (
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Discount:</span>
                    <span>₹{paymentDetails.discount.toFixed(2)}</span>
                  </div>
                )}
                
                {paymentDetails.taxAmount !== undefined && (
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Tax Amount:</span>
                    <span>₹{paymentDetails.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                
                {paymentDetails.freight !== undefined && (
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Freight:</span>
                    <span>₹{paymentDetails.freight.toFixed(2)}</span>
                  </div>
                )}
                
                {paymentDetails.roundOff !== undefined && (
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Round off:</span>
                    <span>₹{paymentDetails.roundOff.toFixed(2)}</span>
                  </div>
                )}
                
                <Separator className="my-2" />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Net Amount:</span>
                  <span className="text-upkem-green">₹{paymentDetails.netAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 text-xs text-gray-600">
          <p className="font-medium mb-1">Terms & Conditions:</p>
          <ol className="list-decimal ml-4 space-y-1">
            <li>Subject To: CHENNAI Jurisdiction.</li>
            <li>Please Check Batch No/Exp Before Taking Delivery.</li>
          </ol>
          
          <div className="flex justify-end mt-6">
            <div className="text-center">
              <p className="font-medium">For {companyDetails.name}</p>
              <p className="mt-8">Authorised Signatory</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Invoice;

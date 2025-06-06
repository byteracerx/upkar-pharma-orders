
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generatePDFInvoice } from "./invoiceService";

export interface InvoiceResult {
  success: boolean;
  invoice_number?: string;
  invoice_url?: string;
  error?: string;
}

export const generateInvoiceEnhanced = async (orderId: string): Promise<InvoiceResult> => {
  try {
    // Call the enhanced database function
    const { data, error } = await supabase
      .rpc('generate_invoice_enhanced', {
        p_order_id: orderId
      });

    if (error) throw error;

    const result = data as { success: boolean; error?: string; invoice_number?: string; invoice_url?: string };
    if (!result.success) {
      throw new Error(result.error || 'Failed to generate invoice');
    }

    // Generate actual PDF
    const pdfDataUri = await generatePDFInvoice(orderId);
    
    if (pdfDataUri) {
      // Update the order with the actual PDF URL
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          invoice_url: pdfDataUri,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating invoice URL:', updateError);
      }
    }

    toast.success("Invoice Generated", {
      description: `Invoice ${result.invoice_number} has been generated and credit added to doctor's account.`
    });

    return {
      success: true,
      invoice_number: result.invoice_number,
      invoice_url: pdfDataUri || result.invoice_url
    };
  } catch (error: any) {
    console.error('Error generating enhanced invoice:', error);
    toast.error("Failed to generate invoice", {
      description: error.message || "Please try again."
    });
    
    return {
      success: false,
      error: error.message || "Failed to generate invoice"
    };
  }
};

export const downloadInvoiceEnhanced = (invoiceUrl: string, invoiceNumber: string) => {
  if (invoiceUrl.startsWith('data:')) {
    // Handle PDF data URI
    const link = document.createElement('a');
    link.href = invoiceUrl;
    link.download = `${invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    // Handle regular URL
    window.open(invoiceUrl, '_blank');
  }
  
  toast.success("Invoice Downloaded", {
    description: `Invoice ${invoiceNumber} has been downloaded.`
  });
};

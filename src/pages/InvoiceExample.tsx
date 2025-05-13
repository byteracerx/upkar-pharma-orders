
import Layout from "@/components/layout/Layout";
import Invoice from "@/components/invoice/Invoice";
import { InvoiceItem } from "@/components/invoice/InvoiceTable";

const sampleItems: InvoiceItem[] = [
  {
    id: 1,
    product: "VERTIGO 16 TABS",
    pack: "1X10",
    hsn: "30049099",
    batch: "BV27",
    expiry: "09/27",
    mrp: 357.87,
    qty: 16,
    free: 4,
    rate: 173.00,
    discount: "12%",
    amount: 3104.00
  },
  {
    id: 2,
    product: "URODIV 150MG TABS",
    pack: "1X10",
    hsn: "30049099",
    batch: "BV26",
    expiry: "08/26",
    mrp: 285.00,
    qty: 8,
    free: 2,
    rate: 253.00,
    discount: "5%",
    amount: 2024.00
  },
  {
    id: 3,
    product: "TELMIS 40 MG TAB (ALU/ALU)",
    pack: "1X10",
    hsn: "30049079",
    batch: "BV26",
    expiry: "08/26",
    mrp: 113.50,
    qty: 16,
    free: 4,
    rate: 101.00,
    discount: "12%",
    amount: 1616.00
  },
  {
    id: 4,
    product: "PARACELS 125MG 60ML",
    pack: "1X10",
    hsn: "30049063",
    batch: "BJ26",
    expiry: "11/26",
    mrp: 24.80,
    qty: 21,
    free: 4,
    rate: 20.00,
    discount: "12%",
    amount: 420.00
  },
  {
    id: 5,
    product: "GLEKFORD 40 5MG/500MG",
    pack: "1X10",
    hsn: "30049099",
    batch: "BA25",
    expiry: "07/25",
    mrp: 210.00,
    qty: 8,
    free: 2,
    rate: 176.00,
    discount: "15%",
    amount: 1408.00
  }
];

const InvoiceExample = () => {
  return (
    <Layout>
      <div className="container-custom py-8">
        <h1 className="text-2xl font-bold mb-6">Invoice Example</h1>
        
        <Invoice
          invoiceNumber="*** 2051"
          invoiceDate="04/03/2025"
          customerCode="541"
          customerName="VETRI MEDICALS"
          customerAddress={{
            street: "18/35, PERAMBUR BARRACKS ROSD",
            city: "PATTALALAM",
            pincode: "600012"
          }}
          customerContact={{
            phone: "9884021527",
            dl: "2390/MZ2/09B",
            gst: "33AACV2123B1ZY"
          }}
          companyDetails={{
            name: "UPKAR PHARMA DISTRIBUTORS",
            address: [
              "NO.47, GROUND FLOOR, 1ST STREET,",
              "VAIDYNATHA MUDALI STREET, CHENNAI",
              "CHENNAI - 600079"
            ],
            gst: "33BACPV0554A1ZB",
            dlNumber: "TN-02-21B-00081",
            contact: "9840895791"
          }}
          items={sampleItems}
          paymentDetails={{
            subtotal: 42535.00,
            discount: 6389.25,
            taxAmount: 4290.34,
            freight: 0.00,
            roundOff: -0.09,
            netAmount: 40445.00
          }}
        />
      </div>
    </Layout>
  );
};

export default InvoiceExample;


// Types for the admin service

// Doctor interface
export interface Doctor {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address: string;
  gst_number: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

// Shipping info interface
export interface ShippingInfo {
  tracking_number: string;
  shipping_carrier: string;
  estimated_delivery_date?: string;
}

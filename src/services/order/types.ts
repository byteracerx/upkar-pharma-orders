
export interface Order {
  id: string;
  doctor_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at?: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  tracking_number?: string;
  shipping_carrier?: string;
  payment_status?: string;
  invoice_number?: string;
  invoice_generated?: boolean;
  shipping_cost?: number;
  invoice_url?: string;
  shipping_address?: string;
  billing_address?: string;
  payment_method?: string;
  notes?: string;
  doctor?: Doctor;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  product?: Product;
}

export interface Doctor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gst_number?: string;
  is_approved?: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  category?: string;
  stock?: number;
}

export interface StatusHistory {
  id: string;
  order_id: string;
  status: string;
  notes?: string;
  created_at: string;
  created_by?: string;
}

export interface OrderDetails {
  order: Order;
  items: OrderItem[];
  statusHistory?: StatusHistory[];
  notifications?: any[];
  communications?: any[];
  returns?: any[];
}

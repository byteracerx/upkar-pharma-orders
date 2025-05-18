
// Define all order-related types in one place for better organization

// Order item type definition
export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  product: {
    name: string;
    price: number;
    description?: string;
    image_url?: string;
    category?: string;
  };
}

// Main order type definition
export interface Order {
  id: string;
  doctor_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  payment_method?: string;
  payment_status?: string;
  shipping_address?: string;
  billing_address?: string;
  tracking_number?: string | null;
  shipping_carrier?: string | null;
  estimated_delivery_date?: string | null;
  actual_delivery_date?: string | null;
  notes?: string;
  invoice_number?: string;
  invoice_generated?: boolean;
  invoice_url?: string;
  doctor?: {
    name: string;
    email: string;
    phone: string;
  };
}

// Order status history type
export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: string;
  created_at: string;
  created_by: string;
  notes?: string;
  admin_name?: string;
}

// Order communication type
export interface OrderCommunication {
  id: string;
  order_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  read: boolean;
  sender_type: 'admin' | 'doctor';
  recipient_id?: string;
  read_at?: string;
}

// Order return type
export interface OrderReturn {
  id: string;
  order_id: string;
  doctor_id: string;
  reason: string;
  status: string;
  amount: number;
  created_at: string;
  updated_at: string;
  processed_by?: string;
  notes?: string;
  items?: {
    id: string;
    product_id: string;
    quantity: number;
    price_per_unit: number;
    total_price: number;
    reason?: string;
    condition?: string;
    product?: {
      name: string;
      price: number;
      category?: string;
    };
  }[];
}

// Combined order details type
export interface OrderDetails {
  order: Order;
  items: OrderItem[];
  statusHistory?: OrderStatusHistory[];
  communications?: OrderCommunication[];
  returns?: OrderReturn[];
}

// Shipping info type
export interface ShippingInfo {
  tracking_number: string;
  shipping_carrier: string;
  estimated_delivery_date?: string;
}

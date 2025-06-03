export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      credit_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          doctor_id: string
          id: string
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          doctor_id: string
          id?: string
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          doctor_id?: string
          id?: string
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      doctors: {
        Row: {
          address: string
          city: string | null
          clinic_name: string | null
          created_at: string | null
          email: string | null
          gst_number: string
          id: string
          is_approved: boolean
          license_number: string | null
          name: string
          phone: string
          pincode: string | null
          rejection_reason: string | null
          specialization: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address: string
          city?: string | null
          clinic_name?: string | null
          created_at?: string | null
          email?: string | null
          gst_number: string
          id: string
          is_approved?: boolean
          license_number?: string | null
          name: string
          phone: string
          pincode?: string | null
          rejection_reason?: string | null
          specialization?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          city?: string | null
          clinic_name?: string | null
          created_at?: string | null
          email?: string | null
          gst_number?: string
          id?: string
          is_approved?: boolean
          license_number?: string | null
          name?: string
          phone?: string
          pincode?: string | null
          rejection_reason?: string | null
          specialization?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          doctor_id: string
          id: string
          invoice_date: string | null
          invoice_number: string
          order_id: string
          pdf_url: string | null
        }
        Insert: {
          doctor_id: string
          id?: string
          invoice_date?: string | null
          invoice_number: string
          order_id: string
          pdf_url?: string | null
        }
        Update: {
          doctor_id?: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string
          order_id?: string
          pdf_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_communications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          order_id: string | null
          read: boolean | null
          read_at: string | null
          recipient_id: string | null
          sender_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          order_id?: string | null
          read?: boolean | null
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          order_id?: string | null
          read?: boolean | null
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_communications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          price_per_unit: number
          product_id: string
          quantity: number
          total_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          price_per_unit: number
          product_id: string
          quantity: number
          total_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          price_per_unit?: number
          product_id?: string
          quantity?: number
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_notifications: {
        Row: {
          content: string | null
          id: string
          notification_type: string
          order_id: string | null
          recipient: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          content?: string | null
          id?: string
          notification_type: string
          order_id?: string | null
          recipient: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          content?: string | null
          id?: string
          notification_type?: string
          order_id?: string | null
          recipient?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          order_id: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          status: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          actual_delivery_date: string | null
          billing_address: string | null
          created_at: string | null
          discount_amount: number | null
          doctor_id: string
          estimated_delivery_date: string | null
          id: string
          invoice_generated: boolean | null
          invoice_number: string | null
          invoice_url: string | null
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          shipping_address: string | null
          shipping_carrier: string | null
          shipping_cost: number | null
          status: string
          tax_amount: number | null
          total_amount: number
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          billing_address?: string | null
          created_at?: string | null
          discount_amount?: number | null
          doctor_id: string
          estimated_delivery_date?: string | null
          id?: string
          invoice_generated?: boolean | null
          invoice_number?: string | null
          invoice_url?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          shipping_address?: string | null
          shipping_carrier?: string | null
          shipping_cost?: number | null
          status?: string
          tax_amount?: number | null
          total_amount: number
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          billing_address?: string | null
          created_at?: string | null
          discount_amount?: number | null
          doctor_id?: string
          estimated_delivery_date?: string | null
          id?: string
          invoice_generated?: boolean | null
          invoice_number?: string | null
          invoice_url?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          shipping_address?: string | null
          shipping_carrier?: string | null
          shipping_cost?: number | null
          status?: string
          tax_amount?: number | null
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          doctor_id: string
          id: string
          notes: string | null
          payment_date: string | null
        }
        Insert: {
          amount: number
          doctor_id: string
          id?: string
          notes?: string | null
          payment_date?: string | null
        }
        Update: {
          amount?: number
          doctor_id?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          stock: number
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price: number
          stock?: number
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          stock?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      return_items: {
        Row: {
          condition: string | null
          id: string
          price_per_unit: number
          product_id: string | null
          quantity: number
          reason: string | null
          return_id: string | null
          total_price: number
        }
        Insert: {
          condition?: string | null
          id?: string
          price_per_unit: number
          product_id?: string | null
          quantity: number
          reason?: string | null
          return_id?: string | null
          total_price: number
        }
        Update: {
          condition?: string | null
          id?: string
          price_per_unit?: number
          product_id?: string | null
          quantity?: number
          reason?: string | null
          return_id?: string | null
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_items_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "returns"
            referencedColumns: ["id"]
          },
        ]
      }
      returns: {
        Row: {
          amount: number
          created_at: string | null
          doctor_id: string | null
          id: string
          notes: string | null
          order_id: string | null
          processed_by: string | null
          reason: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          processed_by?: string | null
          reason: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          processed_by?: string | null
          reason?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "returns_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_order_communication: {
        Args: {
          p_order_id: string
          p_sender_id: string
          p_recipient_id: string
          p_message: string
        }
        Returns: string
      }
      ensure_doctor_exists: {
        Args: {
          p_user_id: string
          p_name?: string
          p_phone?: string
          p_address?: string
          p_gst_number?: string
          p_email?: string
          p_is_approved?: boolean
        }
        Returns: string
      }
      generate_invoice: {
        Args: { p_order_id: string }
        Returns: boolean
      }
      get_all_doctor_credits: {
        Args: Record<PropertyKey, never>
        Returns: {
          doctor_id: string
          doctor_name: string
          doctor_phone: string
          doctor_email: string
          total_credit: number
        }[]
      }
      get_all_orders: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          doctor_id: string
          total_amount: number
          status: string
          created_at: string
          updated_at: string
          doctor_name: string
          doctor_phone: string
          doctor_email: string
        }[]
      }
      get_all_orders_enhanced: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          doctor_id: string
          doctor_name: string
          doctor_phone: string
          doctor_email: string
          total_amount: number
          status: string
          created_at: string
          updated_at: string
          estimated_delivery_date: string
          actual_delivery_date: string
          tracking_number: string
          shipping_carrier: string
          payment_status: string
          invoice_number: string
          invoice_generated: boolean
          has_returns: boolean
        }[]
      }
      get_doctor_credit_summary: {
        Args: { p_doctor_id: string }
        Returns: Json
      }
      get_doctor_id_from_user: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_doctor_orders_enhanced: {
        Args: { p_doctor_id: string }
        Returns: {
          id: string
          total_amount: number
          status: string
          created_at: string
          updated_at: string
          estimated_delivery_date: string
          actual_delivery_date: string
          tracking_number: string
          shipping_carrier: string
          payment_status: string
          invoice_number: string
          invoice_url: string
          item_count: number
          has_returns: boolean
        }[]
      }
      get_order_details: {
        Args: { p_order_id: string }
        Returns: Json
      }
      mark_communication_as_read: {
        Args: { p_communication_id: string }
        Returns: boolean
      }
      process_return: {
        Args: {
          p_order_id: string
          p_doctor_id: string
          p_reason: string
          p_items: Json
          p_processed_by?: string
          p_notes?: string
        }
        Returns: string
      }
      record_order_notification: {
        Args: {
          p_order_id: string
          p_notification_type: string
          p_recipient: string
          p_content: string
          p_status?: string
        }
        Returns: string
      }
      reorder_previous_order: {
        Args: { p_order_id: string; p_doctor_id: string }
        Returns: string
      }
      setup_admin_rls: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      setup_admin_user: {
        Args: { p_user_id: string; p_email: string; p_name?: string }
        Returns: boolean
      }
      update_order_status: {
        Args: {
          p_order_id: string
          p_status: string
          p_notes?: string
          p_user_id?: string
        }
        Returns: boolean
      }
      update_return_status: {
        Args: {
          p_return_id: string
          p_status: string
          p_processed_by?: string
          p_notes?: string
        }
        Returns: boolean
      }
      update_shipping_info: {
        Args: {
          p_order_id: string
          p_tracking_number: string
          p_shipping_carrier: string
          p_estimated_delivery_date?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

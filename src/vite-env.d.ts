
/// <reference types="vite/client" />

// Define the available RPC functions for TypeScript
declare namespace RPCFunctions {
  type AvailableRPCFunctions = 
    | "add_order_communication" 
    | "generate_invoice" 
    | "get_all_doctor_credits" 
    | "get_all_orders" 
    | "get_all_orders_enhanced" 
    | "get_doctor_credit_summary" 
    | "get_doctor_orders_enhanced" 
    | "get_order_details" 
    | "mark_communication_as_read" 
    | "process_return" 
    | "record_doctor_payment" 
    | "record_order_notification" 
    | "reorder_previous_order" 
    | "run_sql_query"  // Add this missing function
    | "setup_admin_rls" 
    | "update_order_status" 
    | "update_return_status" 
    | "update_shipping_info"
    | "generate_invoice_number"; // Add this missing function
}

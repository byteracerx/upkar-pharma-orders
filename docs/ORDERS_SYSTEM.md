# Upkar Pharma Orders System Documentation

This document provides an overview of the comprehensive orders system implemented for Upkar Pharma.

## Table of Contents

1. [Database Schema](#database-schema)
2. [Order Statuses](#order-statuses)
3. [Order Tracking](#order-tracking)
4. [Invoicing](#invoicing)
5. [Returns System](#returns-system)
6. [Communication System](#communication-system)
7. [Notifications](#notifications)
8. [Doctor Features](#doctor-features)
9. [Admin Features](#admin-features)
10. [API Reference](#api-reference)

## Database Schema

The orders system uses the following tables:

- **orders**: Main table for order information
- **order_items**: Products included in each order
- **order_status_history**: History of status changes for each order
- **order_notifications**: Record of notifications sent for each order
- **order_communications**: Messages between doctors and admins
- **returns**: Return requests for orders
- **return_items**: Products included in each return request

### Orders Table

The orders table includes the following fields:

- `id`: Unique identifier for the order
- `doctor_id`: Reference to the doctor who placed the order
- `total_amount`: Total amount of the order
- `status`: Current status of the order
- `created_at`: When the order was created
- `updated_at`: When the order was last updated
- `shipping_address`: Shipping address for the order
- `billing_address`: Billing address for the order
- `payment_method`: Method of payment
- `payment_status`: Status of payment
- `notes`: Additional notes for the order
- `estimated_delivery_date`: When the order is expected to be delivered
- `actual_delivery_date`: When the order was actually delivered
- `tracking_number`: Shipping tracking number
- `shipping_carrier`: Shipping carrier
- `discount_amount`: Amount of discount applied
- `tax_amount`: Amount of tax applied
- `shipping_cost`: Cost of shipping
- `invoice_number`: Invoice number for the order
- `invoice_generated`: Whether an invoice has been generated
- `invoice_url`: URL to the generated invoice

## Order Statuses

Orders can have the following statuses:

- **pending**: Order has been placed but not yet processed
- **processing**: Order is being prepared for shipping
- **shipped**: Order has been shipped
- **delivered**: Order has been delivered
- **cancelled**: Order has been cancelled
- **return_initiated**: A return has been initiated for the order
- **returned**: Order has been returned

## Order Tracking

The system provides comprehensive order tracking features:

- Tracking number and shipping carrier information
- Estimated and actual delivery dates
- Status history with timestamps
- Ability to update shipping information
- Direct links to carrier tracking pages

## Invoicing

The system includes automatic invoice generation:

- Invoices are generated when an order is accepted or processed
- Each invoice has a unique invoice number
- Invoices can be downloaded by both doctors and admins
- Invoice generation is recorded in the order history

## Returns System

The system includes a complete returns management system:

- Doctors can initiate returns for delivered orders
- Returns can include all or specific items from an order
- Each return has a status (pending, approved, rejected, completed)
- Admins can approve or reject returns
- Return history is tracked and visible to both doctors and admins

## Communication System

The system includes a messaging system between doctors and admins:

- Messages are linked to specific orders
- Real-time chat-like interface
- Unread message indicators
- Message history is preserved

## Notifications

The system sends notifications for important events:

- Order status changes
- Shipping updates
- Return status changes
- Invoice generation
- New messages

## Doctor Features

Doctors have access to the following features:

- View order history with filtering and sorting
- Track current orders with detailed status information
- View and download invoices
- Initiate returns for delivered orders
- Communicate with admins about specific orders
- Reorder previous orders with a single click

## Admin Features

Admins have access to the following features:

- View and manage all orders
- Update order statuses
- Generate invoices
- Update shipping information
- Approve or reject returns
- Communicate with doctors about specific orders
- Filter and search orders by various criteria

## API Reference

### Order Service Functions

- `fetchDoctorOrders`: Get orders for a specific doctor
- `fetchOrderDetails`: Get detailed information about an order
- `fetchAllOrders`: Get all orders (admin only)
- `updateOrderStatus`: Update the status of an order
- `generateInvoice`: Generate an invoice for an order
- `notifyOrderStatusChange`: Send a notification about a status change
- `recordOrderNotification`: Record a notification in the database
- `addOrderCommunication`: Add a message between admin and doctor
- `markCommunicationAsRead`: Mark a message as read
- `processReturn`: Process a return request
- `updateReturnStatus`: Update the status of a return
- `reorderPreviousOrder`: Create a new order based on a previous one
- `updateShippingInfo`: Update shipping information for an order

### Database Functions

- `update_order_status`: Update order status with history tracking
- `get_order_details`: Get comprehensive order details
- `get_all_orders_enhanced`: Get all orders with essential information
- `get_doctor_orders_enhanced`: Get a doctor's order history
- `process_return`: Process a return request
- `add_order_communication`: Add a communication message
- `record_order_notification`: Record a notification
- `reorder_previous_order`: Reorder a previous order
- `generate_invoice_number`: Generate a unique invoice number

## Implementation Notes

- The system uses Supabase for database and authentication
- Real-time updates are implemented where appropriate
- The system is designed to be resilient to failures
- Fallback mechanisms are in place for all critical functions
- The UI is responsive and works on all device sizes
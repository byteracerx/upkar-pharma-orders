# Upkar Pharma Admin Panel

## Overview

The Upkar Pharma Admin Panel has been rebuilt to ensure that admins can only perform administrative functions and cannot place orders. This document provides instructions on how to use the updated admin panel.

## Key Features

### 1. Admin Restrictions

- Admins cannot place orders
- Clear warning messages are displayed when an admin views the cart
- Admin Panel is focused solely on administrative functions

### 2. Doctor Management

- Approve or decline doctor registrations
- View and manage doctor information
- Monitor doctor credit balances

### 3. Order Management

- View and change the status of all orders
- Generate invoices for orders
- Send notifications to doctors

### 4. Invoice Management

- Auto-generate PDF invoices when an order is approved
- Download invoices from the admin panel
- View invoice details

### 5. Product Management

- Add, edit, and delete products in the catalog
- Manage product categories and pricing

## How to Use

### Accessing the Admin Panel

1. Navigate to `/admin-login` to log in as an admin
2. Use your admin credentials to log in
3. You will be redirected to the admin dashboard

### Managing Doctors

1. Go to the "Doctors" section in the admin panel
2. Review pending doctor registrations
3. Approve or decline doctor registrations
4. View approved doctors and their information

### Managing Orders

1. Go to the "Orders" section in the admin panel
2. View all orders placed by doctors
3. Change the status of orders (pending, processing, delivered, cancelled)
4. Generate invoices for orders
5. Send WhatsApp notifications to doctors

### Managing Invoices

1. Go to the "Invoices" section in the admin panel
2. View all generated invoices
3. Download invoices as PDF files
4. View invoice details

### Managing Products

1. Go to the "Products" section in the admin panel
2. Add new products to the catalog
3. Edit existing product information
4. Delete products from the catalog

## Technical Implementation

### PDF Invoice Generation

- Uses jsPDF to create professional-looking invoices
- Includes all required fields (doctor name, address, GST number, etc.)
- Stores invoices in Supabase Storage

### WhatsApp Integration

- Uses Twilio's WhatsApp API
- Sends notifications when order status changes
- Sends notifications when invoices are generated

### Email Integration

- Uses Azure Communication Services
- Sends emails with invoice attachments
- Includes download links in emails

## Troubleshooting

### Common Issues

1. **Blank Screen**: If you see a blank screen, try clearing your browser cache and reloading the page.
2. **Invoice Generation Fails**: Make sure the Supabase storage bucket is properly configured.
3. **WhatsApp Notifications Not Sending**: Check the Twilio credentials in the environment variables.

### Support

For any issues or questions, please contact the development team at support@upkarpharma.com.

## Future Enhancements

1. Add more detailed reporting for admin users
2. Implement bulk operations for invoice generation and notifications
3. Add more filtering options for orders and invoices
4. Enhance the invoice template with more customization options
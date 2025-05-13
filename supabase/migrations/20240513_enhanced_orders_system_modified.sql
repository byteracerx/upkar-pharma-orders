-- Enhanced Orders System for Upkar Pharma (Modified version without auth schema dependencies)
-- This migration adds all the necessary tables and functions for a comprehensive order management system

-- 1. Enhance the orders table with additional fields
ALTER TABLE IF EXISTS public.orders 
ADD COLUMN IF NOT EXISTS shipping_address text,
ADD COLUMN IF NOT EXISTS billing_address text,
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS estimated_delivery_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS actual_delivery_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS tracking_number text,
ADD COLUMN IF NOT EXISTS shipping_carrier text,
ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_cost numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS invoice_number text,
ADD COLUMN IF NOT EXISTS invoice_generated boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS invoice_url text;

-- 2. Create order_status_history table to track status changes
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    status text NOT NULL,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Create order_notifications table to track notifications sent
CREATE TABLE IF NOT EXISTS public.order_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    notification_type text NOT NULL,
    recipient text NOT NULL,
    content text,
    sent_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'sent'
);

-- 4. Create returns table for handling returns
CREATE TABLE IF NOT EXISTS public.returns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE,
    reason text NOT NULL,
    status text DEFAULT 'pending',
    amount numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    processed_by uuid,
    notes text
);

-- 5. Create return_items table for tracking returned items
CREATE TABLE IF NOT EXISTS public.return_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id uuid REFERENCES public.returns(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    quantity integer NOT NULL,
    price_per_unit numeric NOT NULL,
    total_price numeric NOT NULL,
    reason text,
    condition text
);

-- 6. Create order_communications table for admin-doctor communications
CREATE TABLE IF NOT EXISTS public.order_communications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    sender_id uuid,
    recipient_id uuid,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    read boolean DEFAULT false,
    read_at timestamp with time zone
);

-- 7. Create function to update order status with history tracking
CREATE OR REPLACE FUNCTION public.update_order_status(
    p_order_id uuid,
    p_status text,
    p_notes text DEFAULT NULL,
    p_user_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old_status text;
BEGIN
    -- Get current status
    SELECT status INTO v_old_status FROM orders WHERE id = p_order_id;
    
    -- Update order status
    UPDATE orders 
    SET 
        status = p_status,
        updated_at = now()
    WHERE id = p_order_id;
    
    -- Record in history
    INSERT INTO order_status_history (
        order_id,
        status,
        notes,
        created_by
    ) VALUES (
        p_order_id,
        p_status,
        p_notes,
        p_user_id
    );
    
    -- If status changed to 'delivered', update actual delivery date
    IF p_status = 'delivered' THEN
        UPDATE orders
        SET actual_delivery_date = now()
        WHERE id = p_order_id;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- 8. Create function to get order details with all related information
CREATE OR REPLACE FUNCTION public.get_order_details(p_order_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result json;
BEGIN
    SELECT json_build_object(
        'order', row_to_json(o),
        'doctor', row_to_json(d),
        'items', (
            SELECT json_agg(row_to_json(i))
            FROM (
                SELECT oi.*, row_to_json(p) as product
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = o.id
            ) i
        ),
        'status_history', (
            SELECT json_agg(row_to_json(sh) ORDER BY sh.created_at DESC)
            FROM order_status_history sh
            WHERE sh.order_id = o.id
        ),
        'notifications', (
            SELECT json_agg(row_to_json(n) ORDER BY n.sent_at DESC)
            FROM order_notifications n
            WHERE n.order_id = o.id
        ),
        'communications', (
            SELECT json_agg(row_to_json(c) ORDER BY c.created_at DESC)
            FROM order_communications c
            WHERE c.order_id = o.id
        ),
        'returns', (
            SELECT json_agg(row_to_json(r))
            FROM (
                SELECT ret.*, (
                    SELECT json_agg(row_to_json(ri))
                    FROM return_items ri
                    WHERE ri.return_id = ret.id
                ) as items
                FROM returns ret
                WHERE ret.order_id = o.id
            ) r
        )
    ) INTO v_result
    FROM orders o
    LEFT JOIN doctors d ON o.doctor_id = d.id
    WHERE o.id = p_order_id;
    
    RETURN v_result;
END;
$$;

-- 9. Create function to get all orders with essential information
CREATE OR REPLACE FUNCTION public.get_all_orders_enhanced()
RETURNS TABLE (
    id uuid,
    doctor_id uuid,
    doctor_name text,
    doctor_phone text,
    doctor_email text,
    total_amount numeric,
    status text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    estimated_delivery_date timestamp with time zone,
    actual_delivery_date timestamp with time zone,
    tracking_number text,
    shipping_carrier text,
    payment_status text,
    invoice_number text,
    invoice_generated boolean,
    has_returns boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.doctor_id,
        d.name as doctor_name,
        d.phone as doctor_phone,
        d.email as doctor_email,
        o.total_amount,
        o.status,
        o.created_at,
        o.updated_at,
        o.estimated_delivery_date,
        o.actual_delivery_date,
        o.tracking_number,
        o.shipping_carrier,
        o.payment_status,
        o.invoice_number,
        o.invoice_generated,
        (EXISTS (SELECT 1 FROM returns r WHERE r.order_id = o.id)) as has_returns
    FROM 
        orders o
    LEFT JOIN 
        doctors d ON o.doctor_id = d.id
    ORDER BY 
        o.created_at DESC;
END;
$$;

-- 10. Create function to get doctor's order history with detailed information
CREATE OR REPLACE FUNCTION public.get_doctor_orders_enhanced(p_doctor_id uuid)
RETURNS TABLE (
    id uuid,
    total_amount numeric,
    status text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    estimated_delivery_date timestamp with time zone,
    actual_delivery_date timestamp with time zone,
    tracking_number text,
    shipping_carrier text,
    payment_status text,
    invoice_number text,
    invoice_url text,
    item_count bigint,
    has_returns boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.total_amount,
        o.status,
        o.created_at,
        o.updated_at,
        o.estimated_delivery_date,
        o.actual_delivery_date,
        o.tracking_number,
        o.shipping_carrier,
        o.payment_status,
        o.invoice_number,
        o.invoice_url,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count,
        (EXISTS (SELECT 1 FROM returns r WHERE r.order_id = o.id)) as has_returns
    FROM 
        orders o
    WHERE 
        o.doctor_id = p_doctor_id
    ORDER BY 
        o.created_at DESC;
END;
$$;

-- 11. Create function to process a return
CREATE OR REPLACE FUNCTION public.process_return(
    p_order_id uuid,
    p_doctor_id uuid,
    p_reason text,
    p_items json,
    p_processed_by uuid DEFAULT NULL,
    p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_return_id uuid;
    v_total_amount numeric := 0;
    v_item json;
BEGIN
    -- Create return record
    INSERT INTO returns (
        order_id,
        doctor_id,
        reason,
        status,
        amount,
        processed_by,
        notes
    ) VALUES (
        p_order_id,
        p_doctor_id,
        p_reason,
        'pending',
        0, -- Will update after calculating total
        p_processed_by,
        p_notes
    ) RETURNING id INTO v_return_id;
    
    -- Process each return item
    FOR v_item IN SELECT * FROM json_array_elements(p_items)
    LOOP
        INSERT INTO return_items (
            return_id,
            product_id,
            quantity,
            price_per_unit,
            total_price,
            reason,
            condition
        ) VALUES (
            v_return_id,
            (v_item->>'product_id')::uuid,
            (v_item->>'quantity')::integer,
            (v_item->>'price_per_unit')::numeric,
            (v_item->>'total_price')::numeric,
            v_item->>'reason',
            v_item->>'condition'
        );
        
        -- Add to total amount
        v_total_amount := v_total_amount + (v_item->>'total_price')::numeric;
    END LOOP;
    
    -- Update the total amount
    UPDATE returns
    SET amount = v_total_amount
    WHERE id = v_return_id;
    
    -- Add a status history entry for the order
    INSERT INTO order_status_history (
        order_id,
        status,
        notes,
        created_by
    ) VALUES (
        p_order_id,
        'return_initiated',
        'Return initiated for ' || v_total_amount || ' amount',
        p_processed_by
    );
    
    RETURN v_return_id;
END;
$$;

-- 12. Create function to add a communication message
CREATE OR REPLACE FUNCTION public.add_order_communication(
    p_order_id uuid,
    p_sender_id uuid,
    p_recipient_id uuid,
    p_message text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_communication_id uuid;
BEGIN
    INSERT INTO order_communications (
        order_id,
        sender_id,
        recipient_id,
        message
    ) VALUES (
        p_order_id,
        p_sender_id,
        p_recipient_id,
        p_message
    ) RETURNING id INTO v_communication_id;
    
    RETURN v_communication_id;
END;
$$;

-- 13. Create function to record a notification
CREATE OR REPLACE FUNCTION public.record_order_notification(
    p_order_id uuid,
    p_notification_type text,
    p_recipient text,
    p_content text,
    p_status text DEFAULT 'sent'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_notification_id uuid;
BEGIN
    INSERT INTO order_notifications (
        order_id,
        notification_type,
        recipient,
        content,
        status
    ) VALUES (
        p_order_id,
        p_notification_type,
        p_recipient,
        p_content,
        p_status
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- 14. Create function to reorder a previous order
CREATE OR REPLACE FUNCTION public.reorder_previous_order(
    p_order_id uuid,
    p_doctor_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_order_id uuid;
    v_total_amount numeric := 0;
    v_shipping_address text;
    v_billing_address text;
    v_payment_method text;
    v_notes text;
BEGIN
    -- Get addresses and payment method from previous order
    SELECT 
        shipping_address, 
        billing_address, 
        payment_method,
        notes
    INTO 
        v_shipping_address, 
        v_billing_address, 
        v_payment_method,
        v_notes
    FROM orders
    WHERE id = p_order_id;
    
    -- Create new order
    INSERT INTO orders (
        doctor_id,
        total_amount,
        status,
        shipping_address,
        billing_address,
        payment_method,
        payment_status,
        notes
    ) VALUES (
        p_doctor_id,
        0, -- Will update after adding items
        'pending',
        v_shipping_address,
        v_billing_address,
        v_payment_method,
        'pending',
        v_notes || ' (Reordered from order ' || p_order_id || ')'
    ) RETURNING id INTO v_new_order_id;
    
    -- Copy items from previous order
    INSERT INTO order_items (
        order_id,
        product_id,
        quantity,
        price_per_unit,
        total_price
    )
    SELECT
        v_new_order_id,
        product_id,
        quantity,
        price_per_unit,
        total_price
    FROM
        order_items
    WHERE
        order_id = p_order_id;
    
    -- Calculate total amount
    SELECT SUM(total_price) INTO v_total_amount
    FROM order_items
    WHERE order_id = v_new_order_id;
    
    -- Update order total
    UPDATE orders
    SET total_amount = v_total_amount
    WHERE id = v_new_order_id;
    
    -- Add a status history entry
    INSERT INTO order_status_history (
        order_id,
        status,
        notes
    ) VALUES (
        v_new_order_id,
        'pending',
        'Order created by reordering order ' || p_order_id
    );
    
    RETURN v_new_order_id;
END;
$$;

-- 15. Create function to update shipping information
CREATE OR REPLACE FUNCTION public.update_shipping_info(
    p_order_id uuid,
    p_tracking_number text,
    p_shipping_carrier text,
    p_estimated_delivery_date text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_estimated_date timestamp with time zone;
BEGIN
    -- Convert date string to timestamp if provided
    IF p_estimated_delivery_date IS NOT NULL AND p_estimated_delivery_date != '' THEN
        v_estimated_date := p_estimated_delivery_date::timestamp with time zone;
    END IF;
    
    -- Update shipping information
    UPDATE orders
    SET
        tracking_number = p_tracking_number,
        shipping_carrier = p_shipping_carrier,
        estimated_delivery_date = v_estimated_date,
        updated_at = now()
    WHERE id = p_order_id;
    
    -- Add a status history entry
    INSERT INTO order_status_history (
        order_id,
        status,
        notes
    ) VALUES (
        p_order_id,
        'shipping_updated',
        'Shipping information updated. Tracking: ' || p_tracking_number || ', Carrier: ' || p_shipping_carrier
    );
    
    -- If order is in pending or processing status, update to shipped
    UPDATE orders
    SET status = 'shipped'
    WHERE id = p_order_id AND status IN ('pending', 'processing');
    
    RETURN TRUE;
END;
$$;

-- 16. Create function to generate invoice
CREATE OR REPLACE FUNCTION public.generate_invoice(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invoice_number text;
    v_invoice_url text;
BEGIN
    -- Generate invoice number (simple implementation)
    v_invoice_number := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || 
                        substring(p_order_id::text, 1, 8);
    
    -- Generate invoice URL (placeholder)
    v_invoice_url := '/invoices/' || v_invoice_number || '.pdf';
    
    -- Update order with invoice information
    UPDATE orders
    SET
        invoice_number = v_invoice_number,
        invoice_generated = true,
        invoice_url = v_invoice_url,
        updated_at = now()
    WHERE id = p_order_id;
    
    -- Add a status history entry
    INSERT INTO order_status_history (
        order_id,
        status,
        notes
    ) VALUES (
        p_order_id,
        'invoice_generated',
        'Invoice generated: ' || v_invoice_number
    );
    
    RETURN TRUE;
END;
$$;

-- 17. Create function to update return status
CREATE OR REPLACE FUNCTION public.update_return_status(
    p_return_id uuid,
    p_status text,
    p_processed_by uuid DEFAULT NULL,
    p_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id uuid;
BEGIN
    -- Get the order ID
    SELECT order_id INTO v_order_id
    FROM returns
    WHERE id = p_return_id;
    
    -- Update return status
    UPDATE returns
    SET
        status = p_status,
        processed_by = p_processed_by,
        notes = CASE WHEN p_notes IS NOT NULL THEN 
                    COALESCE(notes || E'\n', '') || p_notes
                ELSE 
                    notes 
                END,
        updated_at = now()
    WHERE id = p_return_id;
    
    -- Add a status history entry for the order
    INSERT INTO order_status_history (
        order_id,
        status,
        notes,
        created_by
    ) VALUES (
        v_order_id,
        'return_' || p_status,
        'Return ' || p_status || ' for return ID: ' || p_return_id,
        p_processed_by
    );
    
    RETURN TRUE;
END;
$$;

-- 18. Create function to mark communication as read
CREATE OR REPLACE FUNCTION public.mark_communication_as_read(p_communication_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE order_communications
    SET
        read = true,
        read_at = now()
    WHERE id = p_communication_id AND read = false;
    
    RETURN FOUND;
END;
$$;
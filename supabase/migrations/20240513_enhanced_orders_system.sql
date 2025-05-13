-- Enhanced Orders System for Upkar Pharma
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
        (SELECT price FROM products WHERE id = product_id), -- Get current price
        quantity * (SELECT price FROM products WHERE id = product_id)
    FROM order_items
    WHERE order_id = p_order_id;
    
    -- Calculate total amount
    SELECT SUM(total_price) INTO v_total_amount
    FROM order_items
    WHERE order_id = v_new_order_id;
    
    -- Update order total
    UPDATE orders
    SET total_amount = v_total_amount
    WHERE id = v_new_order_id;
    
    -- Add status history entry
    INSERT INTO order_status_history (
        order_id,
        status,
        notes
    ) VALUES (
        v_new_order_id,
        'pending',
        'Order created by reordering previous order ' || p_order_id
    );
    
    RETURN v_new_order_id;
END;
$$;

-- 15. Create function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_prefix text := 'INV';
    v_year text := to_char(current_date, 'YY');
    v_month text := to_char(current_date, 'MM');
    v_count integer;
    v_invoice_number text;
BEGIN
    -- Get count of invoices for this month
    SELECT COUNT(*) + 1 INTO v_count
    FROM orders
    WHERE 
        invoice_number IS NOT NULL AND
        invoice_number LIKE v_prefix || v_year || v_month || '%';
    
    -- Format: INV-YYMM-XXXX (e.g., INV-2405-0001)
    v_invoice_number := v_prefix || '-' || v_year || v_month || '-' || lpad(v_count::text, 4, '0');
    
    RETURN v_invoice_number;
END;
$$;

-- 16. Create trigger to update order status history on status change
CREATE OR REPLACE FUNCTION public.order_status_change_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO order_status_history (
            order_id,
            status,
            notes
        ) VALUES (
            NEW.id,
            NEW.status,
            'Status changed from ' || OLD.status || ' to ' || NEW.status
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'order_status_change_trigger'
    ) THEN
        CREATE TRIGGER order_status_change_trigger
        AFTER UPDATE OF status ON public.orders
        FOR EACH ROW
        EXECUTE FUNCTION public.order_status_change_trigger();
    END IF;
END
$$;

-- 17. Create RLS policies for the new tables
-- Order Status History
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do anything with order status history"
ON public.order_status_history
FOR ALL
TO authenticated
USING (
    (SELECT is_admin FROM user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Doctors can view their own order status history"
ON public.order_status_history
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = order_id AND o.doctor_id = auth.uid()
    )
);

-- Order Notifications
ALTER TABLE public.order_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do anything with order notifications"
ON public.order_notifications
FOR ALL
TO authenticated
USING (
    (SELECT is_admin FROM user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Doctors can view their own order notifications"
ON public.order_notifications
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = order_id AND o.doctor_id = auth.uid()
    )
);

-- Returns
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do anything with returns"
ON public.returns
FOR ALL
TO authenticated
USING (
    (SELECT is_admin FROM user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Doctors can view and create their own returns"
ON public.returns
FOR SELECT
TO authenticated
USING (
    doctor_id = auth.uid()
);

CREATE POLICY "Doctors can insert their own returns"
ON public.returns
FOR INSERT
TO authenticated
WITH CHECK (
    doctor_id = auth.uid()
);

-- Return Items
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do anything with return items"
ON public.return_items
FOR ALL
TO authenticated
USING (
    (SELECT is_admin FROM user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Doctors can view their own return items"
ON public.return_items
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM returns r
        WHERE r.id = return_id AND r.doctor_id = auth.uid()
    )
);

CREATE POLICY "Doctors can insert their own return items"
ON public.return_items
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM returns r
        WHERE r.id = return_id AND r.doctor_id = auth.uid()
    )
);

-- Order Communications
ALTER TABLE public.order_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do anything with order communications"
ON public.order_communications
FOR ALL
TO authenticated
USING (
    (SELECT is_admin FROM user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view communications they're part of"
ON public.order_communications
FOR SELECT
TO authenticated
USING (
    sender_id = auth.uid() OR recipient_id = auth.uid()
);

CREATE POLICY "Users can insert communications they're sending"
ON public.order_communications
FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = auth.uid()
);

-- Update existing orders table RLS if needed
CREATE POLICY "Doctors can view their own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
    doctor_id = auth.uid() OR
    (SELECT is_admin FROM user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Doctors can insert their own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
    doctor_id = auth.uid() OR
    (SELECT is_admin FROM user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
    (SELECT is_admin FROM user_roles WHERE user_id = auth.uid())
);

-- 18. Create user_roles view if it doesn't exist
CREATE OR REPLACE VIEW public.user_roles AS
SELECT 
    id as user_id,
    (email = 'admin@upkar.com' OR user_metadata->>'role' = 'admin') as is_admin
FROM auth.users;
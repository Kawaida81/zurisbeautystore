SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."appointment_status" AS ENUM (
    'pending',
    'confirmed',
    'cancelled',
    'completed',
    'no_show'
);


ALTER TYPE "public"."appointment_status" OWNER TO "postgres";


CREATE TYPE "public"."notification_status" AS ENUM (
    'unread',
    'read',
    'archived'
);


ALTER TYPE "public"."notification_status" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'appointment',
    'sale',
    'inventory',
    'loyalty',
    'system'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE TYPE "public"."payment_method" AS ENUM (
    'cash',
    'card',
    'mobile_money',
    'bank_transfer'
);


ALTER TYPE "public"."payment_method" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."sale_type" AS ENUM (
    'service',
    'product',
    'combined'
);


ALTER TYPE "public"."sale_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'worker',
    'client'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_and_get_profile"("p_email" "text", "p_user_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_user json;
    v_profile json;
BEGIN
    -- Get user and profile data in a single query
    SELECT
        json_build_object(
            'user', json_build_object(
                'id', u.id,
                'email', u.email,
                'role', u.role,
                'is_active', u.is_active
            ),
            'profile', json_build_object(
                'id', p.id,
                'loyalty_points', p.loyalty_points,
                'total_visits', p.total_visits,
                'last_visit_date', p.last_visit_date
            )
        )
    INTO v_user
    FROM users u
    LEFT JOIN profiles p ON p.id = u.id
    WHERE (p_email IS NOT NULL AND u.email = p_email)
       OR (p_user_id IS NOT NULL AND u.id = p_user_id);

    RETURN v_user;
END;
$$;


ALTER FUNCTION "public"."auth_and_get_profile"("p_email" "text", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."award_loyalty_points"("p_client_id" "uuid", "p_amount" numeric, "p_reference_id" "uuid", "p_transaction_type" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
    v_points INTEGER;
    v_rule RECORD;
BEGIN
    -- Get applicable loyalty rule
    SELECT * INTO v_rule
    FROM loyalty_rules
    WHERE action_type = p_transaction_type
    AND minimum_spend <= p_amount
    AND is_active = true
    ORDER BY minimum_spend DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'No applicable loyalty rule found'
        );
    END IF;

    -- Calculate points
    v_points := FLOOR(p_amount / v_rule.minimum_spend)::INTEGER * v_rule.points;

    -- Record loyalty transaction
    INSERT INTO loyalty_transactions (
        client_id,
        points,
        transaction_type,
        reference_id,
        description
    ) VALUES (
        p_client_id,
        v_points,
        p_transaction_type,
        p_reference_id,
        format('Points earned for %s of $%s', p_transaction_type, p_amount)
    );

    -- Update client profile
    UPDATE profiles
    SET
        loyalty_points = loyalty_points + v_points,
        updated_at = NOW()
    WHERE id = p_client_id;

    RETURN jsonb_build_object(
        'success', true,
        'points_awarded', v_points,
        'new_total', (
            SELECT loyalty_points
            FROM profiles
            WHERE id = p_client_id
        )
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$_$;


ALTER FUNCTION "public"."award_loyalty_points"("p_client_id" "uuid", "p_amount" numeric, "p_reference_id" "uuid", "p_transaction_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_stock_level"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF NEW.stock_quantity <= NEW.reorder_point AND NEW.stock_quantity > 0 THEN
        INSERT INTO inventory_alerts (
            product_id,
            alert_type,
            message
        ) VALUES (
            NEW.id,
            'low_stock',
            format('Product "%s" is running low (Current stock: %s)', NEW.name, NEW.stock_quantity)
        );
    ELSIF NEW.stock_quantity = 0 THEN
        INSERT INTO inventory_alerts (
            product_id,
            alert_type,
            message
        ) VALUES (
            NEW.id,
            'out_of_stock',
            format('Product "%s" is out of stock', NEW.name)
        );
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_stock_level"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_appointment"("p_client_id" "uuid", "p_worker_id" "uuid", "p_service_id" "uuid", "p_appointment_date" timestamp with time zone, "p_time" "text", "p_notes" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_appointment_id UUID;
    v_service_name TEXT;
BEGIN
    -- Get service name
    SELECT name INTO v_service_name
    FROM services
    WHERE id = p_service_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Service not found'
        );
    END IF;

    -- Check if worker is available at the specified time
    IF EXISTS (
        SELECT 1 FROM appointments
        WHERE worker_id = p_worker_id
        AND appointment_date = p_appointment_date
        AND time = p_time
        AND status NOT IN ('cancelled', 'completed')
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Worker is not available at this time'
        );
    END IF;

    -- Create appointment
    INSERT INTO appointments (
        client_id,
        worker_id,
        service_id,
        service,
        appointment_date,
        time,
        notes
    ) VALUES (
        p_client_id,
        p_worker_id,
        p_service_id,
        v_service_name,
        p_appointment_date,
        p_time,
        p_notes
    ) RETURNING id INTO v_appointment_id;

    RETURN jsonb_build_object(
        'success', true,
        'appointment_id', v_appointment_id,
        'message', 'Appointment created successfully'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Error creating appointment',
        'details', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."create_appointment"("p_client_id" "uuid", "p_worker_id" "uuid", "p_service_id" "uuid", "p_appointment_date" timestamp with time zone, "p_time" "text", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_appointment_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Add notification logic here if needed
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_appointment_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_customer"("p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_phone" "text", "p_address" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  -- Check if email already exists
  IF EXISTS (SELECT 1 FROM customers WHERE email = p_email) THEN
    RAISE EXCEPTION 'A customer with this email already exists';
  END IF;

  -- Insert new customer
  INSERT INTO customers (
    first_name,
    last_name,
    email,
    phone,
    address,
    created_at,
    updated_at
  ) VALUES (
    p_first_name,
    p_last_name,
    p_email,
    p_phone,
    p_address,
    NOW(),
    NOW()
  ) RETURNING id INTO v_customer_id;

  RETURN v_customer_id;
END;
$$;


ALTER FUNCTION "public"."create_customer"("p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_phone" "text", "p_address" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_product"("p_name" "text", "p_description" "text", "p_price" numeric, "p_category_id" "uuid", "p_stock_quantity" integer, "p_reorder_point" integer, "p_image_url" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_product_id UUID;
BEGIN
    INSERT INTO products (
        name,
        description,
        price,
        category_id,
        stock_quantity,
        reorder_point,
        image_url,
        created_at,
        updated_at
    ) VALUES (
        p_name,
        p_description,
        p_price,
        p_category_id,
        p_stock_quantity,
        p_reorder_point,
        p_image_url,
        NOW(),
        NOW()
    ) RETURNING id INTO v_product_id;

    -- Create low stock alert if initial stock is below reorder point
    IF p_stock_quantity <= p_reorder_point THEN
        INSERT INTO inventory_alerts (
            product_id,
            alert_type,
            message
        ) VALUES (
            v_product_id,
            CASE
                WHEN p_stock_quantity = 0 THEN 'out_of_stock'
                ELSE 'low_stock'
            END,
            format('Product "%s" is running low on stock. Current quantity: %s', p_name, p_stock_quantity)
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'product_id', v_product_id,
        'message', 'Product created successfully'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Error creating product',
        'details', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."create_product"("p_name" "text", "p_description" "text", "p_price" numeric, "p_category_id" "uuid", "p_stock_quantity" integer, "p_reorder_point" integer, "p_image_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_service"("p_name" "text", "p_description" "text", "p_category" "text", "p_duration" integer, "p_price" numeric, "p_is_active" boolean DEFAULT true) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_service_id UUID;
BEGIN
    INSERT INTO services (
        name,
        description,
        category,
        duration,
        price,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        p_name,
        p_description,
        p_category,
        p_duration,
        p_price,
        p_is_active,
        NOW(),
        NOW()
    ) RETURNING id INTO v_service_id;

    RETURN jsonb_build_object(
        'success', true,
        'service_id', v_service_id,
        'message', 'Service created successfully'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Error creating service',
        'details', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."create_service"("p_name" "text", "p_description" "text", "p_category" "text", "p_duration" integer, "p_price" numeric, "p_is_active" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_product_stock"("p_product_id" "uuid", "p_quantity" integer) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_current_stock INTEGER;
    v_product_name TEXT;
    v_result JSONB;
BEGIN
    -- Get current product info
    SELECT name, stock_quantity
    INTO v_product_name, v_current_stock
    FROM products
    WHERE id = p_product_id;

    -- Check if product exists
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Product not found',
            'details', format('Product with ID %s does not exist', p_product_id)
        );
    END IF;

    -- Check if there's enough stock
    IF v_current_stock < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', format('Insufficient stock for product "%s"', v_product_name),
            'details', format('Available: %s, Requested: %s', v_current_stock, p_quantity),
            'current_stock', v_current_stock
        );
    END IF;

    -- Update stock
    UPDATE products
    SET
        stock_quantity = stock_quantity - p_quantity,
        updated_at = NOW()
    WHERE id = p_product_id
    RETURNING stock_quantity INTO v_current_stock;

    -- Create low stock alert if needed
    IF v_current_stock <= (
        SELECT reorder_point
        FROM products
        WHERE id = p_product_id
    ) THEN
        INSERT INTO inventory_alerts (
            product_id,
            alert_type,
            message
        ) VALUES (
            p_product_id,
            CASE
                WHEN v_current_stock = 0 THEN 'out_of_stock'
                ELSE 'low_stock'
            END,
            CASE
                WHEN v_current_stock = 0
                THEN format('Product "%s" is out of stock', v_product_name)
                ELSE format('Product "%s" is running low (Current stock: %s)', v_product_name, v_current_stock)
            END
        );
    END IF;

    -- Return success response
    RETURN jsonb_build_object(
        'success', true,
        'message', format('Successfully updated stock for "%s"', v_product_name),
        'new_stock_quantity', v_current_stock
    );

EXCEPTION WHEN OTHERS THEN
    -- Return error response
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Error updating product stock',
        'details', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."decrement_product_stock"("p_product_id" "uuid", "p_quantity" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_customer"("p_customer_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check if customer has any orders
  IF EXISTS (SELECT 1 FROM orders WHERE customer_id = p_customer_id) THEN
    RAISE EXCEPTION 'Cannot delete customer with existing orders';
  END IF;

  -- Delete customer
  DELETE FROM customers WHERE id = p_customer_id;

  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."delete_customer"("p_customer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_product"("p_product_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check if product exists
    IF NOT EXISTS (SELECT 1 FROM products WHERE id = p_product_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Product not found'
        );
    END IF;

    -- Delete related inventory alerts
    DELETE FROM inventory_alerts WHERE product_id = p_product_id;

    -- Delete the product
    DELETE FROM products WHERE id = p_product_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Product deleted successfully'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Error deleting product',
        'details', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."delete_product"("p_product_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_service"("p_service_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check if service exists
    IF NOT EXISTS (SELECT 1 FROM services WHERE id = p_service_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Service not found'
        );
    END IF;

    -- Check if service is used in any appointments
    IF EXISTS (SELECT 1 FROM appointments WHERE service_id = p_service_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Cannot delete service as it is used in appointments'
        );
    END IF;

    -- Delete the service
    DELETE FROM services WHERE id = p_service_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Service deleted successfully'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Error deleting service',
        'details', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."delete_service"("p_service_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_client_profile"("p_client_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_profile JSONB;
    v_client_profile JSONB;
    v_preferred_worker JSONB;
    v_upcoming_appointments JSONB;
    v_recent_services JSONB;
BEGIN
    -- Get user profile data
    SELECT jsonb_build_object(
        'id', u.id,
        'email', u.email,
        'full_name', u.full_name,
        'phone', u.phone,
        'role', u.role,
        'is_active', u.is_active,
        'created_at', u.created_at
    )
    INTO v_profile
    FROM public.users u
    WHERE u.id = p_client_id;

    -- If no user found, return null
    IF v_profile IS NULL THEN
        RETURN NULL;
    END IF;

    -- Get client profile data
    SELECT jsonb_build_object(
        'id', p.id,
        'preferred_contact', COALESCE(p.preferred_contact, 'email'),
        'preferred_worker_id', p.preferred_worker_id,
        'last_visit_date', p.last_visit_date,
        'total_visits', COALESCE(p.total_visits, 0),
        'total_spent', COALESCE(p.total_spent, 0),
        'loyalty_points', COALESCE(p.loyalty_points, 0),
        'created_at', p.created_at,
        'updated_at', p.updated_at
    )
    INTO v_client_profile
    FROM public.profiles p
    WHERE p.id = p_client_id;

    -- If no profile found, create one
    IF v_client_profile IS NULL THEN
        INSERT INTO public.profiles (
            id,
            preferred_contact,
            total_visits,
            total_spent,
            loyalty_points,
            created_at,
            updated_at
        ) VALUES (
            p_client_id,
            'email',
            0,
            0,
            0,
            NOW(),
            NOW()
        )
        RETURNING jsonb_build_object(
            'id', id,
            'preferred_contact', preferred_contact,
            'preferred_worker_id', preferred_worker_id,
            'last_visit_date', last_visit_date,
            'total_visits', total_visits,
            'total_spent', total_spent,
            'loyalty_points', loyalty_points,
            'created_at', created_at,
            'updated_at', updated_at
        ) INTO v_client_profile;
    END IF;

    -- Get preferred worker data if exists
    IF v_client_profile->>'preferred_worker_id' IS NOT NULL THEN
        SELECT jsonb_build_object(
            'id', u.id,
            'full_name', u.full_name,
            'email', u.email
        )
        INTO v_preferred_worker
        FROM public.users u
        WHERE u.id = (v_client_profile->>'preferred_worker_id')::UUID;
    END IF;

    -- Get upcoming appointments
    SELECT jsonb_agg(a)
    INTO v_upcoming_appointments
    FROM (
        SELECT a.*
        FROM public.appointments a
        WHERE a.client_id = p_client_id
        AND a.appointment_date >= CURRENT_DATE
        AND a.status = 'confirmed'
        ORDER BY a.appointment_date ASC
        LIMIT 5
    ) a;

    -- Get recent services
    SELECT jsonb_agg(s)
    INTO v_recent_services
    FROM (
        SELECT s.*
        FROM public.appointments a
        JOIN public.services s ON s.id = a.service_id
        WHERE a.client_id = p_client_id
        AND a.status = 'completed'
        ORDER BY a.appointment_date DESC
        LIMIT 5
    ) s;

    -- Combine all data and ensure we return a valid structure even if some parts are null
    RETURN jsonb_build_object(
        'profile', v_profile || jsonb_build_object(
            'client_profile', v_client_profile,
            'preferred_worker', COALESCE(v_preferred_worker, NULL),
            'upcoming_appointments', COALESCE(v_upcoming_appointments, '[]'::jsonb),
            'recent_services', COALESCE(v_recent_services, '[]'::jsonb)
        )
    );
END;
$$;


ALTER FUNCTION "public"."get_client_profile"("p_client_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_customer"("p_customer_id" "uuid") RETURNS TABLE("id" "uuid", "first_name" "text", "last_name" "text", "email" "text", "phone" "text", "address" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "total_orders" integer, "total_spent" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.address,
    c.created_at,
    c.updated_at,
    COALESCE(COUNT(o.id), 0)::INTEGER as total_orders,
    COALESCE(SUM(o.total_amount), 0)::DECIMAL(10,2) as total_spent
  FROM customers c
  LEFT JOIN orders o ON c.id = o.customer_id
  WHERE c.id = p_customer_id
  GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.address, c.created_at, c.updated_at;
END;
$$;


ALTER FUNCTION "public"."get_customer"("p_customer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_daily_profits"("p_start_date" "date" DEFAULT (CURRENT_DATE - '30 days'::interval), "p_end_date" "date" DEFAULT CURRENT_DATE) RETURNS TABLE("date" "date", "total_revenue" numeric, "total_cost" numeric, "profit" numeric, "order_count" integer, "average_order_value" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  WITH daily_stats AS (
    SELECT
      DATE(o.created_at) as date,
      SUM(o.total_amount) as total_revenue,
      COUNT(*) as order_count,
      SUM(o.total_amount) / COUNT(*) as average_order_value,
      -- Assuming a 30% cost on products and services
      SUM(o.total_amount) * 0.7 as total_cost
    FROM orders o
    WHERE DATE(o.created_at) BETWEEN p_start_date AND p_end_date
    GROUP BY DATE(o.created_at)
  )
  SELECT
    ds.date,
    ds.total_revenue,
    ds.total_cost,
    (ds.total_revenue - ds.total_cost) as profit,
    ds.order_count,
    ds.average_order_value
  FROM daily_stats ds
  ORDER BY ds.date DESC;
END;
$$;


ALTER FUNCTION "public"."get_daily_profits"("p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_inventory_items"("p_category_id" "uuid" DEFAULT NULL::"uuid", "p_status" "text" DEFAULT NULL::"text", "p_search" "text" DEFAULT NULL::"text", "p_page" integer DEFAULT 1, "p_limit" integer DEFAULT 10) RETURNS TABLE("id" "uuid", "name" "text", "description" "text", "category_id" "uuid", "category_name" "text", "price" numeric, "stock_quantity" integer, "reorder_point" integer, "status" "text", "last_restock_date" timestamp with time zone, "total_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  WITH inventory AS (
    SELECT
      p.id,
      p.name,
      p.description,
      p.category_id,
      pc.name as category_name,
      p.price,
      p.stock_quantity,
      p.reorder_point,
      CASE
        WHEN p.stock_quantity = 0 THEN 'out_of_stock'
        WHEN p.stock_quantity <= p.reorder_point THEN 'low_stock'
        ELSE 'in_stock'
      END as status,
      p.last_restock_date,
      COUNT(*) OVER() as total_count
    FROM products p
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    WHERE
      (p_category_id IS NULL OR p.category_id = p_category_id) AND
      (p_status IS NULL OR
        CASE
          WHEN p.stock_quantity = 0 THEN 'out_of_stock'
          WHEN p.stock_quantity <= p.reorder_point THEN 'low_stock'
          ELSE 'in_stock'
        END = p_status) AND
      (p_search IS NULL OR
        p.name ILIKE '%' || p_search || '%' OR
        p.description ILIKE '%' || p_search || '%')
    ORDER BY
      CASE
        WHEN p.stock_quantity <= p.reorder_point THEN 0
        ELSE 1
      END,
      p.name ASC
  )
  SELECT *
  FROM inventory
  LIMIT p_limit
  OFFSET (p_page - 1) * p_limit;
END;
$$;


ALTER FUNCTION "public"."get_inventory_items"("p_category_id" "uuid", "p_status" "text", "p_search" "text", "p_page" integer, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_low_stock_alerts"("p_category_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("id" "uuid", "name" "text", "category_id" "uuid", "category_name" "text", "stock_quantity" integer, "reorder_point" integer, "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.category_id,
    pc.name as category_name,
    p.stock_quantity,
    p.reorder_point,
    CASE
      WHEN p.stock_quantity = 0 THEN 'out_of_stock'
      WHEN p.stock_quantity <= p.reorder_point THEN 'low_stock'
      ELSE 'in_stock'
    END as status
  FROM products p
  LEFT JOIN product_categories pc ON p.category_id = pc.id
  WHERE
    (p_category_id IS NULL OR p.category_id = p_category_id) AND
    p.stock_quantity <= p.reorder_point
  ORDER BY
    p.stock_quantity = 0 DESC,
    p.stock_quantity ASC,
    p.name ASC;
END;
$$;


ALTER FUNCTION "public"."get_low_stock_alerts"("p_category_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_monthly_profits"("p_start_date" "date" DEFAULT (CURRENT_DATE - '1 year'::interval), "p_end_date" "date" DEFAULT CURRENT_DATE) RETURNS TABLE("month" "date", "total_revenue" numeric, "total_cost" numeric, "profit" numeric, "order_count" integer, "average_order_value" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  WITH monthly_stats AS (
    SELECT
      DATE_TRUNC('month', o.created_at)::DATE as month,
      SUM(o.total_amount) as total_revenue,
      COUNT(*) as order_count,
      SUM(o.total_amount) / COUNT(*) as average_order_value,
      -- Assuming a 30% cost on products and services
      SUM(o.total_amount) * 0.7 as total_cost
    FROM orders o
    WHERE DATE(o.created_at) BETWEEN p_start_date AND p_end_date
    GROUP BY DATE_TRUNC('month', o.created_at)::DATE
  )
  SELECT
    ms.month,
    ms.total_revenue,
    ms.total_cost,
    (ms.total_revenue - ms.total_cost) as profit,
    ms.order_count,
    ms.average_order_value
  FROM monthly_stats ms
  ORDER BY ms.month DESC;
END;
$$;


ALTER FUNCTION "public"."get_monthly_profits"("p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_product_details"("p_product_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'description', p.description,
        'price', p.price,
        'stock_quantity', p.stock_quantity,
        'reorder_point', p.reorder_point,
        'image_url', p.image_url,
        'created_at', p.created_at,
        'updated_at', p.updated_at,
        'category', jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'description', c.description
        )
    ) INTO v_result
    FROM products p
    LEFT JOIN product_categories c ON c.id = p.category_id
    WHERE p.id = p_product_id;

    IF v_result IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Product not found'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'data', v_result
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Error retrieving product details',
        'details', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."get_product_details"("p_product_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_profit_by_category"("p_start_date" "date" DEFAULT (CURRENT_DATE - '30 days'::interval), "p_end_date" "date" DEFAULT CURRENT_DATE) RETURNS TABLE("category" "text", "total_revenue" numeric, "total_cost" numeric, "profit" numeric, "order_count" integer, "average_order_value" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  WITH category_stats AS (
    SELECT
      CASE
        WHEN oi.product_id IS NOT NULL THEN 'Products'
        WHEN oi.service_id IS NOT NULL THEN 'Services'
      END as category,
      SUM(oi.quantity * oi.unit_price) as total_revenue,
      COUNT(DISTINCT o.id) as order_count,
      SUM(oi.quantity * oi.unit_price) / COUNT(DISTINCT o.id) as average_order_value,
      -- Assuming a 30% cost on products and services
      SUM(oi.quantity * oi.unit_price) * 0.7 as total_cost
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE DATE(o.created_at) BETWEEN p_start_date AND p_end_date
    GROUP BY
      CASE
        WHEN oi.product_id IS NOT NULL THEN 'Products'
        WHEN oi.service_id IS NOT NULL THEN 'Services'
      END
  )
  SELECT
    cs.category,
    cs.total_revenue,
    cs.total_cost,
    (cs.total_revenue - cs.total_cost) as profit,
    cs.order_count,
    cs.average_order_value
  FROM category_stats cs
  ORDER BY cs.total_revenue DESC;
END;
$$;


ALTER FUNCTION "public"."get_profit_by_category"("p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_stock_history"("p_product_id" "uuid" DEFAULT NULL::"uuid", "p_start_date" timestamp with time zone DEFAULT (CURRENT_DATE - '30 days'::interval), "p_end_date" timestamp with time zone DEFAULT CURRENT_DATE, "p_page" integer DEFAULT 1, "p_limit" integer DEFAULT 10) RETURNS TABLE("id" "uuid", "product_id" "uuid", "product_name" "text", "previous_quantity" integer, "adjustment_quantity" integer, "new_quantity" integer, "adjustment_type" "text", "notes" "text", "created_at" timestamp with time zone, "total_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  WITH history AS (
    SELECT
      sa.id,
      sa.product_id,
      p.name as product_name,
      sa.previous_quantity,
      sa.adjustment_quantity,
      sa.new_quantity,
      sa.adjustment_type,
      sa.notes,
      sa.created_at,
      COUNT(*) OVER() as total_count
    FROM stock_adjustments sa
    JOIN products p ON sa.product_id = p.id
    WHERE
      (p_product_id IS NULL OR sa.product_id = p_product_id) AND
      sa.created_at BETWEEN p_start_date AND p_end_date
    ORDER BY sa.created_at DESC
  )
  SELECT *
  FROM history
  LIMIT p_limit
  OFFSET (p_page - 1) * p_limit;
END;
$$;


ALTER FUNCTION "public"."get_stock_history"("p_product_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_page" integer, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_top_performing_items"("p_start_date" "date" DEFAULT (CURRENT_DATE - '30 days'::interval), "p_end_date" "date" DEFAULT CURRENT_DATE, "p_limit" integer DEFAULT 10) RETURNS TABLE("item_id" "uuid", "item_name" "text", "item_type" "text", "total_revenue" numeric, "total_cost" numeric, "profit" numeric, "units_sold" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  WITH item_stats AS (
    SELECT
      COALESCE(p.id, s.id) as item_id,
      COALESCE(p.name, s.name) as item_name,
      CASE
        WHEN p.id IS NOT NULL THEN 'Product'
        WHEN s.id IS NOT NULL THEN 'Service'
      END as item_type,
      SUM(oi.quantity * oi.unit_price) as total_revenue,
      SUM(oi.quantity * oi.unit_price) * 0.7 as total_cost,
      SUM(oi.quantity) as units_sold
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    LEFT JOIN services s ON oi.service_id = s.id
    WHERE DATE(o.created_at) BETWEEN p_start_date AND p_end_date
    GROUP BY
      COALESCE(p.id, s.id),
      COALESCE(p.name, s.name),
      CASE
        WHEN p.id IS NOT NULL THEN 'Product'
        WHEN s.id IS NOT NULL THEN 'Service'
      END
  )
  SELECT
    item_id,
    item_name,
    item_type,
    total_revenue,
    total_cost,
    (total_revenue - total_cost) as profit,
    units_sold
  FROM item_stats
  ORDER BY (total_revenue - total_cost) DESC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_top_performing_items"("p_start_date" "date", "p_end_date" "date", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_notifications_count"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM notifications
    WHERE user_id = p_user_id
    AND status = 'unread';

    RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."get_unread_notifications_count"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"("user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role
    FROM public.users
    WHERE id = user_id;
    RETURN user_role;
END;
$$;


ALTER FUNCTION "public"."get_user_role"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role_and_profile"("user_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    result json;
begin
    select json_build_object(
        'role', u.role,
        'profile', json_build_object(
            'id', u.id,
            'is_active', u.is_active,
            'email', u.email,
            'full_name', u.full_name,
            'created_at', u.created_at
        )
    )
    into result
    from users u
    where u.id = user_id;

    return result;
end;
$$;


ALTER FUNCTION "public"."get_user_role_and_profile"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_worker_availability"("p_worker_id" "uuid", "p_date" "date") RETURNS TABLE("time_slot" "text", "is_available" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    WITH time_slots AS (
        SELECT unnest(ARRAY[
            '09:00', '10:00', '11:00', '12:00',
            '13:00', '14:00', '15:00', '16:00',
            '17:00'
        ]) AS time_slot
    )
    SELECT
        ts.time_slot,
        NOT EXISTS (
            SELECT 1
            FROM appointments a
            WHERE a.worker_id = p_worker_id
            AND DATE(a.appointment_date) = p_date
            AND a.time = ts.time_slot
            AND a.status NOT IN ('cancelled', 'completed')
        ) AS is_available
    FROM time_slots ts
    ORDER BY ts.time_slot;
END;
$$;


ALTER FUNCTION "public"."get_worker_availability"("p_worker_id" "uuid", "p_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_failed_login"("p_email" "text", "p_ip_address" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_attempts INT;
BEGIN
    -- Update or insert attempt record
    INSERT INTO auth_attempts (email, ip_address)
    VALUES (p_email, p_ip_address)
    ON CONFLICT (email) DO UPDATE
    SET
        attempt_count = auth_attempts.attempt_count + 1,
        last_attempt = NOW(),
        updated_at = NOW(),
        is_blocked = CASE
            WHEN auth_attempts.attempt_count >= 5 THEN TRUE
            ELSE FALSE
        END
    RETURNING attempt_count INTO v_attempts;

    RETURN json_build_object(
        'is_blocked', v_attempts >= 5,
        'attempts', v_attempts,
        'cooldown_minutes', CASE
            WHEN v_attempts >= 5 THEN 30
            WHEN v_attempts >= 3 THEN 15
            ELSE 0
        END
    );
END;
$$;


ALTER FUNCTION "public"."handle_failed_login"("p_email" "text", "p_ip_address" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  role_val public.user_role;
BEGIN
  -- Safely cast role to enum type
  BEGIN
    role_val := COALESCE(
      (new.raw_user_meta_data->>'role')::public.user_role,
      'client'::public.user_role
    );
  EXCEPTION WHEN OTHERS THEN
    role_val := 'client'::public.user_role;
  END;

  -- Insert into public.users table with error handling
  BEGIN
    INSERT INTO public.users (id, email, full_name, role, phone, is_active)
    VALUES (
      new.id,
      new.email,
      new.raw_user_meta_data->>'full_name',
      role_val,
      new.raw_user_meta_data->>'phone',
      COALESCE((new.raw_user_meta_data->>'is_active')::boolean, true)
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating user record: %', SQLERRM;
    RETURN null;
  END;

  -- Insert into public.profiles table with error handling
  BEGIN
    INSERT INTO public.profiles (
      id,
      loyalty_points,
      total_spent,
      total_visits,
      preferred_contact
    )
    VALUES (
      new.id,
      0,
      0,
      0,
      'email'
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating profile record: %', SQLERRM;
    -- Clean up the user record if profile creation fails
    DELETE FROM public.users WHERE id = new.id;
    RETURN null;
  END;

  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_product_stock"("p_product_id" "uuid", "p_quantity" integer) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_product_name TEXT;
    v_new_stock INTEGER;
    v_result JSONB;
BEGIN
    -- Get product info
    SELECT name
    INTO v_product_name
    FROM products
    WHERE id = p_product_id;

    -- Check if product exists
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Product not found',
            'details', format('Product with ID %s does not exist', p_product_id)
        );
    END IF;

    -- Update stock
    UPDATE products
    SET
        stock_quantity = stock_quantity + p_quantity,
        updated_at = NOW()
    WHERE id = p_product_id
    RETURNING stock_quantity INTO v_new_stock;

    -- Resolve any existing low stock alerts
    UPDATE inventory_alerts
    SET
        is_resolved = true,
        resolved_at = NOW(),
        updated_at = NOW()
    WHERE product_id = p_product_id
    AND alert_type IN ('low_stock', 'out_of_stock')
    AND is_resolved = false;

    -- Return success response
    RETURN jsonb_build_object(
        'success', true,
        'message', format('Successfully updated stock for "%s"', v_product_name),
        'new_stock_quantity', v_new_stock
    );

EXCEPTION WHEN OTHERS THEN
    -- Return error response
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Error updating product stock',
        'details', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."increment_product_stock"("p_product_id" "uuid", "p_quantity" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_customers"("p_search" "text" DEFAULT NULL::"text", "p_sort_by" "text" DEFAULT 'created_at'::"text", "p_sort_order" "text" DEFAULT 'desc'::"text") RETURNS TABLE("id" "uuid", "first_name" "text", "last_name" "text", "email" "text", "phone" "text", "address" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "total_orders" integer, "total_spent" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.address,
    c.created_at,
    c.updated_at,
    COALESCE(COUNT(o.id), 0)::INTEGER as total_orders,
    COALESCE(SUM(o.total_amount), 0)::DECIMAL(10,2) as total_spent
  FROM customers c
  LEFT JOIN orders o ON c.id = o.customer_id
  WHERE
    CASE
      WHEN p_search IS NOT NULL THEN
        c.first_name ILIKE '%' || p_search || '%' OR
        c.last_name ILIKE '%' || p_search || '%' OR
        c.email ILIKE '%' || p_search || '%' OR
        c.phone ILIKE '%' || p_search || '%'
      ELSE true
    END
  GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.address, c.created_at, c.updated_at
  ORDER BY
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN c.created_at END DESC,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN c.created_at END ASC,
    CASE WHEN p_sort_by = 'name' AND p_sort_order = 'desc' THEN c.first_name END DESC,
    CASE WHEN p_sort_by = 'name' AND p_sort_order = 'asc' THEN c.first_name END ASC,
    CASE WHEN p_sort_by = 'total_orders' AND p_sort_order = 'desc' THEN COUNT(o.id) END DESC,
    CASE WHEN p_sort_by = 'total_orders' AND p_sort_order = 'asc' THEN COUNT(o.id) END ASC,
    CASE WHEN p_sort_by = 'total_spent' AND p_sort_order = 'desc' THEN SUM(o.total_amount) END DESC,
    CASE WHEN p_sort_by = 'total_spent' AND p_sort_order = 'asc' THEN SUM(o.total_amount) END ASC;
END;
$$;


ALTER FUNCTION "public"."list_customers"("p_search" "text", "p_sort_by" "text", "p_sort_order" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_products"("p_category_id" "uuid" DEFAULT NULL::"uuid", "p_search_term" "text" DEFAULT NULL::"text", "p_low_stock_only" boolean DEFAULT false, "p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 10) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_total_count INTEGER;
    v_results JSONB;
BEGIN
    -- Calculate total count for pagination
    SELECT COUNT(*) INTO v_total_count
    FROM products p
    WHERE (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_search_term IS NULL OR
         p.name ILIKE '%' || p_search_term || '%' OR
         p.description ILIKE '%' || p_search_term || '%')
    AND (NOT p_low_stock_only OR p.stock_quantity <= p.reorder_point);

    -- Get paginated results
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'description', p.description,
            'price', p.price,
            'stock_quantity', p.stock_quantity,
            'reorder_point', p.reorder_point,
            'image_url', p.image_url,
            'category', jsonb_build_object(
                'id', c.id,
                'name', c.name
            )
        )
    ) INTO v_results
    FROM products p
    LEFT JOIN product_categories c ON c.id = p.category_id
    WHERE (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_search_term IS NULL OR
         p.name ILIKE '%' || p_search_term || '%' OR
         p.description ILIKE '%' || p_search_term || '%')
    AND (NOT p_low_stock_only OR p.stock_quantity <= p.reorder_point)
    ORDER BY p.created_at DESC
    LIMIT p_page_size
    OFFSET (p_page - 1) * p_page_size;

    RETURN jsonb_build_object(
        'success', true,
        'data', COALESCE(v_results, '[]'::jsonb),
        'pagination', jsonb_build_object(
            'total_count', v_total_count,
            'page', p_page,
            'page_size', p_page_size,
            'total_pages', CEIL(v_total_count::NUMERIC / p_page_size)
        )
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Error retrieving products',
        'details', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."list_products"("p_category_id" "uuid", "p_search_term" "text", "p_low_stock_only" boolean, "p_page" integer, "p_page_size" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_services"("p_category" "text" DEFAULT NULL::"text", "p_search_term" "text" DEFAULT NULL::"text", "p_active_only" boolean DEFAULT false, "p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 10) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_total_count INTEGER;
    v_results JSONB;
BEGIN
    -- Calculate total count for pagination
    SELECT COUNT(*) INTO v_total_count
    FROM services s
    WHERE (p_category IS NULL OR s.category = p_category)
    AND (p_search_term IS NULL OR
         s.name ILIKE '%' || p_search_term || '%' OR
         s.description ILIKE '%' || p_search_term || '%')
    AND (NOT p_active_only OR s.is_active = true);

    -- Get paginated results
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', s.id,
            'name', s.name,
            'description', s.description,
            'category', s.category,
            'duration', s.duration,
            'price', s.price,
            'is_active', s.is_active,
            'created_at', s.created_at,
            'updated_at', s.updated_at
        )
    ) INTO v_results
    FROM services s
    WHERE (p_category IS NULL OR s.category = p_category)
    AND (p_search_term IS NULL OR
         s.name ILIKE '%' || p_search_term || '%' OR
         s.description ILIKE '%' || p_search_term || '%')
    AND (NOT p_active_only OR s.is_active = true)
    ORDER BY s.created_at DESC
    LIMIT p_page_size
    OFFSET (p_page - 1) * p_page_size;

    RETURN jsonb_build_object(
        'success', true,
        'data', COALESCE(v_results, '[]'::jsonb),
        'pagination', jsonb_build_object(
            'total_count', v_total_count,
            'page', p_page,
            'page_size', p_page_size,
            'total_pages', CEIL(v_total_count::NUMERIC / p_page_size)
        )
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Error retrieving services',
        'details', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."list_services"("p_category" "text", "p_search_term" "text", "p_active_only" boolean, "p_page" integer, "p_page_size" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."manage_product_category"("p_action" "text", "p_category_id" "uuid" DEFAULT NULL::"uuid", "p_name" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text", "p_is_active" boolean DEFAULT true) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_result JSONB;
BEGIN
    CASE p_action
        WHEN 'create' THEN
            INSERT INTO product_categories (name, description, is_active)
            VALUES (p_name, p_description, p_is_active)
            RETURNING jsonb_build_object(
                'id', id,
                'name', name,
                'description', description,
                'is_active', is_active
            ) INTO v_result;

        WHEN 'update' THEN
            UPDATE product_categories
            SET
                name = COALESCE(p_name, name),
                description = COALESCE(p_description, description),
                is_active = COALESCE(p_is_active, is_active),
                updated_at = NOW()
            WHERE id = p_category_id
            RETURNING jsonb_build_object(
                'id', id,
                'name', name,
                'description', description,
                'is_active', is_active
            ) INTO v_result;

        WHEN 'delete' THEN
            DELETE FROM product_categories
            WHERE id = p_category_id
            RETURNING jsonb_build_object(
                'id', id,
                'name', name,
                'message', 'Category deleted successfully'
            ) INTO v_result;

        ELSE
            RAISE EXCEPTION 'Invalid action specified';
    END CASE;

    RETURN jsonb_build_object(
        'success', true,
        'data', v_result
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."manage_product_category"("p_action" "text", "p_category_id" "uuid", "p_name" "text", "p_description" "text", "p_is_active" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    UPDATE notifications
    SET
        status = 'read',
        read_at = NOW(),
        updated_at = NOW()
    WHERE id = p_notification_id
    AND user_id = auth.uid();

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Notification marked as read'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_sale"("p_client_id" "uuid", "p_worker_id" "uuid", "p_services" "jsonb", "p_items" "jsonb", "p_payment_method" "public"."payment_method", "p_payment_status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_sale_id UUID;
    v_total_amount DECIMAL(10,2) := 0;
    v_service_amount DECIMAL(10,2) := 0;
    v_product_amount DECIMAL(10,2) := 0;
    v_sale_type sale_type;
    v_item JSONB;
BEGIN
    -- Verify worker authorization
    IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE id = p_worker_id
        AND role = 'worker'
        AND is_active = true
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Unauthorized: Invalid or inactive worker'
        );
    END IF;

    -- Calculate services total
    IF jsonb_array_length(p_services) > 0 THEN
        SELECT COALESCE(SUM((svc->>'price')::DECIMAL(10,2)), 0)
        INTO v_service_amount
        FROM jsonb_array_elements(p_services) as svc;
        v_total_amount := v_total_amount + v_service_amount;
    END IF;

    -- Calculate products total
    IF jsonb_array_length(p_items) > 0 THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            -- Add to product total
            v_product_amount := v_product_amount + (
                (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::DECIMAL(10,2)
            );
        END LOOP;
        v_total_amount := v_total_amount + v_product_amount;
    END IF;

    -- Determine sale type
    v_sale_type := CASE
        WHEN v_service_amount > 0 AND v_product_amount > 0 THEN 'combined'::sale_type
        WHEN v_service_amount > 0 THEN 'service'::sale_type
        ELSE 'product'::sale_type
    END;

    -- Create sale record
    INSERT INTO sales (
        client_id,
        worker_id,
        services,
        total_amount,
        payment_method,
        payment_status,
        sale_type,
        created_at,
        updated_at
    ) VALUES (
        p_client_id,
        p_worker_id,
        p_services,
        v_total_amount,
        p_payment_method,
        p_payment_status,
        v_sale_type,
        NOW(),
        NOW()
    ) RETURNING id INTO v_sale_id;

    -- Create sale items
    IF jsonb_array_length(p_items) > 0 THEN
        INSERT INTO sale_items (
            sale_id,
            product_id,
            quantity,
            unit_price,
            total_price,
            created_at,
            updated_at
        )
        SELECT
            v_sale_id,
            (item->>'product_id')::UUID,
            (item->>'quantity')::INTEGER,
            (item->>'unit_price')::DECIMAL(10,2),
            (item->>'quantity')::INTEGER * (item->>'unit_price')::DECIMAL(10,2),
            NOW(),
            NOW()
        FROM jsonb_array_elements(p_items) AS item;
    END IF;

    -- Update client profile if exists
    IF p_client_id IS NOT NULL THEN
        UPDATE profiles
        SET
            total_spent = COALESCE(total_spent, 0) + v_total_amount,
            total_visits = COALESCE(total_visits, 0) + 1,
            last_visit_date = NOW(),
            updated_at = NOW()
        WHERE id = p_client_id;
    END IF;

    -- Return sale details
    RETURN jsonb_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'total_amount', v_total_amount,
        'sale_type', v_sale_type,
        'services_amount', v_service_amount,
        'products_amount', v_product_amount
    );

EXCEPTION WHEN OTHERS THEN
    -- Return error response
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Error processing sale: ' || SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."process_sale"("p_client_id" "uuid", "p_worker_id" "uuid", "p_services" "jsonb", "p_items" "jsonb", "p_payment_method" "public"."payment_method", "p_payment_status" "public"."payment_status") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."quick_validate_session"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN (
        SELECT jsonb_build_object(
            'is_valid', true,
            'role', role,
            'loyalty_points', loyalty_points
        )
        FROM user_auth_cache
        WHERE id = p_user_id
    );
END;
$$;


ALTER FUNCTION "public"."quick_validate_session"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."redeem_loyalty_points"("p_client_id" "uuid", "p_points" integer, "p_reference_id" "uuid", "p_description" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_current_points INTEGER;
BEGIN
    -- Get current points
    SELECT loyalty_points INTO v_current_points
    FROM profiles
    WHERE id = p_client_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Client profile not found'
        );
    END IF;

    IF v_current_points < p_points THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Insufficient points balance',
            'current_points', v_current_points,
            'points_requested', p_points
        );
    END IF;

    -- Record redemption
    INSERT INTO loyalty_transactions (
        client_id,
        points,
        transaction_type,
        reference_id,
        description
    ) VALUES (
        p_client_id,
        -p_points,
        'redemption',
        p_reference_id,
        p_description
    );

    -- Update client profile
    UPDATE profiles
    SET
        loyalty_points = loyalty_points - p_points,
        updated_at = NOW()
    WHERE id = p_client_id;

    RETURN jsonb_build_object(
        'success', true,
        'points_redeemed', p_points,
        'new_balance', loyalty_points - p_points
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."redeem_loyalty_points"("p_client_id" "uuid", "p_points" integer, "p_reference_id" "uuid", "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_user_auth_cache"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_auth_cache;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."refresh_user_auth_cache"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_sales"("search_term" "text" DEFAULT NULL::"text", "p_worker_id" "uuid" DEFAULT NULL::"uuid", "p_sale_type" "public"."sale_type" DEFAULT NULL::"public"."sale_type", "p_payment_status" "public"."payment_status" DEFAULT NULL::"public"."payment_status", "p_payment_method" "public"."payment_method" DEFAULT NULL::"public"."payment_method", "p_client_id" "uuid" DEFAULT NULL::"uuid", "p_limit" integer DEFAULT 10, "p_offset" integer DEFAULT 0) RETURNS TABLE("sale_data" "jsonb", "total_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_total_count BIGINT;
BEGIN
    -- Get total count first
    SELECT COUNT(DISTINCT s.id)
    INTO v_total_count
    FROM sales s
    LEFT JOIN users c ON c.id = s.client_id
    LEFT JOIN users w ON w.id = s.worker_id
    WHERE (
        search_term IS NULL OR (
            CASE WHEN s.client_id IS NOT NULL
                THEN c.full_name ILIKE '%' || search_term || '%'
                ELSE FALSE
            END
            OR
            CASE WHEN s.worker_id IS NOT NULL
                THEN w.full_name ILIKE '%' || search_term || '%'
                ELSE FALSE
            END
        )
    )
    AND (p_worker_id IS NULL OR s.worker_id = p_worker_id)
    AND (p_sale_type IS NULL OR s.sale_type = p_sale_type)
    AND (p_payment_status IS NULL OR s.payment_status = p_payment_status)
    AND (p_payment_method IS NULL OR s.payment_method = p_payment_method)
    AND (p_client_id IS NULL OR s.client_id = p_client_id);

    RETURN QUERY
    SELECT
        jsonb_build_object(
            'id', s.id,
            'client_id', s.client_id,
            'worker_id', s.worker_id,
            'services', s.services,
            'total_amount', s.total_amount,
            'payment_method', s.payment_method,
            'payment_status', s.payment_status,
            'sale_type', s.sale_type,
            'created_at', s.created_at,
            'updated_at', s.updated_at,
            'client', CASE
                WHEN c.id IS NOT NULL THEN
                    jsonb_build_object(
                        'id', c.id,
                        'full_name', c.full_name,
                        'email', c.email
                    )
                ELSE NULL
            END,
            'worker', jsonb_build_object(
                'id', w.id,
                'full_name', w.full_name,
                'email', w.email
            ),
            'services_data', COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', srv.id,
                            'name', srv.name,
                            'description', srv.description,
                            'duration', srv.duration,
                            'price', srv.price,
                            'category', srv.category,
                            'image_url', srv.image_url
                        )
                    )
                    FROM services srv
                    WHERE srv.id IN (
                        SELECT (jsonb_array_elements(s.services)->>'service_id')::uuid
                    )
                ),
                '[]'::jsonb
            ),
            'items', COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', si.id,
                            'quantity', si.quantity,
                            'unit_price', si.unit_price,
                            'total_price', si.total_price,
                            'product', jsonb_build_object(
                                'id', p.id,
                                'name', p.name,
                                'price', p.price,
                                'category', pc.name
                            )
                        )
                    )
                    FROM sale_items si
                    LEFT JOIN products p ON p.id = si.product_id
                    LEFT JOIN product_categories pc ON pc.id = p.category_id
                    WHERE si.sale_id = s.id
                ),
                '[]'::jsonb
            )
        ) as sale_data,
        v_total_count
    FROM sales s
    LEFT JOIN users c ON c.id = s.client_id
    LEFT JOIN users w ON w.id = s.worker_id
    WHERE (
        search_term IS NULL OR (
            CASE WHEN s.client_id IS NOT NULL
                THEN c.full_name ILIKE '%' || search_term || '%'
                ELSE FALSE
            END
            OR
            CASE WHEN s.worker_id IS NOT NULL
                THEN w.full_name ILIKE '%' || search_term || '%'
                ELSE FALSE
            END
        )
    )
    AND (p_worker_id IS NULL OR s.worker_id = p_worker_id)
    AND (p_sale_type IS NULL OR s.sale_type = p_sale_type)
    AND (p_payment_status IS NULL OR s.payment_status = p_payment_status)
    AND (p_payment_method IS NULL OR s.payment_method = p_payment_method)
    AND (p_client_id IS NULL OR s.client_id = p_client_id)
    ORDER BY s.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."search_sales"("search_term" "text", "p_worker_id" "uuid", "p_sale_type" "public"."sale_type", "p_payment_status" "public"."payment_status", "p_payment_method" "public"."payment_method", "p_client_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_notification"("p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_message" "text", "p_data" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    -- Create notification
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_message,
        p_data
    ) RETURNING id INTO v_notification_id;

    -- Return success response
    RETURN jsonb_build_object(
        'success', true,
        'notification_id', v_notification_id
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."send_notification"("p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_message" "text", "p_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_user_role_to_auth"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.role != OLD.role THEN
        UPDATE auth.users
        SET raw_user_meta_data =
            COALESCE(raw_user_meta_data, '{}'::jsonb) ||
            jsonb_build_object('role', NEW.role)
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_user_role_to_auth"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_appointment_status"("p_appointment_id" "uuid", "p_status" "public"."appointment_status") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_appointment RECORD;
BEGIN
    -- Get appointment
    SELECT * INTO v_appointment
    FROM appointments
    WHERE id = p_appointment_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Appointment not found'
        );
    END IF;

    -- Update status
    UPDATE appointments
    SET
        status = p_status,
        updated_at = NOW()
    WHERE id = p_appointment_id;

    -- Update client profile if appointment is completed
    IF p_status = 'completed' THEN
        UPDATE profiles
        SET
            total_visits = total_visits + 1,
            last_visit_date = NOW(),
            updated_at = NOW()
        WHERE id = v_appointment.client_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', format('Appointment status updated to %s', p_status)
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Error updating appointment status',
        'details', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."update_appointment_status"("p_appointment_id" "uuid", "p_status" "public"."appointment_status") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_customer"("p_customer_id" "uuid", "p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_phone" "text", "p_address" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check if email already exists for another customer
  IF EXISTS (
    SELECT 1
    FROM customers
    WHERE email = p_email
    AND id != p_customer_id
  ) THEN
    RAISE EXCEPTION 'A customer with this email already exists';
  END IF;

  -- Update customer
  UPDATE customers SET
    first_name = p_first_name,
    last_name = p_last_name,
    email = p_email,
    phone = p_phone,
    address = p_address,
    updated_at = NOW()
  WHERE id = p_customer_id;

  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."update_customer"("p_customer_id" "uuid", "p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_phone" "text", "p_address" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_product"("p_product_id" "uuid", "p_name" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text", "p_price" numeric DEFAULT NULL::numeric, "p_category_id" "uuid" DEFAULT NULL::"uuid", "p_stock_quantity" integer DEFAULT NULL::integer, "p_reorder_point" integer DEFAULT NULL::integer, "p_image_url" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_current_product products%ROWTYPE;
BEGIN
    -- Get current product data
    SELECT * INTO v_current_product
    FROM products
    WHERE id = p_product_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Product not found'
        );
    END IF;

    -- Update product with new values, keeping old values where new ones aren't provided
    UPDATE products SET
        name = COALESCE(p_name, name),
        description = COALESCE(p_description, description),
        price = COALESCE(p_price, price),
        category_id = COALESCE(p_category_id, category_id),
        stock_quantity = COALESCE(p_stock_quantity, stock_quantity),
        reorder_point = COALESCE(p_reorder_point, reorder_point),
        image_url = COALESCE(p_image_url, image_url),
        updated_at = NOW()
    WHERE id = p_product_id;

    -- Check if we need to create a low stock alert
    IF COALESCE(p_stock_quantity, v_current_product.stock_quantity) <= COALESCE(p_reorder_point, v_current_product.reorder_point) THEN
        INSERT INTO inventory_alerts (
            product_id,
            alert_type,
            message
        ) VALUES (
            p_product_id,
            CASE
                WHEN COALESCE(p_stock_quantity, v_current_product.stock_quantity) = 0 THEN 'out_of_stock'
                ELSE 'low_stock'
            END,
            format('Product "%s" is running low on stock. Current quantity: %s',
                   COALESCE(p_name, v_current_product.name),
                   COALESCE(p_stock_quantity, v_current_product.stock_quantity))
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Product updated successfully'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Error updating product',
        'details', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."update_product"("p_product_id" "uuid", "p_name" "text", "p_description" "text", "p_price" numeric, "p_category_id" "uuid", "p_stock_quantity" integer, "p_reorder_point" integer, "p_image_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_sale_payment"("p_sale_id" "uuid", "p_payment_status" "public"."payment_status") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_sale_record RECORD;
BEGIN
    -- Get sale record
    SELECT * INTO v_sale_record
    FROM sales
    WHERE id = p_sale_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Sale not found'
        );
    END IF;

    -- Update payment status
    UPDATE sales
    SET
        payment_status = p_payment_status,
        updated_at = NOW()
    WHERE id = p_sale_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', format('Payment status updated to %s', p_payment_status)
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Error updating payment status',
        'details', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."update_sale_payment"("p_sale_id" "uuid", "p_payment_status" "public"."payment_status") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_service"("p_service_id" "uuid", "p_name" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text", "p_category" "text" DEFAULT NULL::"text", "p_duration" integer DEFAULT NULL::integer, "p_price" numeric DEFAULT NULL::numeric, "p_is_active" boolean DEFAULT NULL::boolean) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check if service exists
    IF NOT EXISTS (SELECT 1 FROM services WHERE id = p_service_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Service not found'
        );
    END IF;

    -- Update service with new values, keeping old values where new ones aren't provided
    UPDATE services SET
        name = COALESCE(p_name, name),
        description = COALESCE(p_description, description),
        category = COALESCE(p_category, category),
        duration = COALESCE(p_duration, duration),
        price = COALESCE(p_price, price),
        is_active = COALESCE(p_is_active, is_active),
        updated_at = NOW()
    WHERE id = p_service_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Service updated successfully'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Error updating service',
        'details', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."update_service"("p_service_id" "uuid", "p_name" "text", "p_description" "text", "p_category" "text", "p_duration" integer, "p_price" numeric, "p_is_active" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_stock_quantity"("p_product_id" "uuid", "p_quantity" integer, "p_adjustment_type" "text", "p_notes" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "name" "text", "stock_quantity" integer, "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_current_quantity integer;
  v_new_quantity integer;
BEGIN
  -- Get current stock quantity
  SELECT stock_quantity
  INTO v_current_quantity
  FROM products
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  -- Calculate new quantity based on adjustment type
  v_new_quantity := CASE p_adjustment_type
    WHEN 'add' THEN v_current_quantity + p_quantity
    WHEN 'remove' THEN GREATEST(0, v_current_quantity - p_quantity)
    WHEN 'set' THEN GREATEST(0, p_quantity)
    ELSE v_current_quantity
  END;

  -- Update product stock
  UPDATE products
  SET
    stock_quantity = v_new_quantity,
    last_restock_date = CASE
      WHEN p_adjustment_type = 'add' THEN CURRENT_TIMESTAMP
      ELSE last_restock_date
    END
  WHERE id = p_product_id;

  -- Record stock adjustment
  INSERT INTO stock_adjustments (
    product_id,
    previous_quantity,
    adjustment_quantity,
    new_quantity,
    adjustment_type,
    notes
  ) VALUES (
    p_product_id,
    v_current_quantity,
    p_quantity,
    v_new_quantity,
    p_adjustment_type,
    p_notes
  );

  -- Return updated product info
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.stock_quantity,
    CASE
      WHEN p.stock_quantity = 0 THEN 'out_of_stock'
      WHEN p.stock_quantity <= p.reorder_point THEN 'low_stock'
      ELSE 'in_stock'
    END as status
  FROM products p
  WHERE p.id = p_product_id;
END;
$$;


ALTER FUNCTION "public"."update_stock_quantity"("p_product_id" "uuid", "p_quantity" integer, "p_adjustment_type" "text", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_role"("target_user_id" "uuid", "new_role" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    result json;
BEGIN
    -- Validate role
    IF new_role NOT IN ('admin', 'worker', 'client') THEN
        RAISE EXCEPTION 'Invalid role specified';
    END IF;

    -- Update public.users role
    UPDATE public.users
    SET role = new_role::user_role,
        updated_at = now()
    WHERE id = target_user_id
    RETURNING json_build_object(
        'id', id,
        'email', email,
        'role', role
    ) INTO result;

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."update_user_role"("target_user_id" "uuid", "new_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_session"("p_user_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_result json;
BEGIN
    SELECT json_build_object(
        'is_valid', CASE
            WHEN u.is_active AND u.id IS NOT NULL THEN true
            ELSE false
        END,
        'role', u.role
    )
    INTO v_result
    FROM users u
    WHERE u.id = p_user_id;

    RETURN COALESCE(v_result, json_build_object(
        'is_valid', false,
        'role', null
    ));
END;
$$;


ALTER FUNCTION "public"."validate_session"("p_user_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "worker_id" "uuid",
    "service_id" "uuid" NOT NULL,
    "service" "text" NOT NULL,
    "appointment_date" timestamp with time zone NOT NULL,
    "time" "text" NOT NULL,
    "status" "public"."appointment_status" DEFAULT 'pending'::"public"."appointment_status",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."appointments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auth_attempts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" "text" NOT NULL,
    "attempt_count" integer DEFAULT 1,
    "last_attempt" timestamp with time zone DEFAULT "now"(),
    "ip_address" "text",
    "is_blocked" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."auth_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_alerts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "alert_type" character varying(50) NOT NULL,
    "message" "text" NOT NULL,
    "is_resolved" boolean DEFAULT false,
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "inventory_alerts_type_check" CHECK ((("alert_type")::"text" = ANY (ARRAY[('low_stock'::character varying)::"text", ('out_of_stock'::character varying)::"text", ('reorder_point'::character varying)::"text"])))
);


ALTER TABLE "public"."inventory_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."loyalty_rules" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "action_type" "text" NOT NULL,
    "points" integer NOT NULL,
    "minimum_spend" numeric(10,2) DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_points" CHECK (("points" >= 0))
);


ALTER TABLE "public"."loyalty_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."loyalty_transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "points" integer NOT NULL,
    "transaction_type" "text" NOT NULL,
    "reference_id" "uuid",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_points_transaction" CHECK (("points" <> 0))
);


ALTER TABLE "public"."loyalty_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "public"."notification_type" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "status" "public"."notification_status" DEFAULT 'unread'::"public"."notification_status",
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "stock_quantity" integer DEFAULT 0 NOT NULL,
    "category_id" "uuid",
    "image_url" "text",
    "is_active" boolean DEFAULT true,
    "reorder_point" integer DEFAULT 5 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "date_of_birth" "date",
    "gender" "text",
    "preferred_contact" "text" DEFAULT 'email'::"text",
    "emergency_contact_name" "text",
    "emergency_contact_phone" "text",
    "allergies" "text"[],
    "medical_conditions" "text"[],
    "skin_concerns" "text"[],
    "hair_type" "text",
    "preferred_worker_id" "uuid",
    "preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "last_visit_date" timestamp with time zone,
    "total_visits" integer DEFAULT 0,
    "total_spent" numeric(10,2) DEFAULT 0.00,
    "loyalty_points" integer DEFAULT 0,
    "address" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "appointment_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sale_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "sale_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "total_price" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sale_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "client_id" "uuid",
    "worker_id" "uuid" NOT NULL,
    "services" "jsonb" DEFAULT '[]'::"jsonb",
    "total_amount" numeric(10,2) NOT NULL,
    "payment_method" "public"."payment_method" NOT NULL,
    "payment_status" "public"."payment_status" NOT NULL,
    "sale_type" "public"."sale_type" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "duration" integer NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "category" "text" NOT NULL,
    "image_url" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "role" "public"."user_role" DEFAULT 'client'::"public"."user_role",
    "is_active" boolean DEFAULT true,
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."user_auth_cache" AS
 SELECT "u"."id",
    "u"."email",
    "u"."role",
    "u"."is_active",
    "p"."loyalty_points",
    "p"."total_visits"
   FROM ("public"."users" "u"
     LEFT JOIN "public"."profiles" "p" ON (("p"."id" = "u"."id")))
  WHERE ("u"."is_active" = true)
  WITH NO DATA;


ALTER TABLE "public"."user_auth_cache" OWNER TO "postgres";


ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auth_attempts"
    ADD CONSTRAINT "auth_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_alerts"
    ADD CONSTRAINT "inventory_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."loyalty_rules"
    ADD CONSTRAINT "loyalty_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."loyalty_transactions"
    ADD CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_categories"
    ADD CONSTRAINT "product_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."product_categories"
    ADD CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_client_id_appointment_id_key" UNIQUE ("client_id", "appointment_id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_appointments_client_date" ON "public"."appointments" USING "btree" ("client_id", "appointment_date");



CREATE INDEX "idx_appointments_status" ON "public"."appointments" USING "btree" ("status");



CREATE INDEX "idx_appointments_worker_date" ON "public"."appointments" USING "btree" ("worker_id", "appointment_date");



CREATE INDEX "idx_auth_attempts_email" ON "public"."auth_attempts" USING "btree" ("email", "is_blocked");



CREATE INDEX "idx_inventory_alerts_product" ON "public"."inventory_alerts" USING "btree" ("product_id");



CREATE INDEX "idx_inventory_alerts_resolved" ON "public"."inventory_alerts" USING "btree" ("is_resolved");



CREATE INDEX "idx_loyalty_rules_type" ON "public"."loyalty_rules" USING "btree" ("action_type");



CREATE INDEX "idx_loyalty_transactions_client" ON "public"."loyalty_transactions" USING "btree" ("client_id");



CREATE INDEX "idx_loyalty_transactions_date" ON "public"."loyalty_transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notifications_created" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notifications_type" ON "public"."notifications" USING "btree" ("type");



CREATE INDEX "idx_notifications_user_status" ON "public"."notifications" USING "btree" ("user_id", "status");



CREATE INDEX "idx_sale_items_product_id" ON "public"."sale_items" USING "btree" ("product_id");



CREATE INDEX "idx_sale_items_sale_id" ON "public"."sale_items" USING "btree" ("sale_id");



CREATE INDEX "idx_sales_client_id" ON "public"."sales" USING "btree" ("client_id");



CREATE INDEX "idx_sales_worker_id" ON "public"."sales" USING "btree" ("worker_id");



CREATE INDEX "idx_users_auth_composite" ON "public"."users" USING "btree" ("email", "is_active", "role");



CREATE INDEX "idx_users_auth_lookup" ON "public"."users" USING "btree" ("id", "role", "is_active");



CREATE INDEX "idx_users_email_lookup" ON "public"."users" USING "btree" ("email", "is_active");



CREATE INDEX "idx_users_fullname_search" ON "public"."users" USING "gin" ("full_name" "public"."gin_trgm_ops");



CREATE INDEX "user_auth_cache_email_idx" ON "public"."user_auth_cache" USING "btree" ("email");



CREATE UNIQUE INDEX "user_auth_cache_id_idx" ON "public"."user_auth_cache" USING "btree" ("id");



CREATE OR REPLACE TRIGGER "appointment_notification_trigger" AFTER INSERT OR UPDATE ON "public"."appointments" FOR EACH ROW EXECUTE FUNCTION "public"."create_appointment_notification"();



CREATE OR REPLACE TRIGGER "check_product_stock" AFTER UPDATE OF "stock_quantity" ON "public"."products" FOR EACH ROW WHEN (("new"."stock_quantity" <= "new"."reorder_point")) EXECUTE FUNCTION "public"."check_stock_level"();



CREATE OR REPLACE TRIGGER "sync_user_role" AFTER UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."sync_user_role_to_auth"();



CREATE OR REPLACE TRIGGER "update_appointments_updated_at" BEFORE UPDATE ON "public"."appointments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_notifications_updated_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_reviews_updated_at" BEFORE UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_services_updated_at" BEFORE UPDATE ON "public"."services" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."inventory_alerts"
    ADD CONSTRAINT "inventory_alerts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."loyalty_transactions"
    ADD CONSTRAINT "loyalty_transactions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_preferred_worker_id_fkey" FOREIGN KEY ("preferred_worker_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



CREATE POLICY "Allow admin full access" ON "public"."products" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Allow admin full access" ON "public"."services" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Allow public read access" ON "public"."products" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."services" FOR SELECT USING (true);



CREATE POLICY "Anyone can view active loyalty rules" ON "public"."loyalty_rules" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view active product categories" ON "public"."product_categories" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view active products" ON "public"."products" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view active services" ON "public"."services" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view reviews" ON "public"."reviews" FOR SELECT USING (true);



CREATE POLICY "Clients can create appointments" ON "public"."appointments" FOR INSERT WITH CHECK ((("client_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_active" = true))))));



CREATE POLICY "Clients can create reviews" ON "public"."reviews" FOR INSERT WITH CHECK ((("client_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."appointments"
  WHERE (("appointments"."id" = "reviews"."appointment_id") AND ("appointments"."client_id" = "auth"."uid"()) AND ("appointments"."status" = 'completed'::"public"."appointment_status"))))));



CREATE POLICY "Clients can view own loyalty transactions" ON "public"."loyalty_transactions" FOR SELECT USING (("client_id" = "auth"."uid"()));



CREATE POLICY "Clients can view their own appointments" ON "public"."appointments" FOR SELECT TO "authenticated" USING (("client_id" = "auth"."uid"()));



CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own appointments" ON "public"."appointments" FOR UPDATE USING ((("client_id" = "auth"."uid"()) OR ("worker_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'worker'::"public"."user_role") AND ("users"."is_active" = true))))));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Users can view own appointments" ON "public"."appointments" FOR SELECT USING ((("client_id" = "auth"."uid"()) OR ("worker_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'worker'::"public"."user_role") AND ("users"."is_active" = true))))));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("id" = "auth"."uid"()));



CREATE POLICY "Workers can create sale items" ON "public"."sale_items" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."sales" "s"
  WHERE (("s"."id" = "sale_items"."sale_id") AND ("s"."worker_id" = "auth"."uid"())))));



CREATE POLICY "Workers can create sales" ON "public"."sales" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'worker'::"public"."user_role") AND ("users"."is_active" = true)))) AND ("worker_id" = "auth"."uid"())));



CREATE POLICY "Workers can manage inventory alerts" ON "public"."inventory_alerts" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'worker'::"public"."user_role") AND ("users"."is_active" = true)))));



CREATE POLICY "Workers can manage loyalty rules" ON "public"."loyalty_rules" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'worker'::"public"."user_role") AND ("users"."is_active" = true)))));



CREATE POLICY "Workers can manage product categories" ON "public"."product_categories" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'worker'::"public"."user_role") AND ("users"."is_active" = true)))));



CREATE POLICY "Workers can manage products" ON "public"."products" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'worker'::"public"."user_role") AND ("users"."is_active" = true)))));



CREATE POLICY "Workers can manage services" ON "public"."services" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'worker'::"public"."user_role") AND ("users"."is_active" = true)))));



CREATE POLICY "Workers can process sales" ON "public"."sales" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'worker'::"public"."user_role") AND ("users"."is_active" = true)))));



CREATE POLICY "Workers can update sale payments" ON "public"."sales" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'worker'::"public"."user_role") AND ("users"."is_active" = true)))));



CREATE POLICY "Workers can update their own sales" ON "public"."sales" FOR UPDATE TO "authenticated" USING ((("worker_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'worker'::"public"."user_role") AND ("users"."is_active" = true))))));



CREATE POLICY "Workers can view all loyalty transactions" ON "public"."loyalty_transactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'worker'::"public"."user_role") AND ("users"."is_active" = true)))));



CREATE POLICY "Workers can view all sale items" ON "public"."sale_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'worker'::"public"."user_role") AND ("users"."is_active" = true)))));



CREATE POLICY "Workers can view all sales" ON "public"."sales" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'worker'::"public"."user_role") AND ("users"."is_active" = true)))));



CREATE POLICY "Workers can view assigned appointments" ON "public"."appointments" FOR SELECT TO "authenticated" USING ((("worker_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'worker'::"public"."user_role") AND ("users"."is_active" = true))))));



CREATE POLICY "Workers can view inventory alerts" ON "public"."inventory_alerts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'worker'::"public"."user_role") AND ("users"."is_active" = true)))));



ALTER TABLE "public"."appointments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."loyalty_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."loyalty_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sale_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_insert_policy" ON "public"."users" FOR INSERT WITH CHECK (true);



CREATE POLICY "users_read_policy" ON "public"."users" FOR SELECT USING (true);



CREATE POLICY "users_update_policy" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."auth_and_get_profile"("p_email" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."auth_and_get_profile"("p_email" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_and_get_profile"("p_email" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."award_loyalty_points"("p_client_id" "uuid", "p_amount" numeric, "p_reference_id" "uuid", "p_transaction_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."award_loyalty_points"("p_client_id" "uuid", "p_amount" numeric, "p_reference_id" "uuid", "p_transaction_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."award_loyalty_points"("p_client_id" "uuid", "p_amount" numeric, "p_reference_id" "uuid", "p_transaction_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_stock_level"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_stock_level"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_stock_level"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_appointment"("p_client_id" "uuid", "p_worker_id" "uuid", "p_service_id" "uuid", "p_appointment_date" timestamp with time zone, "p_time" "text", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_appointment"("p_client_id" "uuid", "p_worker_id" "uuid", "p_service_id" "uuid", "p_appointment_date" timestamp with time zone, "p_time" "text", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_appointment"("p_client_id" "uuid", "p_worker_id" "uuid", "p_service_id" "uuid", "p_appointment_date" timestamp with time zone, "p_time" "text", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_appointment_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_appointment_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_appointment_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_customer"("p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_phone" "text", "p_address" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_customer"("p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_phone" "text", "p_address" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_customer"("p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_phone" "text", "p_address" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_product"("p_name" "text", "p_description" "text", "p_price" numeric, "p_category_id" "uuid", "p_stock_quantity" integer, "p_reorder_point" integer, "p_image_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_product"("p_name" "text", "p_description" "text", "p_price" numeric, "p_category_id" "uuid", "p_stock_quantity" integer, "p_reorder_point" integer, "p_image_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_product"("p_name" "text", "p_description" "text", "p_price" numeric, "p_category_id" "uuid", "p_stock_quantity" integer, "p_reorder_point" integer, "p_image_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_service"("p_name" "text", "p_description" "text", "p_category" "text", "p_duration" integer, "p_price" numeric, "p_is_active" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."create_service"("p_name" "text", "p_description" "text", "p_category" "text", "p_duration" integer, "p_price" numeric, "p_is_active" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_service"("p_name" "text", "p_description" "text", "p_category" "text", "p_duration" integer, "p_price" numeric, "p_is_active" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_product_stock"("p_product_id" "uuid", "p_quantity" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_product_stock"("p_product_id" "uuid", "p_quantity" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_product_stock"("p_product_id" "uuid", "p_quantity" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_customer"("p_customer_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_customer"("p_customer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_customer"("p_customer_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_product"("p_product_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_product"("p_product_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_product"("p_product_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_service"("p_service_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_service"("p_service_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_service"("p_service_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_client_profile"("p_client_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_client_profile"("p_client_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_client_profile"("p_client_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_customer"("p_customer_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_customer"("p_customer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_customer"("p_customer_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_daily_profits"("p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_daily_profits"("p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_daily_profits"("p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_inventory_items"("p_category_id" "uuid", "p_status" "text", "p_search" "text", "p_page" integer, "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_inventory_items"("p_category_id" "uuid", "p_status" "text", "p_search" "text", "p_page" integer, "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_inventory_items"("p_category_id" "uuid", "p_status" "text", "p_search" "text", "p_page" integer, "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_low_stock_alerts"("p_category_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_low_stock_alerts"("p_category_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_low_stock_alerts"("p_category_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_monthly_profits"("p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_monthly_profits"("p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_monthly_profits"("p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_product_details"("p_product_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_product_details"("p_product_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_product_details"("p_product_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_profit_by_category"("p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_profit_by_category"("p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_profit_by_category"("p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_stock_history"("p_product_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_page" integer, "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_stock_history"("p_product_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_page" integer, "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_stock_history"("p_product_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_page" integer, "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_top_performing_items"("p_start_date" "date", "p_end_date" "date", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_top_performing_items"("p_start_date" "date", "p_end_date" "date", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_top_performing_items"("p_start_date" "date", "p_end_date" "date", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_notifications_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_notifications_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_notifications_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role_and_profile"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role_and_profile"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role_and_profile"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_worker_availability"("p_worker_id" "uuid", "p_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_worker_availability"("p_worker_id" "uuid", "p_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_worker_availability"("p_worker_id" "uuid", "p_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_failed_login"("p_email" "text", "p_ip_address" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."handle_failed_login"("p_email" "text", "p_ip_address" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_failed_login"("p_email" "text", "p_ip_address" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_product_stock"("p_product_id" "uuid", "p_quantity" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_product_stock"("p_product_id" "uuid", "p_quantity" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_product_stock"("p_product_id" "uuid", "p_quantity" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."list_customers"("p_search" "text", "p_sort_by" "text", "p_sort_order" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."list_customers"("p_search" "text", "p_sort_by" "text", "p_sort_order" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_customers"("p_search" "text", "p_sort_by" "text", "p_sort_order" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."list_products"("p_category_id" "uuid", "p_search_term" "text", "p_low_stock_only" boolean, "p_page" integer, "p_page_size" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."list_products"("p_category_id" "uuid", "p_search_term" "text", "p_low_stock_only" boolean, "p_page" integer, "p_page_size" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_products"("p_category_id" "uuid", "p_search_term" "text", "p_low_stock_only" boolean, "p_page" integer, "p_page_size" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."list_services"("p_category" "text", "p_search_term" "text", "p_active_only" boolean, "p_page" integer, "p_page_size" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."list_services"("p_category" "text", "p_search_term" "text", "p_active_only" boolean, "p_page" integer, "p_page_size" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_services"("p_category" "text", "p_search_term" "text", "p_active_only" boolean, "p_page" integer, "p_page_size" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."manage_product_category"("p_action" "text", "p_category_id" "uuid", "p_name" "text", "p_description" "text", "p_is_active" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."manage_product_category"("p_action" "text", "p_category_id" "uuid", "p_name" "text", "p_description" "text", "p_is_active" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."manage_product_category"("p_action" "text", "p_category_id" "uuid", "p_name" "text", "p_description" "text", "p_is_active" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_sale"("p_client_id" "uuid", "p_worker_id" "uuid", "p_services" "jsonb", "p_items" "jsonb", "p_payment_method" "public"."payment_method", "p_payment_status" "public"."payment_status") TO "anon";
GRANT ALL ON FUNCTION "public"."process_sale"("p_client_id" "uuid", "p_worker_id" "uuid", "p_services" "jsonb", "p_items" "jsonb", "p_payment_method" "public"."payment_method", "p_payment_status" "public"."payment_status") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_sale"("p_client_id" "uuid", "p_worker_id" "uuid", "p_services" "jsonb", "p_items" "jsonb", "p_payment_method" "public"."payment_method", "p_payment_status" "public"."payment_status") TO "service_role";



GRANT ALL ON FUNCTION "public"."quick_validate_session"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."quick_validate_session"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."quick_validate_session"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."redeem_loyalty_points"("p_client_id" "uuid", "p_points" integer, "p_reference_id" "uuid", "p_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."redeem_loyalty_points"("p_client_id" "uuid", "p_points" integer, "p_reference_id" "uuid", "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."redeem_loyalty_points"("p_client_id" "uuid", "p_points" integer, "p_reference_id" "uuid", "p_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_user_auth_cache"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_user_auth_cache"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_user_auth_cache"() TO "service_role";



GRANT ALL ON FUNCTION "public"."search_sales"("search_term" "text", "p_worker_id" "uuid", "p_sale_type" "public"."sale_type", "p_payment_status" "public"."payment_status", "p_payment_method" "public"."payment_method", "p_client_id" "uuid", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_sales"("search_term" "text", "p_worker_id" "uuid", "p_sale_type" "public"."sale_type", "p_payment_status" "public"."payment_status", "p_payment_method" "public"."payment_method", "p_client_id" "uuid", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_sales"("search_term" "text", "p_worker_id" "uuid", "p_sale_type" "public"."sale_type", "p_payment_status" "public"."payment_status", "p_payment_method" "public"."payment_method", "p_client_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."send_notification"("p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_message" "text", "p_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."send_notification"("p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_message" "text", "p_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_notification"("p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_message" "text", "p_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_user_role_to_auth"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_user_role_to_auth"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_user_role_to_auth"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_appointment_status"("p_appointment_id" "uuid", "p_status" "public"."appointment_status") TO "anon";
GRANT ALL ON FUNCTION "public"."update_appointment_status"("p_appointment_id" "uuid", "p_status" "public"."appointment_status") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_appointment_status"("p_appointment_id" "uuid", "p_status" "public"."appointment_status") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_customer"("p_customer_id" "uuid", "p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_phone" "text", "p_address" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_customer"("p_customer_id" "uuid", "p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_phone" "text", "p_address" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_customer"("p_customer_id" "uuid", "p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_phone" "text", "p_address" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_product"("p_product_id" "uuid", "p_name" "text", "p_description" "text", "p_price" numeric, "p_category_id" "uuid", "p_stock_quantity" integer, "p_reorder_point" integer, "p_image_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_product"("p_product_id" "uuid", "p_name" "text", "p_description" "text", "p_price" numeric, "p_category_id" "uuid", "p_stock_quantity" integer, "p_reorder_point" integer, "p_image_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_product"("p_product_id" "uuid", "p_name" "text", "p_description" "text", "p_price" numeric, "p_category_id" "uuid", "p_stock_quantity" integer, "p_reorder_point" integer, "p_image_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_sale_payment"("p_sale_id" "uuid", "p_payment_status" "public"."payment_status") TO "anon";
GRANT ALL ON FUNCTION "public"."update_sale_payment"("p_sale_id" "uuid", "p_payment_status" "public"."payment_status") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_sale_payment"("p_sale_id" "uuid", "p_payment_status" "public"."payment_status") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_service"("p_service_id" "uuid", "p_name" "text", "p_description" "text", "p_category" "text", "p_duration" integer, "p_price" numeric, "p_is_active" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_service"("p_service_id" "uuid", "p_name" "text", "p_description" "text", "p_category" "text", "p_duration" integer, "p_price" numeric, "p_is_active" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_service"("p_service_id" "uuid", "p_name" "text", "p_description" "text", "p_category" "text", "p_duration" integer, "p_price" numeric, "p_is_active" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_stock_quantity"("p_product_id" "uuid", "p_quantity" integer, "p_adjustment_type" "text", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_stock_quantity"("p_product_id" "uuid", "p_quantity" integer, "p_adjustment_type" "text", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_stock_quantity"("p_product_id" "uuid", "p_quantity" integer, "p_adjustment_type" "text", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_role"("target_user_id" "uuid", "new_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_role"("target_user_id" "uuid", "new_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_role"("target_user_id" "uuid", "new_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_session"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_session"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_session"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";


















GRANT ALL ON TABLE "public"."appointments" TO "anon";
GRANT ALL ON TABLE "public"."appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments" TO "service_role";



GRANT ALL ON TABLE "public"."auth_attempts" TO "anon";
GRANT ALL ON TABLE "public"."auth_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."auth_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_alerts" TO "anon";
GRANT ALL ON TABLE "public"."inventory_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."loyalty_rules" TO "anon";
GRANT ALL ON TABLE "public"."loyalty_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."loyalty_rules" TO "service_role";



GRANT ALL ON TABLE "public"."loyalty_transactions" TO "anon";
GRANT ALL ON TABLE "public"."loyalty_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."loyalty_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."product_categories" TO "anon";
GRANT ALL ON TABLE "public"."product_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."product_categories" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."sale_items" TO "anon";
GRANT ALL ON TABLE "public"."sale_items" TO "authenticated";
GRANT ALL ON TABLE "public"."sale_items" TO "service_role";



GRANT ALL ON TABLE "public"."sales" TO "anon";
GRANT ALL ON TABLE "public"."sales" TO "authenticated";
GRANT ALL ON TABLE "public"."sales" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."user_auth_cache" TO "anon";
GRANT ALL ON TABLE "public"."user_auth_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."user_auth_cache" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
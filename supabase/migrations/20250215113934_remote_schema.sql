create type "public"."appointment_status" as enum ('pending', 'confirmed', 'cancelled', 'completed');

create type "public"."contact_preference" as enum ('email', 'phone', 'sms');

create type "public"."user_role" as enum ('admin', 'worker', 'client');

drop trigger if exists "create_sale_on_appointment_confirmation" on "public"."appointments";

drop trigger if exists "validate_service_data_trigger" on "public"."appointments";

drop trigger if exists "update_product_categories_updated_at" on "public"."product_categories";

drop trigger if exists "update_products_updated_at" on "public"."products";

drop trigger if exists "reviews_updated_at" on "public"."reviews";

drop trigger if exists "update_sale_items_updated_at" on "public"."sale_items";

drop trigger if exists "update_sale_total_trigger" on "public"."sale_items";

drop trigger if exists "update_stock_after_sale_trigger" on "public"."sale_items";

drop trigger if exists "validate_sale_item_data_trigger" on "public"."sale_items";

drop trigger if exists "create_walk_in_service_trigger" on "public"."sales";

drop trigger if exists "update_sales_updated_at" on "public"."sales";

drop trigger if exists "validate_sale_total_trigger" on "public"."sales";

drop trigger if exists "handle_users_updated_at" on "public"."users";

drop policy "Admins have full access" on "public"."appointments";

drop policy "Clients can cancel own appointments" on "public"."appointments";

drop policy "Clients can create appointments" on "public"."appointments";

drop policy "Clients can view own appointments" on "public"."appointments";

drop policy "Clients can view their own appointments" on "public"."appointments";

drop policy "Enable delete for users based on client_id" on "public"."appointments";

drop policy "Enable insert for authenticated users" on "public"."appointments";

drop policy "Role-based appointment access" on "public"."appointments";

drop policy "Workers can update their assigned appointments" on "public"."appointments";

drop policy "Workers can view assigned and pending appointments" on "public"."appointments";

drop policy "Workers can update inventory alerts" on "public"."inventory_alerts";

drop policy "Workers can view inventory alerts" on "public"."inventory_alerts";

drop policy "Users can view and update their own profile" on "public"."profiles";

drop policy "Users can delete their own reviews" on "public"."reviews";

drop policy "Users can insert their own reviews" on "public"."reviews";

drop policy "Users can update their own reviews" on "public"."reviews";

drop policy "Users can view their own reviews" on "public"."reviews";

drop policy "Anyone can view active services" on "public"."services";

drop policy "Public read access for services" on "public"."services";

drop policy "Staff can manage services" on "public"."services";

drop policy "Admins can create activity records" on "public"."user_activities";

drop policy "Admins can view all activities" on "public"."user_activities";

drop policy "Admins can view all activities." on "public"."user_activities";

drop policy "System can insert activities." on "public"."user_activities";

drop policy "Users can view their own activities" on "public"."user_activities";

drop policy "Users can view their own activities." on "public"."user_activities";

drop policy "Admin full access" on "public"."users";

drop policy "Admins can create profiles" on "public"."users";

drop policy "Admins can update any profile" on "public"."users";

drop policy "Admins can view all profiles" on "public"."users";

drop policy "Users can read own data" on "public"."users";

drop policy "Users can update own data" on "public"."users";

drop policy "Workers can view clients" on "public"."users";

drop policy "Users can update own profile" on "public"."users";

drop policy "Users can view own profile" on "public"."users";

revoke delete on table "public"."inventory_alerts" from "anon";

revoke insert on table "public"."inventory_alerts" from "anon";

revoke references on table "public"."inventory_alerts" from "anon";

revoke select on table "public"."inventory_alerts" from "anon";

revoke trigger on table "public"."inventory_alerts" from "anon";

revoke truncate on table "public"."inventory_alerts" from "anon";

revoke update on table "public"."inventory_alerts" from "anon";

revoke delete on table "public"."inventory_alerts" from "authenticated";

revoke insert on table "public"."inventory_alerts" from "authenticated";

revoke references on table "public"."inventory_alerts" from "authenticated";

revoke select on table "public"."inventory_alerts" from "authenticated";

revoke trigger on table "public"."inventory_alerts" from "authenticated";

revoke truncate on table "public"."inventory_alerts" from "authenticated";

revoke update on table "public"."inventory_alerts" from "authenticated";

revoke delete on table "public"."inventory_alerts" from "service_role";

revoke insert on table "public"."inventory_alerts" from "service_role";

revoke references on table "public"."inventory_alerts" from "service_role";

revoke select on table "public"."inventory_alerts" from "service_role";

revoke trigger on table "public"."inventory_alerts" from "service_role";

revoke truncate on table "public"."inventory_alerts" from "service_role";

revoke update on table "public"."inventory_alerts" from "service_role";

revoke delete on table "public"."product_categories" from "anon";

revoke insert on table "public"."product_categories" from "anon";

revoke references on table "public"."product_categories" from "anon";

revoke select on table "public"."product_categories" from "anon";

revoke trigger on table "public"."product_categories" from "anon";

revoke truncate on table "public"."product_categories" from "anon";

revoke update on table "public"."product_categories" from "anon";

revoke delete on table "public"."product_categories" from "authenticated";

revoke insert on table "public"."product_categories" from "authenticated";

revoke references on table "public"."product_categories" from "authenticated";

revoke select on table "public"."product_categories" from "authenticated";

revoke trigger on table "public"."product_categories" from "authenticated";

revoke truncate on table "public"."product_categories" from "authenticated";

revoke update on table "public"."product_categories" from "authenticated";

revoke delete on table "public"."product_categories" from "service_role";

revoke insert on table "public"."product_categories" from "service_role";

revoke references on table "public"."product_categories" from "service_role";

revoke select on table "public"."product_categories" from "service_role";

revoke trigger on table "public"."product_categories" from "service_role";

revoke truncate on table "public"."product_categories" from "service_role";

revoke update on table "public"."product_categories" from "service_role";

revoke delete on table "public"."products" from "anon";

revoke insert on table "public"."products" from "anon";

revoke references on table "public"."products" from "anon";

revoke select on table "public"."products" from "anon";

revoke trigger on table "public"."products" from "anon";

revoke truncate on table "public"."products" from "anon";

revoke update on table "public"."products" from "anon";

revoke delete on table "public"."products" from "authenticated";

revoke insert on table "public"."products" from "authenticated";

revoke references on table "public"."products" from "authenticated";

revoke select on table "public"."products" from "authenticated";

revoke trigger on table "public"."products" from "authenticated";

revoke truncate on table "public"."products" from "authenticated";

revoke update on table "public"."products" from "authenticated";

revoke delete on table "public"."products" from "service_role";

revoke insert on table "public"."products" from "service_role";

revoke references on table "public"."products" from "service_role";

revoke select on table "public"."products" from "service_role";

revoke trigger on table "public"."products" from "service_role";

revoke truncate on table "public"."products" from "service_role";

revoke update on table "public"."products" from "service_role";

revoke delete on table "public"."sale_items" from "anon";

revoke insert on table "public"."sale_items" from "anon";

revoke references on table "public"."sale_items" from "anon";

revoke select on table "public"."sale_items" from "anon";

revoke trigger on table "public"."sale_items" from "anon";

revoke truncate on table "public"."sale_items" from "anon";

revoke update on table "public"."sale_items" from "anon";

revoke delete on table "public"."sale_items" from "authenticated";

revoke insert on table "public"."sale_items" from "authenticated";

revoke references on table "public"."sale_items" from "authenticated";

revoke select on table "public"."sale_items" from "authenticated";

revoke trigger on table "public"."sale_items" from "authenticated";

revoke truncate on table "public"."sale_items" from "authenticated";

revoke update on table "public"."sale_items" from "authenticated";

revoke delete on table "public"."sale_items" from "service_role";

revoke insert on table "public"."sale_items" from "service_role";

revoke references on table "public"."sale_items" from "service_role";

revoke select on table "public"."sale_items" from "service_role";

revoke trigger on table "public"."sale_items" from "service_role";

revoke truncate on table "public"."sale_items" from "service_role";

revoke update on table "public"."sale_items" from "service_role";

revoke delete on table "public"."sales" from "anon";

revoke insert on table "public"."sales" from "anon";

revoke references on table "public"."sales" from "anon";

revoke select on table "public"."sales" from "anon";

revoke trigger on table "public"."sales" from "anon";

revoke truncate on table "public"."sales" from "anon";

revoke update on table "public"."sales" from "anon";

revoke delete on table "public"."sales" from "authenticated";

revoke insert on table "public"."sales" from "authenticated";

revoke references on table "public"."sales" from "authenticated";

revoke select on table "public"."sales" from "authenticated";

revoke trigger on table "public"."sales" from "authenticated";

revoke truncate on table "public"."sales" from "authenticated";

revoke update on table "public"."sales" from "authenticated";

revoke delete on table "public"."sales" from "service_role";

revoke insert on table "public"."sales" from "service_role";

revoke references on table "public"."sales" from "service_role";

revoke select on table "public"."sales" from "service_role";

revoke trigger on table "public"."sales" from "service_role";

revoke truncate on table "public"."sales" from "service_role";

revoke update on table "public"."sales" from "service_role";

revoke delete on table "public"."user_activities" from "anon";

revoke insert on table "public"."user_activities" from "anon";

revoke references on table "public"."user_activities" from "anon";

revoke select on table "public"."user_activities" from "anon";

revoke trigger on table "public"."user_activities" from "anon";

revoke truncate on table "public"."user_activities" from "anon";

revoke update on table "public"."user_activities" from "anon";

revoke delete on table "public"."user_activities" from "authenticated";

revoke insert on table "public"."user_activities" from "authenticated";

revoke references on table "public"."user_activities" from "authenticated";

revoke select on table "public"."user_activities" from "authenticated";

revoke trigger on table "public"."user_activities" from "authenticated";

revoke truncate on table "public"."user_activities" from "authenticated";

revoke update on table "public"."user_activities" from "authenticated";

revoke delete on table "public"."user_activities" from "service_role";

revoke insert on table "public"."user_activities" from "service_role";

revoke references on table "public"."user_activities" from "service_role";

revoke select on table "public"."user_activities" from "service_role";

revoke trigger on table "public"."user_activities" from "service_role";

revoke truncate on table "public"."user_activities" from "service_role";

revoke update on table "public"."user_activities" from "service_role";

alter table "public"."inventory_alerts" drop constraint "inventory_alerts_product_id_alert_type_key";

alter table "public"."inventory_alerts" drop constraint "inventory_alerts_product_id_fkey";

alter table "public"."products" drop constraint "products_category_id_fkey";

alter table "public"."reviews" drop constraint "reviews_appointment_id_key";

alter table "public"."sale_items" drop constraint "sale_items_product_id_fkey";

alter table "public"."sale_items" drop constraint "sale_items_quantity_check";

alter table "public"."sale_items" drop constraint "sale_items_sale_id_fkey";

alter table "public"."sales" drop constraint "sales_appointment_id_fkey";

alter table "public"."sales" drop constraint "sales_client_id_fkey";

alter table "public"."sales" drop constraint "sales_payment_method_check";

alter table "public"."sales" drop constraint "sales_payment_status_check";

alter table "public"."sales" drop constraint "sales_sale_type_check";

alter table "public"."sales" drop constraint "sales_service_id_fkey";

alter table "public"."sales" drop constraint "sales_worker_id_fkey";

alter table "public"."user_activities" drop constraint "user_activities_user_id_fkey";

alter table "public"."appointments" drop constraint "appointments_client_id_fkey";

alter table "public"."appointments" drop constraint "appointments_service_id_fkey";

alter table "public"."appointments" drop constraint "appointments_worker_id_fkey";

alter table "public"."profiles" drop constraint "profiles_id_fkey";

alter table "public"."reviews" drop constraint "reviews_appointment_id_fkey";

alter table "public"."reviews" drop constraint "reviews_client_id_fkey";

alter table "public"."users" drop constraint "users_role_check";

drop view if exists "public"."appointment_details";

drop function if exists "public"."create_sale_on_appointment_confirmation"();

drop function if exists "public"."create_walk_in_service"();

drop function if exists "public"."get_worker_sales_stats"();

drop function if exists "public"."get_worker_sales_stats"(worker_id uuid);

drop function if exists "public"."get_worker_sales_stats"(worker_id uuid, start_date timestamp with time zone, end_date timestamp with time zone);

drop function if exists "public"."handle_updated_at"();

drop view if exists "public"."sales_with_details";

drop function if exists "public"."update_product_stock_after_sale"();

drop function if exists "public"."update_reviews_updated_at"();

drop function if exists "public"."validate_and_update_sale_total"();

drop function if exists "public"."validate_sale_item_data"();

drop function if exists "public"."validate_sale_total"();

drop function if exists "public"."validate_service_data"();

alter table "public"."inventory_alerts" drop constraint "inventory_alerts_pkey";

alter table "public"."product_categories" drop constraint "product_categories_pkey";

alter table "public"."products" drop constraint "products_pkey";

alter table "public"."sale_items" drop constraint "sale_items_pkey";

alter table "public"."sales" drop constraint "sales_pkey";

alter table "public"."user_activities" drop constraint "user_activities_pkey";

drop index if exists "public"."appointments_client_id_idx";

drop index if exists "public"."appointments_date_idx";

drop index if exists "public"."appointments_status_idx";

drop index if exists "public"."appointments_worker_id_idx";

drop index if exists "public"."idx_inventory_alerts_product_id";

drop index if exists "public"."idx_product_categories_is_active";

drop index if exists "public"."idx_products_category_id";

drop index if exists "public"."idx_products_is_active";

drop index if exists "public"."idx_products_name";

drop index if exists "public"."idx_sale_items_product_id";

drop index if exists "public"."idx_sale_items_sale_id";

drop index if exists "public"."idx_sales_appointment_id";

drop index if exists "public"."idx_sales_client_id";

drop index if exists "public"."idx_sales_created_at";

drop index if exists "public"."idx_sales_sale_type";

drop index if exists "public"."idx_sales_type";

drop index if exists "public"."idx_sales_worker_id";

drop index if exists "public"."inventory_alerts_pkey";

drop index if exists "public"."inventory_alerts_product_id_alert_type_key";

drop index if exists "public"."product_categories_pkey";

drop index if exists "public"."products_pkey";

drop index if exists "public"."reviews_appointment_id_key";

drop index if exists "public"."sale_items_pkey";

drop index if exists "public"."sales_pkey";

drop index if exists "public"."user_activities_pkey";

drop index if exists "public"."user_activities_timestamp_idx";

drop index if exists "public"."user_activities_user_id_idx";

drop table "public"."inventory_alerts";

drop table "public"."product_categories";

drop table "public"."products";

drop table "public"."sale_items";

drop table "public"."sales";

drop table "public"."user_activities";

create table "public"."notifications" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "title" character varying not null,
    "message" text not null,
    "type" character varying not null,
    "is_read" boolean default false,
    "created_at" timestamp with time zone default now()
);


alter table "public"."notifications" enable row level security;

alter table "public"."appointments" drop column "service";

alter table "public"."appointments" drop column "service_name";

alter table "public"."appointments" drop column "total_amount";

alter table "public"."appointments" alter column "client_id" set not null;

alter table "public"."appointments" alter column "created_at" set not null;

alter table "public"."appointments" alter column "service_id" set not null;

alter table "public"."appointments" alter column "status" drop default;

alter table "public"."appointments" alter column "status" set data type appointment_status using "status"::appointment_status;

alter table "public"."appointments" alter column "updated_at" set not null;

alter table "public"."profiles" drop column "full_name";

alter table "public"."profiles" drop column "phone";

alter table "public"."profiles" add column "allergies" text;

alter table "public"."profiles" add column "avatar_url" text;

alter table "public"."profiles" add column "date_of_birth" date;

alter table "public"."profiles" add column "emergency_contact_name" character varying(255);

alter table "public"."profiles" add column "emergency_contact_phone" character varying(20);

alter table "public"."profiles" add column "gender" character varying(50);

alter table "public"."profiles" add column "hair_type" character varying(100);

alter table "public"."profiles" add column "last_visit_date" timestamp with time zone;

alter table "public"."profiles" add column "loyalty_points" integer default 0;

alter table "public"."profiles" add column "medical_conditions" text;

alter table "public"."profiles" add column "preferences" jsonb default '{}'::jsonb;

alter table "public"."profiles" add column "preferred_contact" contact_preference default 'email'::contact_preference;

alter table "public"."profiles" add column "preferred_worker_id" uuid;

alter table "public"."profiles" add column "skin_concerns" text;

alter table "public"."profiles" add column "total_spent" numeric(10,2) default 0.00;

alter table "public"."profiles" add column "total_visits" integer default 0;

alter table "public"."profiles" alter column "created_at" set default now();

alter table "public"."profiles" alter column "updated_at" set default now();

alter table "public"."reviews" drop column "updated_at";

alter table "public"."reviews" alter column "appointment_id" drop not null;

alter table "public"."reviews" alter column "client_id" drop not null;

alter table "public"."reviews" alter column "created_at" set default now();

alter table "public"."reviews" alter column "created_at" drop not null;

alter table "public"."reviews" alter column "id" set default uuid_generate_v4();

alter table "public"."services" alter column "category" drop default;

alter table "public"."users" alter column "role" drop default;

CREATE INDEX idx_appointments_client_id ON public.appointments USING btree (client_id);

CREATE INDEX idx_appointments_date ON public.appointments USING btree (appointment_date);

CREATE INDEX idx_appointments_status ON public.appointments USING btree (status);

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id, is_read);

CREATE INDEX idx_profiles_last_visit ON public.profiles USING btree (last_visit_date);

CREATE INDEX idx_profiles_loyalty ON public.profiles USING btree (loyalty_points);

CREATE INDEX idx_profiles_preferred_worker ON public.profiles USING btree (preferred_worker_id);

CREATE INDEX idx_reviews_appointment_id ON public.reviews USING btree (appointment_id);

CREATE INDEX idx_reviews_client_id ON public.reviews USING btree (client_id);

CREATE INDEX idx_services_active ON public.services USING btree (is_active);

CREATE INDEX idx_services_category ON public.services USING btree (category) WHERE (is_active = true);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."notifications" add constraint "notifications_type_check" CHECK (((type)::text = ANY ((ARRAY['appointment'::character varying, 'system'::character varying, 'reminder'::character varying])::text[]))) not valid;

alter table "public"."notifications" validate constraint "notifications_type_check";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_preferred_worker_id_fkey" FOREIGN KEY (preferred_worker_id) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."profiles" validate constraint "profiles_preferred_worker_id_fkey";

alter table "public"."appointments" add constraint "appointments_client_id_fkey" FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."appointments" validate constraint "appointments_client_id_fkey";

alter table "public"."appointments" add constraint "appointments_service_id_fkey" FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT not valid;

alter table "public"."appointments" validate constraint "appointments_service_id_fkey";

alter table "public"."appointments" add constraint "appointments_worker_id_fkey" FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."appointments" validate constraint "appointments_worker_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES users(id) not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."reviews" add constraint "reviews_appointment_id_fkey" FOREIGN KEY (appointment_id) REFERENCES appointments(id) not valid;

alter table "public"."reviews" validate constraint "reviews_appointment_id_fkey";

alter table "public"."reviews" add constraint "reviews_client_id_fkey" FOREIGN KEY (client_id) REFERENCES users(id) not valid;

alter table "public"."reviews" validate constraint "reviews_client_id_fkey";

alter table "public"."users" add constraint "users_role_check" CHECK (((role)::text = ANY ((ARRAY['client'::character varying, 'worker'::character varying, 'admin'::character varying])::text[]))) not valid;

alter table "public"."users" validate constraint "users_role_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_appointment_availability(p_date date, p_time text, p_service_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    service_duration INTEGER;
    appointment_end_time TIME;
    slot_start_time TIME;
    slot_end_time TIME;
    existing_count INTEGER;
BEGIN
    -- Get service duration
    SELECT duration INTO service_duration
    FROM services
    WHERE id = p_service_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Service not found';
    END IF;

    -- Convert appointment time to TIME type
    slot_start_time := TO_TIMESTAMP(p_time, 'HH:MI AM')::TIME;
    slot_end_time := (slot_start_time + (service_duration || ' minutes')::INTERVAL)::TIME;

    -- Check for overlapping appointments
    SELECT COUNT(*)
    INTO existing_count
    FROM appointments a
    JOIN services s ON s.id = a.service_id
    WHERE a.appointment_date = p_date
    AND a.status IN ('pending', 'confirmed')
    AND (
        -- Check if new appointment overlaps with existing appointments
        (slot_start_time, slot_end_time) OVERLAPS 
        (TO_TIMESTAMP(a.time, 'HH:MI AM')::TIME,
         (TO_TIMESTAMP(a.time, 'HH:MI AM')::TIME + (s.duration || ' minutes')::INTERVAL)::TIME)
    );

    -- Return true if no overlapping appointments found
    RETURN existing_count = 0;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_appointment(p_client_id uuid, p_service_id uuid, p_date date, p_time text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_role TEXT;
    v_is_active BOOLEAN;
    v_result JSONB;
BEGIN
    -- Check if user exists and is an active client
    SELECT role, is_active 
    INTO v_user_role, v_is_active
    FROM users
    WHERE id = p_client_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'User not found'
        );
    END IF;

    IF v_user_role != 'client' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Only clients can create appointments'
        );
    END IF;

    IF NOT v_is_active THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'User account is inactive'
        );
    END IF;

    -- Check if service exists and is active
    IF NOT EXISTS (
        SELECT 1 FROM services 
        WHERE id = p_service_id 
        AND is_active = true
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Service not found or inactive'
        );
    END IF;

    -- Check appointment availability
    IF NOT check_appointment_availability(p_date, p_time, p_service_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Time slot is not available'
        );
    END IF;

    -- Create the appointment
    INSERT INTO appointments (
        client_id,
        service_id,
        appointment_date,
        time,
        status,
        created_at,
        updated_at
    )
    VALUES (
        p_client_id,
        p_service_id,
        p_date,
        p_time,
        'pending',
        NOW(),
        NOW()
    )
    RETURNING jsonb_build_object(
        'id', id,
        'client_id', client_id,
        'service_id', service_id,
        'appointment_date', appointment_date,
        'time', time,
        'status', status
    ) INTO v_result;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Appointment created successfully',
        'data', v_result
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_appointment_notification()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Create notification for new appointment
    IF TG_OP = 'INSERT' THEN
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (
            NEW.client_id,
            'Appointment Scheduled',
            'Your appointment has been scheduled for ' || NEW.appointment_date::date || ' at ' || NEW.time,
            'appointment'
        );
    
    -- Create notification for status update
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        -- Convert status to proper case without using INITCAP
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (
            NEW.client_id,
            'Appointment ' || CASE NEW.status::text
                WHEN 'pending' THEN 'Pending'
                WHEN 'confirmed' THEN 'Confirmed'
                WHEN 'cancelled' THEN 'Cancelled'
                WHEN 'completed' THEN 'Completed'
                ELSE NEW.status::text
            END,
            'Your appointment for ' || NEW.appointment_date::date || ' has been ' || NEW.status::text,
            'appointment'
        );
    END IF;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_user_profile(user_id uuid, user_email character varying, user_full_name character varying, user_role character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  -- Insert into users table
  INSERT INTO users (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    user_email,
    user_full_name,
    user_role,
    NOW(),
    NOW()
  );

  -- Create profile
  INSERT INTO profiles (
    id,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    NOW(),
    NOW()
  );

  result := json_build_object(
    'success', true,
    'message', 'Profile created successfully'
  );

  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := json_build_object(
    'success', false,
    'message', SQLERRM
  );
  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_available_time_slots(p_date date, p_service_id uuid)
 RETURNS TABLE(time_slot text, is_available boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    service_duration INTEGER;
    start_time TIME := '09:00:00'::TIME;
    end_time TIME := '17:00:00'::TIME;
    slot_interval INTERVAL := '30 minutes';
    current_slot TIME;
BEGIN
    -- Get service duration
    SELECT duration INTO service_duration
    FROM services
    WHERE id = p_service_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Service not found';
    END IF;

    -- Generate time slots
    FOR current_slot IN 
        SELECT time_slot::TIME
        FROM generate_series(
            start_time,
            end_time - slot_interval,
            slot_interval
        ) AS time_slot
    LOOP
        time_slot := TO_CHAR(current_slot, 'HH:MI AM');
        is_available := check_appointment_availability(p_date, time_slot, p_service_id);
        RETURN NEXT;
    END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_client_appointments(p_client_id uuid)
 RETURNS TABLE(id uuid, client_id uuid, worker_id uuid, service_id uuid, appointment_date timestamp with time zone, appointment_time text, status appointment_status, notes text, created_at timestamp with time zone, updated_at timestamp with time zone, service jsonb, worker jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.client_id,
        a.worker_id,
        a.service_id,
        a.appointment_date,
        a.time as appointment_time,
        a.status,
        a.notes,
        a.created_at,
        a.updated_at,
        jsonb_build_object(
            'id', s.id,
            'name', s.name,
            'description', s.description,
            'duration', s.duration,
            'price', s.price,
            'category', s.category,
            'image_url', s.image_url,
            'is_active', s.is_active,
            'created_at', s.created_at,
            'updated_at', s.updated_at
        ) as service,
        CASE 
            WHEN w.id IS NOT NULL THEN
                jsonb_build_object(
                    'id', w.id,
                    'full_name', w.full_name,
                    'email', w.email
                )
            ELSE NULL
        END as worker
    FROM appointments a
    LEFT JOIN services s ON s.id = a.service_id
    LEFT JOIN users w ON w.id = a.worker_id
    WHERE a.client_id = p_client_id
    ORDER BY a.appointment_date DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_client_profile(p_client_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'profile', jsonb_build_object(
            'id', u.id,
            'email', u.email,
            'full_name', u.full_name,
            'phone', u.phone,
            'role', u.role,
            'is_active', u.is_active,
            'created_at', u.created_at,
            'updated_at', u.updated_at,
            'client_profile', jsonb_build_object(
                'id', p.id,
                'date_of_birth', p.date_of_birth,
                'gender', p.gender,
                'preferred_contact', p.preferred_contact,
                'emergency_contact_name', p.emergency_contact_name,
                'emergency_contact_phone', p.emergency_contact_phone,
                'allergies', p.allergies,
                'medical_conditions', p.medical_conditions,
                'skin_concerns', p.skin_concerns,
                'hair_type', p.hair_type,
                'preferred_worker_id', p.preferred_worker_id,
                'preferences', p.preferences,
                'last_visit_date', p.last_visit_date,
                'total_visits', p.total_visits,
                'total_spent', p.total_spent,
                'loyalty_points', p.loyalty_points,
                'created_at', p.created_at,
                'updated_at', p.updated_at,
                'address', p.address,
                'avatar_url', p.avatar_url
            ),
            'preferred_worker', (
                SELECT jsonb_build_object(
                    'id', w.id,
                    'full_name', w.full_name,
                    'email', w.email
                )
                FROM users w
                WHERE w.id = p.preferred_worker_id
            ),
            'upcoming_appointments', (
                SELECT jsonb_agg(jsonb_build_object(
                    'id', a.id,
                    'appointment_date', a.appointment_date,
                    'time', a.time,
                    'status', a.status,
                    'service', jsonb_build_object(
                        'id', s.id,
                        'name', s.name,
                        'duration', s.duration,
                        'price', s.price
                    )
                ))
                FROM appointments a
                JOIN services s ON s.id = a.service_id
                WHERE a.client_id = u.id
                AND a.appointment_date >= CURRENT_DATE
                AND a.status NOT IN ('cancelled', 'completed')
                ORDER BY a.appointment_date ASC
                LIMIT 5
            ),
            'recent_services', (
                SELECT jsonb_agg(jsonb_build_object(
                    'id', s.id,
                    'name', s.name,
                    'duration', s.duration,
                    'price', s.price,
                    'appointment_date', a.appointment_date
                ))
                FROM appointments a
                JOIN services s ON s.id = a.service_id
                WHERE a.client_id = u.id
                AND a.status = 'completed'
                ORDER BY a.appointment_date DESC
                LIMIT 5
            )
        )
    ) INTO result
    FROM users u
    LEFT JOIN profiles p ON p.id = u.id
    WHERE u.id = p_client_id;

    RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_service_statistics(p_service_id uuid)
 RETURNS TABLE(total_appointments integer, completed_appointments integer, cancelled_appointments integer, average_rating numeric, total_reviews integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(a.id)::INTEGER AS total_appointments,
    COUNT(a.id) FILTER (WHERE a.status = 'completed')::INTEGER AS completed_appointments,
    COUNT(a.id) FILTER (WHERE a.status = 'cancelled')::INTEGER AS cancelled_appointments,
    ROUND(AVG(r.rating)::NUMERIC, 2) AS average_rating,
    COUNT(r.id)::INTEGER AS total_reviews
  FROM services s
  LEFT JOIN appointments a ON a.service_id = s.id
  LEFT JOIN reviews r ON r.appointment_id = a.id
  WHERE s.id = p_service_id
  GROUP BY s.id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_upcoming_appointments(p_user_id uuid, p_role character varying DEFAULT NULL::character varying)
 RETURNS TABLE(id uuid, client_name character varying, worker_name character varying, service_name character varying, appointment_date timestamp with time zone, appointment_time character varying, status character varying, notes text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    c.full_name AS client_name,
    w.full_name AS worker_name,
    s.name AS service_name,
    a.appointment_date,
    a."time" AS appointment_time,
    a.status,
    a.notes
  FROM appointments a
  JOIN users c ON c.id = a.client_id
  LEFT JOIN users w ON w.id = a.worker_id
  JOIN services s ON s.id = a.service_id
  WHERE (
    CASE 
      WHEN p_role = 'client' THEN a.client_id = p_user_id
      WHEN p_role = 'worker' THEN a.worker_id = p_user_id
      WHEN p_role = 'admin' THEN true
      ELSE a.client_id = p_user_id OR a.worker_id = p_user_id
    END
  )
  AND a.appointment_date >= CURRENT_DATE
  AND a.status NOT IN ('cancelled', 'completed')
  ORDER BY a.appointment_date, a."time";
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_profile(user_id uuid)
 RETURNS TABLE(id uuid, email character varying, full_name character varying, phone character varying, role character varying, address text, avatar_url text, is_active boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.phone,
    u.role::VARCHAR,
    p.address,
    p.avatar_url,
    u.is_active
  FROM users u
  LEFT JOIN profiles p ON p.id = u.id
  WHERE u.id = user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
SET search_path = public
AS $$
declare
  default_role text := 'client';
begin
  -- Insert into users table with error handling
  BEGIN
    -- Check if user already exists
    IF EXISTS (SELECT 1 FROM public.users WHERE id = new.id) THEN
      RETURN new;
    END IF;

  insert into public.users (
    id,
    email,
    full_name,
    role,
      phone,
    is_active,
    created_at,
    updated_at
  ) values (
    new.id,
    new.email,
      coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      default_role,
      null,
    true,
    now(),
    now()
  );

    -- Create profile immediately after user
    insert into public.profiles (
      id,
      preferred_contact,
      total_visits,
      total_spent,
      loyalty_points,
      created_at,
      updated_at
    ) values (
      new.id,
      'email',
      0,
      0.00,
      0,
      now(),
      now()
    );

  EXCEPTION 
    WHEN unique_violation THEN
      RETURN new;
    WHEN others THEN
      raise warning 'Error in handle_new_user for id %: %', new.id, SQLERRM;
      RETURN new;
  END;

  return new;
end;
$$;

-- Drop the separate profile handler since we're handling it in handle_new_user
DROP FUNCTION IF EXISTS public.handle_new_profile() CASCADE;

-- Drop existing triggers first
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
DROP TRIGGER IF EXISTS sync_user_role ON public.users;
DROP TRIGGER IF EXISTS handle_new_profile_trigger ON auth.users;
DROP TRIGGER IF EXISTS sync_user_role_trigger ON public.users;

-- Create triggers in correct order
CREATE TRIGGER handle_new_user_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER sync_user_role_trigger
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_role_to_auth();

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Workers can view profiles" ON profiles;
DROP POLICY IF EXISTS "Admins have full access" ON profiles;

-- Create updated policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Workers can view profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'worker'
            AND users.is_active = true
        )
    );

CREATE POLICY "Admins have full access"
    ON profiles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
            AND users.is_active = true
        )
    );

CREATE TRIGGER appointment_notification_trigger AFTER INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION create_appointment_notification();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER sync_user_role AFTER UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION sync_user_role_to_auth();

-- Drop existing policies for reviews if they exist
DROP POLICY IF EXISTS "Clients can create reviews" ON reviews;
DROP POLICY IF EXISTS "Clients can update reviews" ON reviews;
DROP POLICY IF EXISTS "Clients can view reviews" ON reviews;

-- Enable RLS on reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policy for creating reviews
CREATE POLICY "Clients can create reviews"
    ON reviews FOR INSERT
    TO authenticated
    WITH CHECK (
        client_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM appointments
            WHERE appointments.id = appointment_id
            AND appointments.client_id = auth.uid()
            AND appointments.status = 'completed'
        )
    );

-- Create policy for updating reviews
CREATE POLICY "Clients can update reviews"
    ON reviews FOR UPDATE
    TO authenticated
    USING (client_id = auth.uid())
    WITH CHECK (client_id = auth.uid());

-- Create policy for viewing reviews
CREATE POLICY "Clients can view reviews"
    ON reviews FOR SELECT
    TO authenticated
    USING (
        client_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM appointments
            WHERE appointments.id = reviews.appointment_id
            AND appointments.worker_id = auth.uid()
        )
    );

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for reviews table
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to count active clients for a worker
CREATE OR REPLACE FUNCTION count_active_clients(
  worker_id UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  client_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT client_id)
  INTO client_count
  FROM appointments
  WHERE worker_id = $1
  AND appointment_date >= $2
  AND appointment_date < $3;
  
  RETURN client_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION count_active_clients(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- Add reorder_point to products table
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS reorder_point integer NOT NULL DEFAULT 5;

-- Create stock alerts table
CREATE TABLE IF NOT EXISTS public.inventory_alerts (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    product_id uuid NOT NULL,
    alert_type varchar(50) NOT NULL,
    message text NOT NULL,
    is_resolved boolean DEFAULT false,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT inventory_alerts_pkey PRIMARY KEY (id),
    CONSTRAINT inventory_alerts_product_id_fkey FOREIGN KEY (product_id)
        REFERENCES public.products(id) ON DELETE CASCADE,
    CONSTRAINT inventory_alerts_type_check 
        CHECK (alert_type IN ('low_stock', 'out_of_stock', 'reorder_point'))
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_product ON inventory_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_resolved ON inventory_alerts(is_resolved);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_alerts ON inventory_alerts(product_id, alert_type) WHERE is_resolved = false;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to check stock levels and create alerts
CREATE OR REPLACE FUNCTION check_stock_levels()
RETURNS TRIGGER AS $$
DECLARE
    alert_message TEXT;
BEGIN
    -- Check if stock is zero
    IF NEW.stock_quantity = 0 THEN
        alert_message := 'Product "' || NEW.name || '" is out of stock.';
        INSERT INTO inventory_alerts (product_id, alert_type, message)
        VALUES (NEW.id, 'out_of_stock', alert_message)
        ON CONFLICT ON CONSTRAINT idx_unique_active_alerts DO NOTHING;
    -- Check if stock is below reorder point
    ELSIF NEW.stock_quantity <= NEW.reorder_point THEN
        alert_message := 'Product "' || NEW.name || '" is running low. Current stock: ' || 
                        NEW.stock_quantity || ', Reorder Point: ' || NEW.reorder_point;
        INSERT INTO inventory_alerts (product_id, alert_type, message)
        VALUES (NEW.id, 'low_stock', alert_message)
        ON CONFLICT ON CONSTRAINT idx_unique_active_alerts DO NOTHING;
    END IF;

    -- If stock is above reorder point, resolve any existing alerts
    IF NEW.stock_quantity > NEW.reorder_point THEN
        UPDATE inventory_alerts
        SET is_resolved = true,
            resolved_at = CURRENT_TIMESTAMP
        WHERE product_id = NEW.id
          AND is_resolved = false;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock monitoring
DROP TRIGGER IF EXISTS check_product_stock ON products;
CREATE TRIGGER check_product_stock
    AFTER INSERT OR UPDATE OF stock_quantity
    ON products
    FOR EACH ROW
    EXECUTE FUNCTION check_stock_levels();

-- Function to get low stock products
CREATE OR REPLACE FUNCTION get_low_stock_products(
    p_category_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    name varchar,
    stock_quantity integer,
    reorder_point integer,
    category_name varchar,
    alert_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.stock_quantity,
        p.reorder_point,
        pc.name as category_name,
        COUNT(ia.id) as alert_count
    FROM products p
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    LEFT JOIN inventory_alerts ia ON p.id = ia.product_id 
        AND ia.is_resolved = false
    WHERE 
        p.is_active = true
        AND p.stock_quantity <= p.reorder_point
        AND (p_category_id IS NULL OR p.category_id = p_category_id)
    GROUP BY p.id, p.name, p.stock_quantity, p.reorder_point, pc.name
    ORDER BY p.stock_quantity ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to resolve alerts
CREATE OR REPLACE FUNCTION resolve_inventory_alert(
    p_alert_id uuid
)
RETURNS boolean AS $$
BEGIN
    UPDATE inventory_alerts
    SET is_resolved = true,
        resolved_at = CURRENT_TIMESTAMP
    WHERE id = p_alert_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view inventory alerts"
    ON inventory_alerts FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'worker'
            AND users.is_active = true
        )
    );

CREATE POLICY "Workers can update inventory alerts"
    ON inventory_alerts FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'worker'
            AND users.is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'worker'
            AND users.is_active = true
        )
    );

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_low_stock_products(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_inventory_alert(uuid) TO authenticated;

-- Create transaction management functions
CREATE OR REPLACE FUNCTION begin_transaction()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    transaction_id TEXT;
BEGIN
    transaction_id := gen_random_uuid()::TEXT;
    RETURN jsonb_build_object('transaction_id', transaction_id);
END;
$$;

CREATE OR REPLACE FUNCTION commit_transaction(transaction_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Transaction is already handled by Supabase
    -- This function exists for consistency and future extensions
    RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION rollback_transaction(transaction_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Transaction is already handled by Supabase
    -- This function exists for consistency and future extensions
    RETURN;
END;
$$;

-- Create function to decrement product stock
CREATE OR REPLACE FUNCTION decrement_product_stock(
    p_product_id UUID,
    p_quantity INTEGER
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_stock INTEGER;
    v_product_name TEXT;
BEGIN
    -- Get current stock and product name
    SELECT stock_quantity, name 
    INTO v_current_stock, v_product_name
    FROM products 
    WHERE id = p_product_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Product not found'
        );
    END IF;
    
    -- Check if we have enough stock
    IF v_current_stock < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', format('Insufficient stock for product "%s". Available: %s, Requested: %s', 
                            v_product_name, v_current_stock, p_quantity)
        );
    END IF;
    
    -- Update the stock
    UPDATE products
    SET 
        stock_quantity = GREATEST(0, stock_quantity - p_quantity),
        updated_at = NOW()
    WHERE id = p_product_id;
    
    -- Check if stock alert needs to be created
    PERFORM check_stock_levels();
    
    RETURN jsonb_build_object(
        'success', true,
        'message', format('Successfully updated stock for "%s"', v_product_name),
        'new_stock_quantity', GREATEST(0, v_current_stock - p_quantity)
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM,
        'details', format('Error updating stock: %s', SQLERRM)
    );
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION begin_transaction() TO authenticated;
GRANT EXECUTE ON FUNCTION commit_transaction(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rollback_transaction(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_product_stock(UUID, INTEGER) TO authenticated;



import { Database as DatabaseGenerated } from '@/types/supabase'

// Re-export the generated database type
export type Database = DatabaseGenerated & {
  public: {
    Tables: {
      notifications: NotificationTable
    } & DatabaseGenerated['public']['Tables']
  }
}

export type Tables = Database['public']['Tables']
export type Enums = Database['public']['Enums']

// Enum types
export type AppointmentStatusEnum = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type ContactPreferenceEnum = 'email' | 'phone' | 'sms'
export type UserRoleEnum = 'admin' | 'worker' | 'client'
export type NotificationStatus = 'unread' | 'read' | 'archived'

// Specific table types
export type User = TableRow<'users'>
export type Profile = TableRow<'profiles'>
export type Service = TableRow<'services'>
export type Appointment = TableRow<'appointments'>
export type Sale = TableRow<'sales'>
export type SaleItem = TableRow<'sale_items'>
export type Product = TableRow<'products'>
export type ProductCategory = TableRow<'product_categories'>
export type Review = TableRow<'reviews'>
export type Notification = TableRow<'notifications'>

// Define the notifications table type
export interface NotificationTable {
  Row: {
    id: string
    user_id: string
    title: string
    message: string
    status: NotificationStatus
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    user_id: string
    title: string
    message: string
    status?: NotificationStatus
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    title?: string
    message?: string
    status?: NotificationStatus
    updated_at?: string
  }
}

// Join types
export interface AppointmentWithRelations extends Omit<Appointment, 'service'> {
  client: Pick<User, 'id' | 'full_name' | 'email'> | null
  worker: Pick<User, 'id' | 'full_name' | 'email'> | null
  service: Service | null
}

export interface SaleWithRelations extends Sale {
  client: Pick<User, 'id' | 'full_name' | 'email'> | null
  worker: Pick<User, 'id' | 'full_name' | 'email'> | null
  service: Service | null
  items: (SaleItem & {
    product: Product & {
      category: ProductCategory | null
    }
  })[]
}

export interface ProductWithRelations extends Product {
  category: ProductCategory | null
}

// Helper type for getting table rows
export type TableRow<T extends keyof Tables> = Tables[T]['Row']
export type TableInsert<T extends keyof Tables> = Tables[T]['Insert']
export type TableUpdate<T extends keyof Tables> = Tables[T]['Update']

// Helper type for database results
export type DbResult<T> = T extends keyof Database['public']['Tables'] 
  ? Database['public']['Tables'][T]['Row']
  : never

export type DbResultWithRelations<T extends keyof Database['public']['Tables']> = 
  T extends 'appointments' 
    ? AppointmentWithRelations
    : T extends 'sales'
    ? SaleWithRelations
    : T extends 'products'
    ? ProductWithRelations
    : Database['public']['Tables'][T]['Row']

// JSON type
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Common types
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mpesa'
export type PaymentStatus = 'pending' | 'completed' | 'refunded' | 'failed'
export type SaleType = 'product' | 'service' | 'package'
export type AppointmentStatus = AppointmentStatusEnum
export type UserRole = UserRoleEnum
export type ContactPreference = ContactPreferenceEnum

// Notification types (not in database)
export interface NotificationDisplay {
  id: string
  user_id: string
  title: string
  message: string
  type: 'appointment' | 'system' | 'reminder'
  is_read: boolean
  created_at: string
  updated_at: string
}

export interface AppointmentRow extends TableRow<'appointments'> {
  client_id: string;
  worker_id: string | null;
  service_id: string;
  appointment_date: string;
  time: string;
  status: AppointmentStatusEnum;
  notes: string | null;
}

export interface AppointmentDisplay {
  id: string;
  service: string;
  worker: string;
  appointment_date: string;
  formatted_date: string;
  status: AppointmentStatusEnum;
  is_past: boolean;
  notes: string;
  service_details?: {
    id: string;
    name: string;
    category: string;
  };
} 
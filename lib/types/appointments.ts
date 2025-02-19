import { Database } from './database'

// Base types from database
export type AppointmentRow = Database['public']['Tables']['appointments']['Row']
export type ServiceRow = Database['public']['Tables']['services']['Row']
export type UserRow = Database['public']['Tables']['users']['Row']

// Enum types
export type AppointmentStatusEnum = 'pending' | 'confirmed' | 'cancelled' | 'completed'

// Enhanced types with relations
export interface AppointmentDisplay {
  id: string
  client_id: string
  service_id: string
  worker_id: string | null
  appointment_date: string
  time: string
  status: AppointmentStatusEnum
  notes: string
  created_at: string
  updated_at: string
  service: {
    id: string
    name: string
    description: string | null
    duration: number
    price: number
    category: string
    image_url: string | null
    is_active: boolean
    created_at: string
    updated_at: string
  }
  client: {
    id: string
    full_name: string
    email: string
    phone: string | null
  }
  worker?: {
    id: string
    full_name: string
    email: string
  } | null
  formatted_date: string
  is_past: boolean
}

// Input types for creating/updating appointments
export interface CreateAppointmentInput {
  client_id?: string
  service_id: string
  appointment_date: string
  time: string
  notes?: string
}

export interface UpdateAppointmentInput {
  worker_id?: string | null
  status?: AppointmentStatusEnum
  notes?: string
}

// Time slot management
export interface TimeSlot {
  time: string
  isBooked: boolean
}

// Dashboard statistics
export interface AppointmentStats {
  todaysAppointments: number
  activeClients: number
  pendingAppointments: number
  completedAppointments: number
}

// Response types
export interface AppointmentResponse {
  data: AppointmentDisplay | null
  error: Error | null
}

export interface AppointmentsListResponse {
  data: AppointmentDisplay[]
  error: Error | null
}

// Filter types
export interface AppointmentFilters {
  status?: AppointmentStatusEnum
  startDate?: string
  endDate?: string
  workerId?: string
  clientId?: string
  serviceId?: string
}

// Pagination types
export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedAppointmentsResponse {
  data: AppointmentDisplay[]
  count: number
  error: Error | null
} 
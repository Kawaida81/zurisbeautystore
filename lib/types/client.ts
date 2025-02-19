import { User, Appointment, Service } from '@/lib/types'

export type ContactPreference = 'email' | 'phone' | 'sms'

export interface ClientProfile {
  id: string
  preferred_contact: ContactPreference
  preferred_worker_id: string | null
  last_visit_date: string | null
  total_visits: number
  total_spent: number
  loyalty_points: number
  created_at: string
  updated_at: string
}

export interface ClientProfileWithRelations extends ClientProfile {
  user: User
  preferred_worker?: User
  upcoming_appointments?: Appointment[]
  recent_services?: Service[]
}

export interface ClientProfileFormData {
  preferred_contact?: ContactPreference
  preferred_worker_id?: string
}

export interface ClientStats {
  total_appointments: number
  completed_appointments: number
  cancelled_appointments: number
  total_spent: number
  loyalty_points: number
  favorite_services: Array<{
    service_id: string
    service_name: string
    count: number
  }>
  recent_visits: Array<{
    date: string
    service_name: string
    worker_name: string
  }>
} 
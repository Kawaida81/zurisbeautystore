export interface Service {
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

export interface Appointment {
  id: string
  client_id: string
  worker_id: string | null
  service_id: string
  appointment_date: string
  time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes: string | null
  created_at: string
  updated_at: string
  // Joined fields
  worker?: {
    id: string
    full_name: string
    email: string
  }
  service?: {
    name: string
    duration: number
    price: number
  }
}

export interface Review {
  id: string
  client_id: string
  appointment_id: string
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'appointment' | 'system' | 'reminder'
  is_read: boolean
  created_at: string
}

export interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'worker' | 'client'
  is_active: boolean
  created_at: string
  updated_at: string
  phone?: string | null
  address?: string | null
}

export interface QuickStat {
  title: string
  value: string | number
  icon: React.ReactNode
  description: string
} 
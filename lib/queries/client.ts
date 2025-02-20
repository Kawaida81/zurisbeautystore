import { createClient } from '@/lib/supabase/server'
import type { Appointment, Service, Review, Notification } from '@/lib/types'
import { Database } from '@/lib/types/database'

export const runtime = "edge"

export async function getServices() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('name') as {
      data: Service[] | null,
      error: any
    }

  if (error) throw error
  if (!data) return []
  return data
}

export async function getAppointments(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      worker:worker_id (
        id,
        full_name,
        email
      ),
      service:service_id (
        name,
        duration,
        price
      )
    `)
    .eq('client_id', userId)
    .order('appointment_date', { ascending: true }) as {
      data: Appointment[] | null,
      error: any
    }

  if (error) throw error
  if (!data) return []
  return data
}

export async function createAppointment(appointment: Partial<Appointment>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('appointments')
    .insert([appointment])
    .select() as {
      data: Appointment[] | null,
      error: any
    }

  if (error) throw error
  if (!data || !data[0]) throw new Error('Failed to create appointment')
  return data[0]
}

export async function updateAppointment(id: string, updates: Partial<Appointment>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .select() as {
      data: Appointment[] | null,
      error: any
    }

  if (error) throw error
  if (!data || !data[0]) throw new Error('Failed to update appointment')
  return data[0]
}

export async function getReviews(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('client_id', userId)
    .order('created_at', { ascending: false }) as {
      data: Review[] | null,
      error: any
    }

  if (error) throw error
  if (!data) return []
  return data
}

export async function createReview(review: Partial<Review>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reviews')
    .insert([review])
    .select() as {
      data: Review[] | null,
      error: any
    }

  if (error) throw error
  if (!data || !data[0]) throw new Error('Failed to create review')
  return data[0]
}

export async function updateReview(id: string, updates: Partial<Review>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reviews')
    .update(updates)
    .eq('id', id)
    .select() as {
      data: Review[] | null,
      error: any
    }

  if (error) throw error
  if (!data || !data[0]) throw new Error('Failed to update review')
  return data[0]
}

export async function getNotifications(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false }) as {
      data: Notification[] | null,
      error: any
    }

  if (error) throw error
  if (!data) return []
  return data
}

export async function markNotificationAsRead(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)

  if (error) throw error
}

export async function markAllNotificationsAsRead(userId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)

  if (error) throw error
}

export async function getUpcomingAppointments(userId: string) {
  const supabase = createClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      worker:worker_id (
        id,
        full_name,
        email
      ),
      service:service_id (
        name,
        duration,
        price
      )
    `)
    .eq('client_id', userId)
    .gte('appointment_date', today.toISOString())
    .order('appointment_date', { ascending: true })
    .limit(5) as {
      data: Appointment[] | null,
      error: any
    }

  if (error) throw error
  if (!data) return []
  return data
}

export async function getPastAppointments(userId: string) {
  const supabase = createClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      worker:worker_id (
        id,
        full_name,
        email
      ),
      service:service_id (
        name,
        duration,
        price
      )
    `)
    .eq('client_id', userId)
    .lt('appointment_date', today.toISOString())
    .order('appointment_date', { ascending: false }) as {
      data: Appointment[] | null,
      error: any
    }

  if (error) throw error
  if (!data) return []
  return data
}

export async function checkTimeSlotAvailability(date: Date, time: string) {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('appointments')
    .select('*', { count: 'exact' })
    .eq('appointment_date', date.toISOString().split('T')[0])
    .eq('time', time)
    .eq('status', 'confirmed')

  if (error) throw error
  return count === 0
} 
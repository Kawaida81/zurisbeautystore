import { createClient } from '@/lib/supabase/client'
import type { Appointment, Service, Review, Notification } from '@/lib/types'

export async function getServices() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data as Service[]
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
    .order('appointment_date', { ascending: true })

  if (error) throw error
  return data as Appointment[]
}

export async function createAppointment(appointment: Partial<Appointment>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('appointments')
    .insert([appointment])
    .select()

  if (error) throw error
  return data[0] as Appointment
}

export async function updateAppointment(id: string, updates: Partial<Appointment>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .select()

  if (error) throw error
  return data[0] as Appointment
}

export async function getReviews(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('client_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Review[]
}

export async function createReview(review: Partial<Review>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reviews')
    .insert([review])
    .select()

  if (error) throw error
  return data[0] as Review
}

export async function updateReview(id: string, updates: Partial<Review>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reviews')
    .update(updates)
    .eq('id', id)
    .select()

  if (error) throw error
  return data[0] as Review
}

export async function getNotifications(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Notification[]
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
    .limit(5)

  if (error) throw error
  return data as Appointment[]
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
    .order('appointment_date', { ascending: false })

  if (error) throw error
  return data as Appointment[]
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
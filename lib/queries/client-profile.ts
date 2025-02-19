import { createClient } from '@/lib/supabase/client'
import type { ClientProfile, ClientProfileFormData, ClientStats, ClientProfileWithRelations } from '@/lib/types/client'

interface ProfileResponse {
  profile: ClientProfileWithRelations
}

interface ServiceWithName {
  service_id: string
  services: {
    name: string
  }
}

interface VisitWithDetails {
  appointment_date: string
  services: {
    name: string
  }
  worker: {
    full_name: string
  }
}

interface AppointmentStatus {
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
}

export async function getClientProfile(userId: string): Promise<ClientProfileWithRelations> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .rpc('get_client_profile', { client_id: userId })
    .single()

  if (error) {
    console.error('Error fetching client profile:', error)
    throw error
  }

  if (!data) {
    throw new Error('Client profile not found')
  }

  const typedData = data as ProfileResponse
  return typedData.profile
}

export async function updateClientProfile(
  userId: string,
  updates: ClientProfileFormData
): Promise<ClientProfile> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('client_profiles')
    .update(updates)
    .eq('id', userId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating client profile:', error)
    throw error
  }

  return data
}

export async function getClientStats(userId: string): Promise<ClientStats> {
  const supabase = createClient()

  // Get appointment statistics
  const { data: appointmentStats, error: appointmentError } = await supabase
    .from('appointments')
    .select('status')
    .eq('client_id', userId)

  if (appointmentError) throw appointmentError

  // Get favorite services
  const { data: rawFavoriteServices, error: servicesError } = await supabase
    .from('appointments')
    .select(`
      service_id,
      services:service_id (
        name
      )
    `)
    .eq('client_id', userId)
    .eq('status', 'completed')

  if (servicesError) throw servicesError

  // Transform the raw data into the expected format
  const favoriteServices = rawFavoriteServices.map(service => ({
    service_id: service.service_id,
    services: {
      name: service.services[0]?.name || ''
    }
  })) as ServiceWithName[]

  // Get recent visits
  const { data: rawRecentVisits, error: visitsError } = await supabase
    .from('appointments')
    .select(`
      appointment_date,
      services:service_id (
        name
      ),
      worker:worker_id (
        full_name
      )
    `)
    .eq('client_id', userId)
    .eq('status', 'completed')
    .order('appointment_date', { ascending: false })
    .limit(5)

  if (visitsError) throw visitsError

  // Transform the raw data into the expected format
  const recentVisits = rawRecentVisits.map(visit => ({
    appointment_date: visit.appointment_date,
    services: {
      name: visit.services[0]?.name || ''
    },
    worker: {
      full_name: visit.worker[0]?.full_name || ''
    }
  })) as VisitWithDetails[]

  // Process appointment statistics
  const total_appointments = appointmentStats.length
  const completed_appointments = (appointmentStats as AppointmentStatus[]).filter(a => a.status === 'completed').length
  const cancelled_appointments = (appointmentStats as AppointmentStatus[]).filter(a => a.status === 'cancelled').length

  // Process favorite services
  const serviceCount = favoriteServices.reduce((acc: Record<string, number>, curr) => {
    const id = curr.service_id
    acc[id] = (acc[id] || 0) + 1
    return acc
  }, {})

  const favorite_services = Object.entries(serviceCount)
    .map(([service_id, count]) => ({
      service_id,
      service_name: favoriteServices.find(s => s.service_id === service_id)?.services.name || '',
      count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Process recent visits
  const recent_visits = recentVisits.map(visit => ({
    date: visit.appointment_date,
    service_name: visit.services.name,
    worker_name: visit.worker.full_name
  }))

  // Get client profile for loyalty points and total spent
  const { data: profile, error: profileError } = await supabase
    .from('client_profiles')
    .select('loyalty_points, total_spent')
    .eq('id', userId)
    .single()

  if (profileError) throw profileError

  return {
    total_appointments,
    completed_appointments,
    cancelled_appointments,
    total_spent: profile.total_spent,
    loyalty_points: profile.loyalty_points,
    favorite_services,
    recent_visits
  }
}

export async function getPreferredWorkers() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('role', 'worker')
    .eq('is_active', true)
    .order('full_name')

  if (error) {
    console.error('Error fetching workers:', error)
    throw error
  }

  return data
}

export async function updateClientPreferences(
  userId: string,
  preferences: Record<string, any>
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('client_profiles')
    .update({
      preferences,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating client preferences:', error)
    throw error
  }
} 
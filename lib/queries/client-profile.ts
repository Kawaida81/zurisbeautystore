import { createClient } from '@/lib/supabase/client'
import type { ClientProfile, ClientProfileFormData, ClientStats, ClientProfileWithRelations } from '@/lib/types/client'
import type { Appointment, Service, User } from '@/lib/types'
import { Database } from '@/lib/types/database'

interface ProfileResponse {
  profile: ClientProfileWithRelations
}

interface ServiceWithName {
  service_id: string
  service: {
    name: string
  }
}

interface VisitWithDetails {
  appointment_date: string
  service: {
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
    .from('profiles')
    .update(updates as Record<string, unknown>)
    .eq('id', userId)
    .select('*')
    .single() as { 
      data: ClientProfile | null, 
      error: any 
    }

  if (error) {
    console.error('Error updating client profile:', error)
    throw error
  }

  if (!data) {
    throw new Error('Failed to update client profile')
  }

  return data
}

export async function getClientStats(userId: string): Promise<ClientStats> {
  const supabase = createClient()

  // Get appointment statistics
  const { data: appointmentStats, error: appointmentError } = await supabase
    .from('appointments')
    .select('status')
    .eq('client_id', userId) as {
      data: Appointment[] | null,
      error: any
    }

  if (appointmentError) throw appointmentError
  if (!appointmentStats) throw new Error('Failed to fetch appointment stats')

  // Get favorite services
  const { data: rawFavoriteServices, error: servicesError } = await supabase
    .from('appointments')
    .select(`
      service_id,
      service:service_id (
        name
      )
    `)
    .eq('client_id', userId)
    .eq('status', 'completed') as {
      data: (Appointment & { service: Pick<Service, 'name'> })[] | null,
      error: any
    }

  if (servicesError) throw servicesError
  if (!rawFavoriteServices) throw new Error('Failed to fetch favorite services')

  // Transform the raw data into the expected format
  const favoriteServices = rawFavoriteServices.map(service => ({
    service_id: service.service_id,
    service: {
      name: service.service?.name || ''
    }
  })) as ServiceWithName[]

  // Get recent visits
  const { data: rawRecentVisits, error: visitsError } = await supabase
    .from('appointments')
    .select(`
      appointment_date,
      service:service_id (
        name
      ),
      worker:worker_id (
        full_name
      )
    `)
    .eq('client_id', userId)
    .eq('status', 'completed')
    .order('appointment_date', { ascending: false })
    .limit(5) as {
      data: (Appointment & { 
        service: Pick<Service, 'name'>,
        worker: Pick<User, 'full_name'>
      })[] | null,
      error: any
    }

  if (visitsError) throw visitsError
  if (!rawRecentVisits) throw new Error('Failed to fetch recent visits')

  // Transform the raw data into the expected format
  const recentVisits = rawRecentVisits.map(visit => ({
    appointment_date: visit.appointment_date,
    service: {
      name: visit.service?.name || ''
    },
    worker: {
      full_name: visit.worker?.full_name || ''
    }
  })) as VisitWithDetails[]

  // Process appointment statistics
  const total_appointments = appointmentStats.length
  const completed_appointments = appointmentStats.filter(a => a.status === 'completed').length
  const cancelled_appointments = appointmentStats.filter(a => a.status === 'cancelled').length

  // Process favorite services
  const serviceCount = favoriteServices.reduce((acc: Record<string, number>, curr) => {
    const id = curr.service_id
    acc[id] = (acc[id] || 0) + 1
    return acc
  }, {})

  const favorite_services = Object.entries(serviceCount)
    .map(([service_id, count]) => ({
      service_id,
      service_name: favoriteServices.find(s => s.service_id === service_id)?.service.name || '',
      count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Process recent visits
  const recent_visits = recentVisits.map(visit => ({
    date: visit.appointment_date,
    service_name: visit.service.name,
    worker_name: visit.worker.full_name
  }))

  // Get client profile for loyalty points and total spent
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('loyalty_points, total_spent')
    .eq('id', userId)
    .single() as {
      data: Pick<ClientProfile, 'loyalty_points' | 'total_spent'> | null,
      error: any
    }

  if (profileError) throw profileError
  if (!profile) throw new Error('Failed to fetch client profile')

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
    .order('full_name') as {
      data: Pick<User, 'id' | 'full_name' | 'email'>[] | null,
      error: any
    }

  if (error) {
    console.error('Error fetching workers:', error)
    throw error
  }

  return data
}

export async function updateClientPreferences(
  userId: string,
  preferences: Record<string, unknown>
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('profiles')
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
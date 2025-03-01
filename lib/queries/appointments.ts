import { createClient } from '@/lib/supabase/client'
import { format, isBefore } from 'date-fns'
import type {
  AppointmentDisplay,
  AppointmentResponse,
  AppointmentsListResponse,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  AppointmentFilters,
  PaginationParams,
  PaginatedAppointmentsResponse,
  AppointmentStats
} from '@/lib/types/appointments'
import { createClient as serverClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'

export const runtime = "edge"

// Helper function to transform appointment data
const transformAppointment = (appointment: any): AppointmentDisplay => ({
  id: appointment.id,
  client_id: appointment.client_id,
  service_id: appointment.service_id,
  worker_id: appointment.worker_id,
  appointment_date: appointment.appointment_date,
  time: format(new Date(appointment.appointment_date), 'h:mm a'),
  status: appointment.status,
  notes: appointment.notes || '',
  created_at: appointment.created_at,
  updated_at: appointment.updated_at,
  service: appointment.service,
  client: appointment.client,
  worker: appointment.worker,
  formatted_date: format(new Date(appointment.appointment_date), 'MMMM d, yyyy'),
  is_past: isBefore(new Date(appointment.appointment_date), new Date())
})

// Get a single appointment by ID
export async function getAppointmentById(appointmentId: string): Promise<AppointmentResponse> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        service:services (
          id, name, description, duration, price, category,
          image_url, is_active, created_at, updated_at
        ),
        client:users!appointments_client_id_fkey (
          id, full_name, email, phone
        ),
        worker:users!appointments_worker_id_fkey (
          id, full_name, email
        )
      `)
      .eq('id', appointmentId)
      .single()

    if (error) throw error

    return {
      data: data ? transformAppointment(data) : null,
      error: null
    }
  } catch (error) {
    console.error('Error fetching appointment:', error)
    return {
      data: null,
      error: error as Error
    }
  }
}

// Get appointments with filters and pagination
export async function getAppointments(
  filters: AppointmentFilters = {},
  pagination: PaginationParams = { page: 1, limit: 10 }
): Promise<PaginatedAppointmentsResponse> {
  const supabase = createClient()
  try {
    let query = supabase
      .from('appointments')
      .select(`
        *,
        service:services (
          id, name, description, duration, price, category,
          image_url, is_active, created_at, updated_at
        ),
        client:users!appointments_client_id_fkey (
          id, full_name, email, phone
        ),
        worker:users!appointments_worker_id_fkey (
          id, full_name, email
        )
      `, { count: 'exact' })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.startDate) {
      query = query.gte('appointment_date', filters.startDate)
    }
    if (filters.endDate) {
      query = query.lte('appointment_date', filters.endDate)
    }
    if (filters.workerId) {
      query = query.eq('worker_id', filters.workerId)
    }
    if (filters.clientId) {
      query = query.eq('client_id', filters.clientId)
    }
    if (filters.serviceId) {
      query = query.eq('service_id', filters.serviceId)
    }

    // Add pagination
    const from = (pagination.page - 1) * pagination.limit
    query = query
      .order('appointment_date', { ascending: true })
      .range(from, from + pagination.limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: data ? data.map(transformAppointment) : [],
      count: count || 0,
      error: null
    }
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return {
      data: [],
      count: 0,
      error: error as Error
    }
  }
}

// Create a new appointment
export async function createAppointment(input: CreateAppointmentInput): Promise<AppointmentResponse> {
  const supabase = createClient()
  try {
    // Get current user first
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      throw new Error('Authentication error: ' + userError.message)
    }
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Verify user is a client
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (roleError) {
      throw new Error('Error verifying user role: ' + roleError.message)
    }

    if (!userData) {
      throw new Error('User profile not found')
    }

    if (userData.role !== 'client') {
      throw new Error('Only clients can create appointments')
    }

    if (!userData.is_active) {
      throw new Error('User account is not active')
    }

    // Get service details first
    const { data: serviceData, error: serviceError } = await supabase
      .from('services')
      .select('name')
      .eq('id', input.service_id)
      .single()

    if (serviceError || !serviceData) {
      throw new Error('Service not found')
    }

    // Create the appointment using the authenticated user's ID
    const { data, error } = await supabase
      .from('appointments')
      .insert([{
        client_id: user.id,
        service_id: input.service_id,
        service: serviceData.name,
        appointment_date: input.appointment_date,
        time: input.time,
        notes: input.notes,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select(`
        *,
        service:services (
          id, name, description, duration, price, category,
          image_url, is_active, created_at, updated_at
        ),
        client:users!appointments_client_id_fkey (
          id, full_name, email, phone
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error(error.message)
    }

    return {
      data: data ? transformAppointment(data) : null,
      error: null
    }
  } catch (error) {
    console.error('Error creating appointment:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('An unknown error occurred')
    }
  }
}

// Update an appointment
export async function updateAppointment(
  appointmentId: string,
  input: UpdateAppointmentInput
): Promise<AppointmentResponse> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update({
        worker_id: input.worker_id,
        status: input.status,
        notes: input.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select(`
        *,
        service:services (
          id, name, description, duration, price, category,
          image_url, is_active, created_at, updated_at
        ),
        client:users!appointments_client_id_fkey (
          id, full_name, email, phone
        ),
        worker:users!appointments_worker_id_fkey (
          id, full_name, email
        )
      `)
      .single()

    if (error) throw error

    return {
      data: data ? transformAppointment(data) : null,
      error: null
    }
  } catch (error) {
    console.error('Error updating appointment:', error)
    return {
      data: null,
      error: error as Error
    }
  }
}

// Get appointment statistics
export async function getAppointmentStats(workerId?: string): Promise<AppointmentStats> {
  const supabase = createClient()
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Get today's appointments
    let todayQuery = supabase.from('appointments').select('id').eq('appointment_date', today)
    if (workerId) {
      todayQuery = todayQuery.eq('worker_id', workerId)
    }
    const { data: todayData } = await todayQuery

    // Get active clients (clients with non-cancelled appointments)
    let activeClientsQuery = supabase.from('appointments').select('client_id').neq('status', 'cancelled')
    if (workerId) {
      activeClientsQuery = activeClientsQuery.eq('worker_id', workerId)
    }
    const { data: activeClientsData } = await activeClientsQuery

    // Get pending appointments
    let pendingQuery = supabase.from('appointments').select('id').eq('status', 'pending')
    if (workerId) {
      pendingQuery = pendingQuery.eq('worker_id', workerId)
    }
    const { data: pendingData } = await pendingQuery

    // Get completed appointments
    let completedQuery = supabase.from('appointments').select('id').eq('status', 'completed')
    if (workerId) {
      completedQuery = completedQuery.eq('worker_id', workerId)
    }
    const { data: completedData } = await completedQuery

    // Get unique active clients
    const uniqueClients = new Set(activeClientsData?.map(appointment => appointment.client_id))

    return {
      todaysAppointments: todayData?.length || 0,
      activeClients: uniqueClients.size,
      pendingAppointments: pendingData?.length || 0,
      completedAppointments: completedData?.length || 0
    }
  } catch (error) {
    console.error('Error fetching appointment stats:', error)
    return {
      todaysAppointments: 0,
      activeClients: 0,
      pendingAppointments: 0,
      completedAppointments: 0
    }
  }
} 
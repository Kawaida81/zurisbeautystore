'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Clock, Timer, DollarSign, User, Calendar, Mail, Phone, Users, CheckCircle } from 'lucide-react'
import { format, isBefore } from 'date-fns'
import { toast, Toaster } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AppointmentStatusEnum, Database } from '@/lib/types/database'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip"

type UserProfile = Database['public']['Tables']['users']['Row']

interface AppointmentDisplay {
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
  formatted_date: string
  is_past: boolean
}

interface DashboardStats {
  todaysAppointments: number;
  activeClients: number;
  pendingAppointments: number;
  completedAppointments: number;
}

interface AppointmentWithService {
  worker_id: string | null
  status: AppointmentStatusEnum
  service: {
    id: string
    name: string
    description: string | null
    duration: number
    price: number
    category: string
    image_url: string | null
    is_active: boolean
  } | null
}

// Add type for Supabase response
type AppointmentResponse = {
  worker_id: string | null
  status: AppointmentStatusEnum
  service: {
    id: string
    name: string
    description: string | null
    duration: number
    price: number
    category: string
    image_url: string | null
    is_active: boolean
  } | null
}

const getStatusColor = (status: AppointmentStatusEnum) => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    case 'completed':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusVariant = (status: AppointmentStatusEnum): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'confirmed':
      return 'default'
    case 'pending':
      return 'secondary'
    case 'cancelled':
      return 'destructive'
    case 'completed':
      return 'outline'
    default:
      return 'default'
  }
}

export default function WorkerAppointments() {
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<AppointmentDisplay[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentDisplay[]>([])
  const [appointmentFilter, setAppointmentFilter] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [claimingAppointments, setClaimingAppointments] = useState<Record<string, boolean>>({})
  const [appointmentToClaim, setAppointmentToClaim] = useState<AppointmentDisplay | null>(null)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    todaysAppointments: 0,
    activeClients: 0,
    pendingAppointments: 0,
    completedAppointments: 0
  })
      const supabase = createClient()

  const fetchAppointments = async (workerId: string) => {
    try {
      setLoading(true)
      setError(null)

      // Fetch appointments that are either:
      // 1. Pending (no worker assigned)
      // 2. Assigned to this worker
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          client_id,
          worker_id,
          service_id,
          appointment_date,
          time,
          status,
          notes,
          created_at,
          updated_at,
          service:services (
            id,
            name,
            description,
            duration,
            price,
            category,
            image_url,
            is_active,
            created_at,
            updated_at
          ),
          client:users!appointments_client_id_fkey (
            id,
            full_name,
            email,
            phone
          )
        `)
        .or(`worker_id.eq.${workerId},and(worker_id.is.null,status.eq.pending)`)
        .order('appointment_date', { ascending: true })

      if (appointmentsError) throw appointmentsError

      if (!appointmentsData || appointmentsData.length === 0) {
        setAppointments([])
        setFilteredAppointments([])
        return
      }

      const formattedAppointments: AppointmentDisplay[] = appointmentsData.map((appointment: any) => ({
        id: appointment.id,
        client_id: appointment.client_id,
        service_id: appointment.service_id,
        worker_id: appointment.worker_id,
        appointment_date: appointment.appointment_date,
        time: appointment.time,
        status: appointment.status,
        notes: appointment.notes || '',
        created_at: appointment.created_at,
        updated_at: appointment.updated_at,
        service: appointment.service,
        client: appointment.client,
        formatted_date: format(new Date(appointment.appointment_date), 'MMMM d, yyyy'),
        is_past: isBefore(new Date(appointment.appointment_date), new Date())
      }))

      setAppointments(formattedAppointments)
      setFilteredAppointments(formattedAppointments)
    } catch (err) {
      console.error('Error fetching appointments:', err)
      setError(err instanceof Error ? err.message : 'Failed to load appointments')
      toast.error('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  const handleClaimAppointment = async (appointmentId: string) => {
    if (!user) return

    try {
      // Update claiming state
      setClaimingAppointments(prev => ({ ...prev, [appointmentId]: true }))
      const supabase = createClient()

      // First, verify the appointment can be claimed
      const { data: rawData, error: fetchError } = await supabase
        .from('appointments')
        .select(`
          worker_id,
          status,
          service:services(
            id,
            name,
            description,
            duration,
            price,
            category,
            image_url,
            is_active
          )
        `)
        .eq('id', appointmentId)
        .single()

      if (fetchError) throw fetchError

      // Safely cast the response with proper type assertions
      const data = rawData as unknown as AppointmentResponse
      const appointment = {
        worker_id: data.worker_id,
        status: data.status,
        service: data.service
      }

      // Verify appointment ownership
      if (appointment.worker_id) {
        throw new Error('Appointment already claimed by another worker')
      }

      // Update the appointment
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ 
          worker_id: user.id,
          status: 'confirmed'
        })
        .eq('id', appointmentId)

      if (updateError) throw updateError

      // Refresh appointments list
      await fetchAppointments(user.id || '')

      toast.success('Appointment claimed successfully')
    } catch (error) {
      console.error('Error claiming appointment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to claim appointment')
    } finally {
      // Reset claiming state
      setClaimingAppointments(prev => ({ ...prev, [appointmentId]: false }))
    }
  }

  const handleStatusUpdate = async (appointmentId: string, newStatus: AppointmentStatusEnum) => {
    if (!user) return;
    
    try {
      // Get the current appointment state before making any changes
      const { data, error: checkError } = await supabase
        .from('appointments')
        .select(`
          worker_id,
          status,
          service:services (
            name
          )
        `)
        .eq('id', appointmentId)
        .single();

      if (checkError) throw checkError;

      // Type guard to ensure data exists and has the correct shape
      if (!data) {
        toast.error('Appointment not found');
        return;
      }

      // Safely type the response data with proper type assertions
      const currentAppointment = {
        worker_id: data.worker_id as string | null,
        status: data.status as AppointmentStatusEnum,
        service: data.service as unknown as { name: string } | null
      };

      // Verify appointment ownership
      if (!currentAppointment) {
        toast.error('Appointment not found');
        return;
      }

      if (currentAppointment.worker_id !== user.id) {
        toast.error('You are no longer assigned to this appointment');
        // Refresh appointments to get current state
        await fetchAppointments(user.id);
        return;
      }

      // Optimistically update the UI
      const appointmentToUpdate = appointments.find(app => app.id === appointmentId);
      if (!appointmentToUpdate) {
        toast.error('Appointment not found in current view');
        return;
      }

      const updatedAppointment = {
        ...appointmentToUpdate,
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // Update local state optimistically
      setAppointments(prev => prev.map(app => 
        app.id === appointmentId ? updatedAppointment : app
      ));

      // Make the API call
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .eq('worker_id', user.id);

      if (error) throw error;
      
      toast.success(`Appointment ${newStatus} successfully`, {
        description: `${currentAppointment.service?.name || 'Service'} has been marked as ${newStatus}`
      });
    } catch (error: any) {
      console.error('Error updating appointment status:', error);
      // Revert the optimistic update
      await fetchAppointments(user.id);
      toast.error('Failed to update appointment status', {
        description: error.message || 'Please try again later'
      });
    }
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get current user
        const { data: { user: userData }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        if (!userData) throw new Error('No authenticated user found')

        // Get user profile with proper typing
        const { data, error: profileError } = await supabase
          .from('users')
          .select()
          .eq('id', userData.id)
          .single()

        if (profileError) throw profileError
        if (!data) throw new Error('No user profile found')
        
        const userProfile = data as UserProfile
        setUser(userProfile)

        // Fetch appointments that are either:
        // 1. Pending (no worker assigned)
        // 2. Assigned to this worker
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select(`
            id,
            client_id,
            worker_id,
            service_id,
            appointment_date,
            time,
            status,
            notes,
            created_at,
            updated_at,
            service:services (
              id,
              name,
              description,
              duration,
              price,
              category,
              image_url,
              is_active,
              created_at,
              updated_at
            ),
            client:users!appointments_client_id_fkey (
              id,
              full_name,
              email,
              phone
            )
          `)
          .or(`worker_id.eq.${userProfile.id},and(worker_id.is.null,status.eq.pending)`)
          .order('appointment_date', { ascending: true })

        if (appointmentsError) throw appointmentsError

        if (!appointmentsData || appointmentsData.length === 0) {
          setAppointments([])
          setFilteredAppointments([])
          return
        }

        const formattedAppointments: AppointmentDisplay[] = appointmentsData.map((appointment: any) => ({
          id: appointment.id,
          client_id: appointment.client_id,
          service_id: appointment.service_id,
          worker_id: appointment.worker_id,
          appointment_date: appointment.appointment_date,
          time: appointment.time,
          status: appointment.status,
          notes: appointment.notes || '',
          created_at: appointment.created_at,
          updated_at: appointment.updated_at,
          service: appointment.service,
          client: appointment.client,
          formatted_date: format(new Date(appointment.appointment_date), 'MMMM d, yyyy'),
          is_past: isBefore(new Date(appointment.appointment_date), new Date())
        }))

        setAppointments(formattedAppointments)
        setFilteredAppointments(formattedAppointments)
      } catch (err) {
        console.error('Error fetching appointments:', err)
        setError(err instanceof Error ? err.message : 'Failed to load appointments')
        toast.error('Failed to load appointments')
      } finally {
        setLoading(false)
      }
    }

      fetchAppointments()

    // Set up real-time subscription
    const appointmentsSubscription = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        () => {
          fetchAppointments()
        }
      )
      .subscribe()

    return () => {
      appointmentsSubscription.unsubscribe()
    }
  }, [])

  // Move the filter function outside of useEffect and memoize it
  const getFilteredAppointments = useCallback((appointments: AppointmentDisplay[], filter: string) => {
    switch (filter) {
      case 'upcoming':
        return appointments.filter(
          (appointment) => !appointment.is_past && appointment.status !== 'cancelled'
        );
      case 'past':
        return appointments.filter(
          (appointment) => appointment.is_past
        );
      case 'pending':
        return appointments.filter(
          (appointment) => appointment.status === 'pending'
        );
      case 'confirmed':
        return appointments.filter(
          (appointment) => appointment.status === 'confirmed'
        );
      case 'cancelled':
        return appointments.filter(
          (appointment) => appointment.status === 'cancelled'
        );
      default:
        return appointments;
    }
  }, []);

  // Update the useEffect to use the memoized filter function
  useEffect(() => {
    const newFilteredAppointments = getFilteredAppointments(appointments, appointmentFilter);
    if (JSON.stringify(newFilteredAppointments) !== JSON.stringify(filteredAppointments)) {
      setFilteredAppointments(newFilteredAppointments);
    }
  }, [appointments, appointmentFilter, getFilteredAppointments]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user) return;

      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        // Get today's appointments count
        const { count: todaysCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact' })
          .eq('worker_id', user.id)
          .gte('appointment_date', today.toISOString())
          .lt('appointment_date', tomorrow.toISOString());

        // Get active clients (clients with appointments this month)
        const { count: activeClientsCount } = await supabase
          .rpc('count_active_clients', {
            worker_id: user.id,
            start_date: monthStart.toISOString(),
            end_date: tomorrow.toISOString()
          });

        // Get pending appointments count
        const { count: pendingCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact' })
          .eq('status', 'pending')
          .is('worker_id', null);

        // Get completed appointments count for this month
        const { count: completedCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact' })
          .eq('worker_id', user.id)
          .eq('status', 'completed')
          .gte('appointment_date', monthStart.toISOString())
          .lt('appointment_date', tomorrow.toISOString());

        setDashboardStats({
          todaysAppointments: todaysCount || 0,
          activeClients: activeClientsCount || 0,
          pendingAppointments: pendingCount || 0,
          completedAppointments: completedCount || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchDashboardStats();
  }, [user]);

  const initiateClaimAppointment = (appointment: AppointmentDisplay) => {
    setAppointmentToClaim(appointment);
  };

  const renderAppointmentActions = (appointment: AppointmentDisplay) => {
    // Show actions only for confirmed appointments that belong to the current worker
    if (appointment.worker_id === user?.id && appointment.status === 'confirmed' && !appointment.is_past) {
      return (
        <div className="flex gap-2 mt-4">
          <Button
            variant="default"
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => handleStatusUpdate(appointment.id, 'completed')}
          >
            Mark as Complete
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
          >
            Cancel
          </Button>
        </div>
      )
    }
    
    // Show claim button for pending appointments
    if (!appointment.worker_id && appointment.status === 'pending' && !appointment.is_past) {
      return (
        <Button
          className="w-full mt-4"
          onClick={() => initiateClaimAppointment(appointment)}
          disabled={claimingAppointments[appointment.id]}
        >
          {claimingAppointments[appointment.id] ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Claiming...
            </>
          ) : (
            'Claim Appointment'
          )}
        </Button>
      )
    }

    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B6B]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Appointments</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-8 max-w-[1600px]">
        <Toaster position="top-center" />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Appointments</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your client appointments</p>
          </div>
          <Select 
            defaultValue="all" 
            onValueChange={setAppointmentFilter}
            value={appointmentFilter}
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
              <SelectItem value="all">All Appointments</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-full">
                  <Calendar className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Today's Appointments</p>
                  <p className="text-2xl font-semibold text-gray-900">{dashboardStats.todaysAppointments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-full">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Clients</p>
                  <p className="text-2xl font-semibold text-gray-900">{dashboardStats.activeClients}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-50 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending Appointments</p>
                  <p className="text-2xl font-semibold text-gray-900">{dashboardStats.pendingAppointments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-full">
                  <CheckCircle className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Completed This Month</p>
                  <p className="text-2xl font-semibold text-gray-900">{dashboardStats.completedAppointments}</p>
                </div>
          </div>
            </CardContent>
          </Card>
        </div>

        {/* Appointments List */}
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-4">
            {filteredAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-600 mb-2">No appointments found</p>
                <p className="text-sm text-gray-400">Check back later for new appointments</p>
      </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredAppointments.map((appointment) => (
                  <Card key={appointment.id} className="bg-white hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="pb-4 border-b">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold truncate">
                            {appointment.service.name}
                          </CardTitle>
                          <p className="text-sm text-gray-500 mt-1 truncate">
                            {appointment.service.category}
                          </p>
                        </div>
                        <Badge
                          className={`${getStatusColor(appointment.status)} border px-2 py-1 rounded-md capitalize font-medium text-xs whitespace-nowrap`}
                        >
                          {appointment.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        {/* Time Section */}
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span className="font-medium text-gray-900 break-words">{appointment.formatted_date} at {appointment.time}</span>
                          </div>
                      </div>

                        {/* Client Section */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-900">Client Information</h4>
                          <div className="space-y-2">
                      <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-600 truncate">{appointment.client.full_name}</span>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2 cursor-pointer hover:text-gray-900 group">
                                  <Mail className="h-4 w-4 text-gray-400 flex-shrink-0 group-hover:text-gray-600" />
                                  <span className="text-sm text-gray-600 truncate group-hover:text-gray-900">{appointment.client.email}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>Click to copy email</TooltipContent>
                            </Tooltip>
                            {appointment.client.phone && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-2 cursor-pointer hover:text-gray-900 group">
                                    <Phone className="h-4 w-4 text-gray-400 flex-shrink-0 group-hover:text-gray-600" />
                                    <span className="text-sm text-gray-600 truncate group-hover:text-gray-900">{appointment.client.phone}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>Click to copy phone number</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>

                        {/* Service Details */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-900">Service Details</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                              <Timer className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-600 whitespace-nowrap">{appointment.service.duration} min</span>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                              <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-600 whitespace-nowrap">Kes {appointment.service.price.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {renderAppointmentActions(appointment)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Claim Confirmation Dialog */}
        <AlertDialog 
          open={!!appointmentToClaim} 
          onOpenChange={(open) => !open && setAppointmentToClaim(null)}
        >
        <AlertDialogContent>
          <AlertDialogHeader>
              <AlertDialogTitle>Claim Appointment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to claim this appointment for{' '}
                <span className="font-medium">
                  {appointmentToClaim?.service.name}
                </span>
                ? This will assign you as the worker for this service.
            </AlertDialogDescription>
          </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-green-600 hover:bg-green-700"
                onClick={() => appointmentToClaim && handleClaimAppointment(appointmentToClaim.id)}
              >
                Confirm Claim
              </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  )
} 
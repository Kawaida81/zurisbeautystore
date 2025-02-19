'use client'

import { Bell, Search, User, LogOut, Clock, Star, Loader2, Timer, DollarSign, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format, set, isBefore, isSameDay, addMinutes } from 'date-fns'
import { DropdownNavProps, DropdownProps } from "react-day-picker"
import Link from 'next/link'
import { toast, Toaster } from 'sonner'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip"
import {
  AppointmentDisplay,
  AppointmentStatusEnum,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  TimeSlot,
  AppointmentFilters,
  PaginationParams,
  ServiceRow
} from '@/lib/types/appointments'
import { TableRow } from '@/lib/types/database'
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  getAppointmentStats
} from '@/lib/queries/appointments'
import { UserRow } from '@/lib/types/appointments'

// Define interfaces for local use
type Service = ServiceRow

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'appointment' | 'system' | 'reminder'
  is_read: boolean
  created_at: string
}

interface AppointmentTime {
  id: string
  time: string
  isAvailable: boolean
}

// Add the getStatusColor function
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

const generateTimeSlots = (selectedDate: Date, currentAppointments: AppointmentDisplay[]) => {
  const slots: TimeSlot[] = []
  let current = set(selectedDate, { hours: 9, minutes: 0 })
  const end = set(selectedDate, { hours: 17, minutes: 0 })

  while (isBefore(current, end)) {
    const timeString = format(current, 'h:mm a')
    const isBooked = currentAppointments.some(appointment => 
      isSameDay(new Date(appointment.appointment_date), selectedDate) && 
      format(new Date(appointment.appointment_date), 'h:mm a') === timeString
    )
    
    slots.push({
      time: timeString,
      isBooked
    })
    
    current = addMinutes(current, 30)
  }
  
  return slots
}

const supabase = createClient()

const fetchServices = async () => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching services:', error)
      return []
    }

    if (!data) return []

    return data.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
      category: service.category,
      image_url: service.image_url,
      is_active: service.is_active,
      created_at: service.created_at,
      updated_at: service.updated_at
    })) as Service[]
  } catch (error) {
    console.error('Error fetching services:', error)
    return []
  }
}

const fetchReviews = async (userId: string) => {
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('client_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reviews:', error)
    throw error
  }

  return reviews as TableRow<'reviews'>[]
}

const formatRelativeTime = (date: Date) => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'just now'
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}d ago`
  }
  
  return format(date, 'MMM d, yyyy')
}

// Add this helper function
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

// Add this new component for rating display
const RatingDisplay = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`w-4 h-4 ${
          star <= rating 
            ? 'text-yellow-400 fill-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ))}
  </div>
);

// Add this new component for the review card
const ReviewCard = ({ 
  review, 
  serviceName 
}: { 
  review: TableRow<'reviews'> & { service_name?: string }
  serviceName: string 
}) => (
  <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-2">
      <div>
        <h4 className="font-medium text-gray-900">{serviceName}</h4>
        <p className="text-sm text-gray-500">
          {format(new Date(review.created_at), 'MMMM d, yyyy')}
        </p>
      </div>
      <RatingDisplay rating={review.rating} />
    </div>
    {review.comment && (
      <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
    )}
  </div>
);

export default function ClientDashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedTime, setSelectedTime] = useState<string>('09:00 AM')
  const [showSummary, setShowSummary] = useState(false)
  const [appointments, setAppointments] = useState<AppointmentDisplay[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentDisplay[]>([])
  const [appointmentFilter, setAppointmentFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<Service[]>([])
  const [user, setUser] = useState<TableRow<'users'> | null>(null)
  const router = useRouter()
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null)
  const [deletedAppointments, setDeletedAppointments] = useState<{ [key: string]: AppointmentDisplay }>({})
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDisplay | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [reviews, setReviews] = useState<{ [key: string]: TableRow<'reviews'> }>({})
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const timeOptions = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'
  ]

  const handleCalendarChange = (
    _value: string | number,
    _e: React.ChangeEventHandler<HTMLSelectElement>,
  ) => {
    const _event = {
      target: {
        value: String(_value),
      },
    } as React.ChangeEvent<HTMLSelectElement>
    _e(_event)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  const getAvailableTimes = useCallback((selectedDate: Date): AppointmentTime[] => {
    const times: AppointmentTime[] = []
    let current = set(selectedDate, { hours: 9, minutes: 0 })
    const end = set(selectedDate, { hours: 17, minutes: 0 })

    while (isBefore(current, end)) {
      const timeString = format(current, 'h:mm a')
      const isBooked = appointments.some(appointment => 
        isSameDay(new Date(appointment.appointment_date), selectedDate) && 
        format(new Date(appointment.appointment_date), 'h:mm a') === timeString
      )
      
      times.push({
        id: timeString,
        time: timeString,
        isAvailable: !isBooked
      })
      
      current = addMinutes(current, 30)
    }
    
    return times
  }, [appointments])

  useEffect(() => {
    if (date) {
      setTimeSlots(generateTimeSlots(date, appointments))
    }
  }, [date, appointments])

  const handleTimeSelection = (value: string) => {
    setSelectedTime(value)
    setShowSummary(true)
  }

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) {
          console.error('Error getting user:', userError)
          setError('Please sign in to access your dashboard')
          return
        }

        if (!user) {
          setError('No user found. Please sign in again.')
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching user profile:', profileError)
          setError('Unable to load user profile')
          return
        }

        setUser(profile as TableRow<'users'>)

        // Fetch appointments with filters
        const { data: appointments, error: appointmentsError } = await getAppointments({ 
          clientId: user.id 
        }, { page: 1, limit: 100 })

        if (appointmentsError) {
          console.error('Error fetching appointments:', appointmentsError)
          setError('Unable to load appointments')
          return
        }

        if (appointments) {
          setAppointments(appointments)
          setFilteredAppointments(appointments)
        }

        // Then fetch services
        const servicesData = await fetchServices()
        setServices(servicesData)

        // Fetch reviews
        try {
          const reviews = await fetchReviews(user.id)
          const reviewsMap = reviews.reduce((acc, review) => {
            acc[review.appointment_id] = review
            return acc
          }, {} as { [key: string]: TableRow<'reviews'> })
          setReviews(reviewsMap)
        } catch (reviewError) {
          console.error('Error fetching reviews:', reviewError)
          // Don't block the app for review errors
        }

        // Subscribe to real-time appointments changes
        const appointmentsSubscription = supabase
          .channel('appointments')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'appointments',
              filter: `client_id=eq.${user.id}`
            },
            async (payload) => {
              try {
                // Refresh appointments when there's a change
                const { data: updatedAppointments } = await getAppointments({ 
                  clientId: user.id 
                }, { page: 1, limit: 100 })
                if (updatedAppointments) {
                  setAppointments(updatedAppointments)
                  setFilteredAppointments(updatedAppointments)
                }
              } catch (subscriptionError) {
                console.error('Error in subscription handler:', subscriptionError)
              }
            }
          )
          .subscribe()

        return () => {
          appointmentsSubscription.unsubscribe()
        }
      } catch (error) {
        console.error('Error loading initial data:', error)
        setError('Unable to load dashboard data. Please try refreshing the page.')
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  const formatAppointmentTime = (appointmentDate: string) => {
    return format(new Date(appointmentDate), 'h:mm a')
  }

  const formatAppointmentDate = (appointmentDate: string) => {
    return format(new Date(appointmentDate), 'MMMM d, yyyy')
  }

  const handleConfirmBooking = async () => {
    try {
      if (!selectedService || !date || !selectedTime) {
        toast.error('Please select all required fields')
        return
      }

      setIsLoading(true)

      // Get current user and verify role
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        toast.error('Please sign in to book an appointment')
        return
      }

      // Verify user is a client
      const { data: userData, error: roleError } = await supabase
        .from('users')
        .select('role, is_active')
        .eq('id', user.id)
        .single()

      if (roleError || !userData) {
        toast.error('Error verifying user role')
        return
      }

      if (userData.role !== 'client') {
        toast.error('Only clients can create appointments')
        return
      }

      if (!userData.is_active) {
        toast.error('Your account is not active')
        return
      }

      const result = await createAppointment({
        service_id: selectedService.id,
        appointment_date: date.toISOString(),
        time: selectedTime
      })

      if (result.error) {
        console.error('Appointment creation error:', result.error.message)
        toast.error(result.error.message || 'Failed to create appointment')
        return
      }

      if (result.data) {
        // Ensure we only update if result.data exists
        const updatedAppointment: AppointmentDisplay = result.data

        // Update appointments state with type safety
        setAppointments(prev => [...prev, updatedAppointment])

        toast.success('Appointment created successfully!')
        setShowSummary(false)
        resetBookingForm()
      }
    } catch (error) {
      console.error('Error in handleConfirmBooking:', error)
      toast.error('Failed to create appointment. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const result = await updateAppointment(appointmentId, {
        status: 'cancelled',
        notes: 'Cancelled by client'
      })

      if (result.error) {
        throw new Error(result.error.message || 'Failed to cancel appointment')
      }

      if (result.data) {
        // Find the existing appointment to preserve any fields that might not be in the response
        const existingAppointment = appointments.find(app => app.id === appointmentId)
        if (!existingAppointment) {
          toast.error('Appointment not found in current view')
          return
        }

        const updatedAppointment: AppointmentDisplay = {
          ...existingAppointment,
          ...result.data,
          status: 'cancelled' as AppointmentStatusEnum,
          updated_at: new Date().toISOString()
        }

        // Update the appointments arrays with type assertion
        setAppointments([
          ...appointments.filter(app => app.id !== appointmentId),
          updatedAppointment
        ])
        
        setFilteredAppointments([
          ...filteredAppointments.filter(app => app.id !== appointmentId),
          updatedAppointment
        ])

        toast.success('Appointment cancelled successfully')
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      toast.error('Failed to cancel appointment')
    }
  }

  const handleDeleteFromList = async (appointmentId: string) => {
    try {
      // Store the appointment for undo functionality
      const appointmentToRemove = appointments.find(app => app.id === appointmentId)
      if (!appointmentToRemove) {
        toast.error('Appointment not found')
        return
      }

      // Store in deleted appointments for undo
      setDeletedAppointments(prev => ({
        ...prev,
        [appointmentId]: appointmentToRemove
      }))

      // Remove from both appointment lists (optimistic update)
      const filterAppointments = (prev: AppointmentDisplay[]) => 
        prev.filter(app => app.id !== appointmentId)

      setAppointments(filterAppointments)
      setFilteredAppointments(filterAppointments)
      
      // Delete from database
      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId)

      if (deleteError) {
        // Revert local state if database deletion fails
        const revertAppointments = (prev: AppointmentDisplay[]) => 
          [...prev, appointmentToRemove]

        setAppointments(revertAppointments)
        setFilteredAppointments(revertAppointments)
        
        setDeletedAppointments(prev => {
          const { [appointmentId]: _, ...rest } = prev
          return rest
        })
        
        throw deleteError
      }

      toast.success('Appointment deleted successfully', {
        action: {
          label: 'Undo',
          onClick: () => handleUndoDelete(appointmentId)
        },
        duration: 5000
      })
    } catch (error) {
      console.error('Error deleting appointment:', error)
      toast.error('Failed to delete appointment')
    }
  }

  const handleUndoDelete = async (appointmentId: string) => {
    const appointment = deletedAppointments[appointmentId]
    if (!appointment) {
      toast.error('Cannot undo: Appointment data not found')
      return
    }

    try {
      // Restore in database
      const { error: restoreError } = await supabase
        .from('appointments')
        .insert([
          {
            id: appointment.id,
            client_id: appointment.client_id,
            service_id: appointment.service_id,
            worker_id: appointment.worker_id,
            appointment_date: appointment.appointment_date,
            time: appointment.time,
            status: appointment.status,
            notes: appointment.notes
          }
        ])

      if (restoreError) throw restoreError

      // Restore in both appointment lists
      const restoreAppointments = (prev: AppointmentDisplay[]) => 
        [...prev, appointment]

      setAppointments(restoreAppointments)
      setFilteredAppointments(restoreAppointments)
      
      // Remove from deleted appointments
      setDeletedAppointments(prev => {
        const { [appointmentId]: _, ...rest } = prev
        return rest
      })
      
      toast.success('Appointment restored successfully')
    } catch (error) {
      console.error('Error restoring appointment:', error)
      toast.error('Failed to restore appointment')
    }
  }

  const initiateDelete = (appointmentId: string) => {
    setAppointmentToDelete(appointmentId)
  }

  const availableTimeSlots = date ? generateTimeSlots(date, appointments) : []

  useEffect(() => {
    if (!user?.id) return

    const fetchNotifications = async () => {
      try {
        const { data: notificationsData, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .returns<Notification[]>()

        if (error) throw error
        if (notificationsData) {
          setNotifications(notificationsData)
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
        toast.error('Failed to fetch notifications')
      }
    }

    fetchNotifications()

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as Notification
            setNotifications((prev) => [newNotification, ...prev])
          } else if (payload.eventType === 'DELETE') {
            const deletedNotification = payload.old as Notification
            setNotifications((prev) =>
              prev.filter((n) => n.id !== deletedNotification.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const handleNotificationClick = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error

    setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, is_read: true }
            : n
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to mark notification as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)

      if (error) throw error

    setNotifications(prev =>
        prev.map(notification => ({ ...notification, is_read: true }))
      )
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const handleClearAllNotifications = async () => {
    if (!user?.id) return

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error

      setNotifications([])
      toast.success('All notifications cleared')
    } catch (error) {
      console.error('Error clearing notifications:', error)
      toast.error('Failed to clear notifications')
    }
  }

  const handleFeedbackOpen = (appointment: AppointmentDisplay) => {
    setSelectedAppointment(appointment)
    const existingReview = reviews[appointment.id]
    if (existingReview) {
      setRating(existingReview.rating)
      setComment(existingReview.comment || '')
    } else {
      setRating(0)
      setComment('')
    }
    setShowFeedback(true)
  }

  const renderStars = () => {
    return (
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`p-1 rounded-full hover:bg-gray-100 transition-colors ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            <Star className="w-6 h-6 fill-current" />
          </button>
        ))}
      </div>
    );
  };

  const handleSubmitFeedback = async () => {
    if (!selectedAppointment || !user || rating === 0) {
      toast.error('Please provide a rating')
      return
    }

    setSubmittingFeedback(true)
    try {
      const existingReview = reviews[selectedAppointment.id]
      const supabase = createClient()
      
      if (existingReview) {
        const { error } = await supabase
          .from('reviews')
          .update({
            rating,
            comment: comment.trim() || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingReview.id)

        if (error) throw error
        
        // Update local state
        setReviews(prev => ({
          ...prev,
          [selectedAppointment.id]: {
            ...existingReview,
            rating,
            comment: comment.trim() || null,
            updated_at: new Date().toISOString()
          }
        }))
      } else {
        const { data, error } = await supabase
          .from('reviews')
          .insert([
            {
              client_id: user.id,
              appointment_id: selectedAppointment.id,
              rating,
              comment: comment.trim() || null,
              created_at: new Date().toISOString()
            }
          ])
          .select()

        if (error) throw error
        
        // Update local state with proper typing
        if (data && data[0]) {
          const newReview = data[0] as TableRow<'reviews'>
          setReviews(prev => ({
            ...prev,
            [selectedAppointment.id]: newReview
          }))
        }
      }

      setShowFeedback(false)
      setSelectedAppointment(null)
      setRating(0)
      setComment('')
      toast.success('Thank you for your feedback!')
    } catch (error: any) {
      console.error('Error submitting feedback:', error.message || error)
      toast.error(error.message || 'Failed to submit feedback. Please try again.')
    } finally {
      setSubmittingFeedback(false)
    }
  }

  // Update the feedback button component
  const feedbackButton = (appointment: AppointmentDisplay) => {
    const review = reviews[appointment.id];
    const isCompleted = appointment.status === 'completed';
    
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleFeedbackOpen(appointment)}
        className={`flex items-center gap-2 ${
          isCompleted ? 'text-yellow-600 hover:text-yellow-700' : 'text-gray-400'
        }`}
        disabled={!isCompleted}
      >
        <Star className={`w-4 h-4 ${isCompleted ? 'fill-yellow-600' : ''}`} />
        {isCompleted ? (
          review ? (
            <div className="flex items-center gap-2">
              <span>Update Review</span>
              {review.rating && <RatingDisplay rating={review.rating} />}
      </div>
          ) : (
            'Leave Review'
          )
        ) : (
          'Feedback available after completion'
        )}
      </Button>
    );
  };

  // Update the feedback dialog
  const feedbackDialog = (
    <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Service Feedback</DialogTitle>
          {selectedAppointment && (
            <DialogDescription className="mt-2 space-y-2">
              <span className="block font-medium text-gray-900">{selectedAppointment.service.name}</span>
              <span className="block text-sm text-gray-600">
                {format(new Date(selectedAppointment.appointment_date), 'MMMM d, yyyy')}
              </span>
          </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              How would you rate your experience?
            </label>
            <div className="flex items-center gap-2">
            {renderStars()}
              <span className="text-sm text-gray-500 ml-2">
                {rating === 0 ? 'Select rating' : `${rating} star${rating !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              Share your experience (optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you liked or what we could improve..."
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowFeedback(false)}>
            Cancel
          </Button>
          <Button
            className="bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white"
            onClick={handleSubmitFeedback}
            disabled={submittingFeedback || rating === 0}
          >
            {submittingFeedback ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const getFilteredAppointments = useCallback((appointmentsList: AppointmentDisplay[]) => {
      switch (appointmentFilter) {
        case 'upcoming':
        return appointmentsList.filter(
            (appointment) => !appointment.is_past && appointment.status !== 'cancelled'
          );
        case 'past':
        return appointmentsList.filter(
          (appointment) => appointment.is_past || appointment.status === 'completed'
          );
        case 'pending':
        return appointmentsList.filter(
            (appointment) => appointment.status === 'pending'
          );
        case 'confirmed':
        return appointmentsList.filter(
            (appointment) => appointment.status === 'confirmed'
          );
        case 'cancelled':
        return appointmentsList.filter(
            (appointment) => appointment.status === 'cancelled'
          );
        default:
        return appointmentsList;
    }
  }, [appointmentFilter]);

  useEffect(() => {
    setFilteredAppointments(getFilteredAppointments(appointments));
  }, [appointments, getFilteredAppointments]);

  // Update the appointment card component
  const renderAppointmentCard = (appointment: AppointmentDisplay) => (
    <Card key={appointment.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-semibold">
              {appointment.service.name}
            </CardTitle>
            <p className="text-sm text-gray-500">
              {appointment.service.category}
            </p>
          </div>
          <Badge
            variant={getStatusVariant(appointment.status)}
            className="capitalize"
          >
            {appointment.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Date</p>
            <p>{appointment.formatted_date}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Time</p>
            <p>{appointment.time}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Price</p>
            <p>${appointment.service.price.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Duration</p>
            <p>{appointment.service.duration} minutes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Update the appointment list rendering
  const renderAppointmentList = (appointments: AppointmentDisplay[]) => (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <div key={appointment.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {appointment.service.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {appointment.service.category}
                </p>
              </div>
              <Badge
                variant={getStatusVariant(appointment.status)}
                className="capitalize"
              >
                {appointment.status.replace('_', ' ')}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Appointment Time</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{appointment.formatted_date} at {appointment.time}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Service Details</p>
                <div className="flex items-center gap-2 mt-1">
                  <Timer className="h-4 w-4 text-gray-400" />
                  <span>{appointment.service.duration} minutes</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span>Kes {appointment.service.price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                {appointment.status === 'completed' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      {feedbackButton(appointment)}
                    </div>
                    {reviews[appointment.id] && (
                      <>
                        <div className="flex items-center gap-2">
                          <RatingDisplay rating={reviews[appointment.id].rating} />
                          <span className="text-sm text-gray-500">
                            {format(new Date(reviews[appointment.id].created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {reviews[appointment.id].comment && (
                          <p className="text-sm text-gray-600 italic">
                            "{reviews[appointment.id].comment}"
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
                {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleCancelAppointment(appointment.id)}
                    >
                    Cancel
                    </Button>
                  )}
                {(appointment.status === 'cancelled' || appointment.status === 'completed') && (
                    <Button
                      variant="outline"
                      size="sm"
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      onClick={() => initiateDelete(appointment.id)}
                    >
                    Remove
                    </Button>
                  )}
                </div>
              {appointment.notes && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{appointment.notes}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const TimeSlotSelector = ({ 
    selectedTime,
    onTimeSelect,
    availableSlots
  }: {
    selectedTime: string
    onTimeSelect: (time: string) => void
    availableSlots: TimeSlot[]
  }) => {
    return (
      <Select
        value={selectedTime}
        onValueChange={onTimeSelect}
      >
        <SelectTrigger className="w-full pl-9 h-10">
          <SelectValue placeholder="Select time" />
        </SelectTrigger>
        <SelectContent>
          {availableSlots.map((slot) => (
            <SelectItem 
              key={slot.time}
              value={slot.time}
              disabled={slot.isBooked}
            >
              {slot.time}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  // Update the service selection in the dialog
  const selectedServiceDetails = services.find(s => s.id === selectedService?.id)

  const resetBookingForm = () => {
    setDate(new Date())
    setSelectedTime('09:00 AM')
    setSelectedService(null)
    setTimeSlots([])
  }

  const handleServiceSelect = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    if (service) {
      setSelectedService({
        id: service.id,
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price,
        category: service.category,
        image_url: service.image_url,
        is_active: service.is_active,
        created_at: service.created_at,
        updated_at: service.updated_at
      })
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-center" />
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-20">
              {/* Left section with logo and welcome message */}
              <div className="flex items-center gap-8">
                <Link href="/dashboard" className="text-3xl font-bold text-[#FF6B6B]">
                  ZURI&apos;s
                </Link>
                <div className="hidden md:block">
                  <h1 className="text-xl font-semibold text-gray-900">Welcome back, <span className="text-[#FF6B6B]">{user?.full_name || 'Guest'}</span>!</h1>
                </div>
              </div>

              {/* Right section with actions */}
              <div className="flex items-center gap-4">
                {/* Notifications */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="relative">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Notifications</h3>
                        <div className="flex gap-2">
                          {notifications.length > 0 && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleMarkAllAsRead}
                                className="text-xs"
                              >
                                Mark all read
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearAllNotifications}
                                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                Clear all
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-center text-gray-500 py-4">No notifications</p>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-3 ${
                                !notification.is_read ? 'bg-blue-50' : ''
                              } hover:bg-gray-50 cursor-pointer`}
                              onClick={() => handleNotificationClick(notification.id)}
                            >
                              <div className="flex justify-between items-start">
                                <h4 className="font-medium text-sm">{notification.title}</h4>
                                <span className="text-xs text-gray-500">
                                  {formatRelativeTime(new Date(notification.created_at))}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Profile */}
                <Link 
                  href="/profile" 
                  className="text-gray-600 hover:text-[#FF6B6B] transition-colors"
                >
                  <User className="h-5 w-5" />
                </Link>

                {/* Divider */}
                <div className="h-8 w-px bg-gray-200 mx-2"></div>

                {/* Logout */}
                <Button 
                  onClick={handleLogout}
                  className="h-12 px-6 bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white rounded-full"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  <span>Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile welcome message */}
        <div className="md:hidden bg-white border-b px-4 py-2">
          <h1 className="text-xl font-semibold text-gray-900">Welcome back, <span className="text-[#FF6B6B]">{user?.full_name || 'Guest'}</span>!</h1>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Schedule Appointment Section */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900">Schedule an Appointment</h2>
                <p className="text-sm text-gray-500 mt-1">Book your next beauty service in just a few steps</p>
              </div>
              <div className="space-y-8">
                {/* Step 1: Select Service */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6C63FF]/10 text-[#6C63FF] font-medium">
                      1
                    </span>
                    <label className="text-base font-medium text-gray-900">
                      Select Service
                    </label>
                  </div>
                  <Select
                    value={selectedService?.id || ''}
                    onValueChange={handleServiceSelect}
                  >
                    <SelectTrigger className="h-12 px-4 border-gray-200 hover:border-[#6C63FF]/50 transition-colors">
                      <SelectValue placeholder="Choose a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Step 2: Select Date and Time */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6C63FF]/10 text-[#6C63FF] font-medium">
                      2
                    </span>
                    <label className="text-base font-medium text-gray-900">
                      Select Date & Time
                    </label>
                  </div>
                  <div className="space-y-6">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => {
                        if (newDate) {
                          setDate(newDate)
                          setTimeSlots(generateTimeSlots(newDate, appointments))
                        }
                      }}
                      className="rounded-xl border border-gray-200 p-4 bg-white mx-auto w-full max-w-[400px] shadow-sm hover:border-[#6C63FF]/50 transition-colors"
                      classNames={{
                        month_caption: "mx-0",
                        months: "w-full",
                        month: "w-full",
                        table: "w-full border-collapse",
                        head_cell: "text-gray-500 font-medium text-base",
                        cell: "text-center p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "p-0 font-normal aria-selected:opacity-100 hover:bg-gray-50 rounded-full transition-colors",
                        day_selected: "bg-[#6C63FF] text-white hover:bg-[#6C63FF] hover:text-white focus:bg-[#6C63FF] focus:text-white rounded-full",
                        day_today: "bg-[#6C63FF]/10 text-[#6C63FF] font-medium",
                        day_outside: "text-gray-400 opacity-50",
                        day_disabled: "text-gray-400 opacity-50",
                        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                        day_hidden: "invisible",
                      }}
                      components={{
                        DropdownNav: (props: DropdownNavProps) => {
                          return <div className="flex w-full items-center gap-2">{props.children}</div>
                        },
                        Dropdown: (props: DropdownProps) => {
                          return (
                            <Select
                              value={String(props.value)}
                              onValueChange={(value) => {
                                if (props.onChange) {
                                  handleCalendarChange(value, props.onChange)
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 w-fit font-medium first:grow">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="max-h-[min(26rem,var(--radix-select-content-available-height))]">
                                {props.options?.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={String(option.value)}
                                    disabled={option.disabled}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )
                        },
                      }}
                    />

                    {date && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <label className="text-base font-medium text-gray-900 min-w-[80px]">
                            Select time
                          </label>
                          <div className="relative flex-1">
                            <TimeSlotSelector
                              selectedTime={selectedTime}
                              onTimeSelect={handleTimeSelection}
                              availableSlots={timeSlots}
                            />
                            <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* My Appointments Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">My Appointments</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage your upcoming and past appointments</p>
                </div>
                <div className="flex gap-2">
                  <Select 
                    defaultValue="all" 
                    onValueChange={setAppointmentFilter}
                    value={appointmentFilter}
                  >
                    <SelectTrigger className="w-[180px] bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
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
              </div>

              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                {filteredAppointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                      <Clock className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-600 mb-2">No appointments found</p>
                    <p className="text-sm text-gray-400 mb-4">Schedule a new appointment to get started</p>
                    <Button
                      variant="outline"
                      className="bg-white hover:bg-gray-50"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                      Schedule Now
                    </Button>
                  </div>
                ) : (
                  renderAppointmentList(filteredAppointments)
                )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </main>

        {/* Appointment Summary Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Your Appointment</DialogTitle>
              <DialogDescription>
                Please review your appointment details below
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Selected Service</Label>
              <div className="p-2 bg-gray-50 rounded-md">
                {selectedServiceDetails?.name || 'No service selected'}
                </div>
                </div>

            <div className="grid gap-2">
              <Label>Appointment Date</Label>
              <div className="p-2 bg-gray-50 rounded-md">
                {date ? format(date, 'MMMM d, yyyy') : 'No date selected'}
                </div>
              </div>

            <div className="grid gap-2">
              <Label>Appointment Time</Label>
              <div className="p-2 bg-gray-50 rounded-md">
                {selectedTime}
            </div>
          </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSummary(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmBooking} disabled={isLoading}>
              {isLoading ? 'Confirming...' : 'Confirm Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Alert Dialog for delete confirmation */}
      <AlertDialog open={!!appointmentToDelete} onOpenChange={() => setAppointmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the appointment from your list. You can undo this action for a short time after deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={() => {
                if (appointmentToDelete) {
                  handleDeleteFromList(appointmentToDelete)
                  setAppointmentToDelete(null)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {feedbackDialog}
    </div>
    </TooltipProvider>
  )
} 
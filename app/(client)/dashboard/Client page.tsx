'use client'

import { Bell, Search, User, LogOut, Clock, Star } from 'lucide-react'
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
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
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

// Define proper types based on database schema
interface Service {
  id: string
  name: string
  description: string | null
  duration: number
  price: number
  category: string
  image_url: string | null
  is_active: boolean
}

interface Appointment {
  id: string
  client_id: string
  worker_id: string | null
  service_id: string
  service: string
  appointment_date: string
  time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes: string | null
  created_at: string
  updated_at: string
}

interface User {
  id: string
  full_name: string
  email: string
  role: 'client' | 'worker' | 'admin'
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'appointment' | 'system' | 'reminder'
  isRead: boolean
  createdAt: string
}

interface Review {
  id: string
  client_id: string
  appointment_id: string
  rating: number
  comment: string | null
  created_at: string
}

// Generate available time slots
const generateTimeSlots = (selectedDate: Date) => {
  const slots = []
  const now = new Date()
  const isToday = selectedDate.toDateString() === now.toDateString()
  const currentHour = now.getHours()

  for (let hour = 9; hour <= 17; hour++) {
    // Skip past hours if it's today
    if (isToday && hour < currentHour) continue

    for (let minute = 0; minute < 60; minute += 30) {
      // Skip past times if it's the current hour
      if (isToday && hour === currentHour && minute <= now.getMinutes()) continue

      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      slots.push(time)
    }
  }
  return slots
}

export default function ClientDashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedService, setSelectedService] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('09:00 AM')
  const [showSummary, setShowSummary] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null)
  const [deletedAppointments, setDeletedAppointments] = useState<{ [key: string]: Appointment }>({})
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [reviews, setReviews] = useState<{ [key: string]: Review }>({})

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

  const handleTimeSelection = (time: string) => {
    setSelectedTime(time)
    setShowSummary(true)
  }

  // Fetch user data and services on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch user data
        const { data: { user: userData }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError

        if (userData) {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userData.id)
            .single()

          if (profileError) throw profileError
          setUser(profile)

          // Set up realtime subscription for appointments
          const appointmentsSubscription = supabase
            .channel('appointments-channel')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'appointments',
                filter: `client_id=eq.${userData.id}`
              },
              (payload) => {
                if (payload.eventType === 'INSERT') {
                  setAppointments(prev => [...prev, payload.new as Appointment])
                } else if (payload.eventType === 'UPDATE') {
                  setAppointments(prev =>
                    prev.map(app =>
                      app.id === payload.new.id ? payload.new as Appointment : app
                    )
                  )
                }
              }
            )
            .subscribe()

          // Fetch services
          const { data: servicesData, error: servicesError } = await supabase
            .from('services')
            .select('*')
            .eq('is_active', true)
            .order('name')

          if (servicesError) throw servicesError
          setServices(servicesData)

          // Fetch appointments
          await fetchAppointments()

          // Fetch reviews
          await fetchReviews()

          return () => {
            supabase.removeChannel(appointmentsSubscription)
          }
        }
      } catch (error) {
        console.error('Error fetching initial data:', error)
        toast.error('Failed to load data')
      }
    }

    fetchInitialData()
  }, [supabase]) // Only depend on supabase instance

  const fetchAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', user.id)
        .order('appointment_date', { ascending: true })

      if (error) throw error
      setAppointments(data)
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast.error('Failed to load appointments')
    }
  }

  const fetchReviews = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('client_id', user.id)

      if (error) throw error
      
      // Convert array to object with appointment_id as key
      const reviewsMap = data.reduce((acc, review) => {
        acc[review.appointment_id] = review
        return acc
      }, {} as { [key: string]: Review })
      
      setReviews(reviewsMap)
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast.error('Failed to load reviews')
    }
  }

  const handleConfirmBooking = async () => {
    if (!date || !selectedService || !user) return

    setLoading(true)
    try {
      const serviceObj = services.find(s => s.name === selectedService)
      if (!serviceObj) throw new Error('Service not found')

      const appointmentDate = new Date(date)
      const [hours, minutes] = selectedTime.split(' ')[0].split(':')
      const isPM = selectedTime.includes('PM')
      
      appointmentDate.setHours(
        isPM ? (parseInt(hours) === 12 ? 12 : parseInt(hours) + 12) : (parseInt(hours) === 12 ? 0 : parseInt(hours)),
        parseInt(minutes)
      )

      // Check for existing appointments at the same time
      const { data: existingAppointments, error: checkError } = await supabase
        .from('appointments')
        .select('*')
        .eq('appointment_date', appointmentDate.toISOString())
        .eq('time', selectedTime)
        .eq('status', 'confirmed')

      if (checkError) throw checkError

      if (existingAppointments && existingAppointments.length > 0) {
        toast.error('This time slot is already booked. Please select another time.')
        return
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert([
          {
            client_id: user.id,
            service_id: serviceObj.id,
            service: selectedService,
            appointment_date: appointmentDate.toISOString(),
            status: 'pending',
            time: selectedTime
          }
        ])
        .select()

      if (error) throw error

      setShowSummary(false)
      setSelectedService('')
      setDate(new Date())
      setSelectedTime('09:00 AM')
      toast.success('Appointment booked successfully!')
    } catch (error) {
      console.error('Error booking appointment:', error)
      toast.error('Failed to book appointment')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)

      if (error) throw error
      toast.success('Appointment cancelled successfully')
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      toast.error('Failed to cancel appointment')
    }
  }

  const handleDeleteFromList = async (appointmentId: string) => {
    try {
      // Store the appointment for undo functionality
      const appointmentToRemove = appointments.find(app => app.id === appointmentId);
      if (!appointmentToRemove) {
        toast.error('Appointment not found');
        return;
      }

      // Store in deleted appointments for undo
      setDeletedAppointments(prev => ({
        ...prev,
        [appointmentId]: appointmentToRemove
      }));

      // Remove from local state first (optimistic update)
      setAppointments(prev => prev.filter(app => app.id !== appointmentId));
      
      // Delete from database
      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (deleteError) {
        // Revert local state if database deletion fails
        setAppointments(prev => [...prev, appointmentToRemove]);
        setDeletedAppointments(prev => {
          const { [appointmentId]: _, ...rest } = prev;
          return rest;
        });
        throw deleteError;
      }

      toast.success('Appointment successfully deleted', {
        action: {
          label: 'Undo',
          onClick: () => handleUndoDelete(appointmentId)
        },
        duration: 5000
      });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Failed to delete appointment');
    }
  };

  const handleUndoDelete = async (appointmentId: string) => {
    const appointment = deletedAppointments[appointmentId];
    if (!appointment) {
      toast.error('Cannot undo: Appointment data not found');
      return;
    }

    try {
      // Restore in database
      const { error: restoreError } = await supabase
        .from('appointments')
        .insert([{
          ...appointment,
          created_at: undefined,
          updated_at: undefined
        }]);

      if (restoreError) throw restoreError;

      // Restore in local state
      setAppointments(prev => [...prev, appointment]);
      
      // Remove from deleted appointments
      setDeletedAppointments(prev => {
        const { [appointmentId]: _, ...rest } = prev;
        return rest;
      });
      
      toast.success('Appointment restored successfully');
    } catch (error) {
      console.error('Error restoring appointment:', error);
      toast.error('Failed to restore appointment');
    }
  };

  const initiateDelete = (appointmentId: string) => {
    setAppointmentToDelete(appointmentId)
  }

  const availableTimeSlots = date ? generateTimeSlots(date) : []

  // Add this function after existing useEffect
  useEffect(() => {
    // For demonstration, we'll generate notifications based on appointments
    const generateNotifications = () => {
      const newNotifications: Notification[] = appointments.map(appointment => {
        let title = 'Upcoming Appointment'
        let message = `You have an appointment for ${appointment.service} on ${format(new Date(appointment.appointment_date), 'MMMM d')} at ${appointment.time}`
        let type: 'appointment' | 'system' | 'reminder' = 'appointment'

        // Customize notification based on appointment status
        if (appointment.status === 'cancelled') {
          title = 'Appointment Cancelled'
          message = `Your appointment for ${appointment.service} on ${format(new Date(appointment.appointment_date), 'MMMM d')} at ${appointment.time} has been cancelled`
          type = 'system'
        } else if (deletedAppointments[appointment.id]) {
          title = 'Appointment Removed'
          message = `Your appointment for ${appointment.service} on ${format(new Date(appointment.appointment_date), 'MMMM d')} at ${appointment.time} has been removed from your list`
          type = 'system'
        } else if (new Date(appointment.appointment_date) < new Date()) {
          title = 'Past Appointment'
          message = `Your appointment for ${appointment.service} was scheduled for ${format(new Date(appointment.appointment_date), 'MMMM d')} at ${appointment.time}`
          type = 'reminder'
        }

        return {
          id: `notif-${appointment.id}`,
          title,
          message,
          type,
          isRead: false,
          createdAt: new Date().toISOString()
        }
      })
      setNotifications(newNotifications)
    }

    if (appointments.length > 0) {
      generateNotifications()
    }
  }, [appointments, deletedAppointments])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    )
  }

  // Replace the existing bell button with this new implementation
  const notificationSection = (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-2 hover:bg-gray-100 rounded-full relative">
          <Bell className="w-5 h-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex items-center justify-center h-[100px] text-sm text-gray-500">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 rounded-full p-1 ${
                      notification.type === 'appointment' 
                        ? 'bg-blue-100 text-blue-600'
                        : notification.type === 'system'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {notification.type === 'appointment' ? (
                        <Clock className="w-3 h-3" />
                      ) : notification.type === 'system' ? (
                        <Bell className="w-3 h-3" />
                      ) : (
                        <Bell className="w-3 h-3" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )

  const handleFeedbackOpen = (appointment: Appointment) => {
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

  const handleSubmitFeedback = async () => {
    if (!selectedAppointment || !user || rating === 0) {
      toast.error('Please provide a rating')
      return
    }

    setSubmittingFeedback(true)
    try {
      const existingReview = reviews[selectedAppointment.id]
      
      if (existingReview) {
        // Update existing review
        const { error } = await supabase
          .from('reviews')
          .update({
            rating,
            comment: comment.trim() || null,
          })
          .eq('id', existingReview.id)

        if (error) throw error
      } else {
        // Create new review
        const { data, error } = await supabase
          .from('reviews')
          .insert([
            {
              client_id: user.id,
              appointment_id: selectedAppointment.id,
              rating,
              comment: comment.trim() || null,
            }
          ])
          .select()

        if (error) throw error
        
        // Update local state
        if (data && data[0]) {
          setReviews(prev => ({
            ...prev,
            [selectedAppointment.id]: data[0]
          }))
        }
      }

      setShowFeedback(false)
      setSelectedAppointment(null)
      setRating(0)
      setComment('')
      toast.success('Thank you for your feedback!')
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Failed to submit feedback')
    } finally {
      setSubmittingFeedback(false)
    }
  }

  // Add this inside the appointments.map() in the return statement, after the existing buttons
  const feedbackButton = (appointment: Appointment) => {
    if (appointment.status !== 'completed') return null
    
    const hasReview = reviews[appointment.id]
    return (
      <Button
        variant="outline"
        size="sm"
        className="text-[#6C63FF] hover:text-[#6C63FF] hover:bg-[#6C63FF]/10"
        onClick={() => handleFeedbackOpen(appointment)}
      >
        {hasReview ? 'Edit Feedback' : 'Leave Feedback'}
      </Button>
    )
  }

  // Add this before the return statement
  const renderStars = () => {
    return (
      <div className="flex items-center gap-1">
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
    )
  }

  // Add this inside the return statement, after the AlertDialog
  const feedbackDialog = (
    <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Service Feedback</DialogTitle>
          <DialogDescription>
            Please share your experience with this service. Your feedback helps us improve.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Rate your experience
            </label>
            {renderStars()}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Additional comments (optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
              placeholder="Share your thoughts about the service..."
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowFeedback(false)}>
            Cancel
          </Button>
          <Button
            className="bg-[#6C63FF] hover:bg-[#6C63FF]/90"
            onClick={handleSubmitFeedback}
            disabled={submittingFeedback || rating === 0}
          >
            {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Welcome, {user?.full_name || 'Guest'}!</h1>
            <div className="flex items-center gap-4">
              {notificationSection}
              <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-full">
                <User className="w-5 h-5 text-gray-600" />
              </Link>
              <Button 
                variant="default" 
                className="bg-[#6C63FF] hover:bg-[#6C63FF]/90"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Schedule Appointment Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Schedule an Appointment</h2>
            <div className="space-y-6">
              {/* Step 1: Select Service */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#6C63FF] text-white text-sm">
                    1
                  </span>
                  <label className="text-sm font-medium text-gray-700">
                    Select Service
                  </label>
                </div>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.name}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Step 2: Select Date and Time */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#6C63FF] text-white text-sm">
                    2
                  </span>
                  <label className="text-sm font-medium text-gray-700">
                    Select Date & Time
                  </label>
                </div>
                <div className="space-y-4">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-lg border border-border p-4 bg-background mx-auto w-full max-w-[400px]"
                    classNames={{
                      month_caption: "mx-0",
                      months: "w-full",
                      month: "w-full",
                      table: "w-full border-collapse",
                      head_cell: "text-muted-foreground font-normal text-base",
                      cell: "h-11 w-11 text-center text-base p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      day: "h-11 w-11 p-0 font-normal aria-selected:opacity-100",
                      day_selected: "bg-[#6C63FF] text-white hover:bg-[#6C63FF] hover:text-white focus:bg-[#6C63FF] focus:text-white",
                      day_today: "bg-accent text-accent-foreground",
                      day_outside: "text-muted-foreground opacity-50",
                      day_disabled: "text-muted-foreground opacity-50",
                      day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      day_hidden: "invisible",
                    }}
                    captionLayout="dropdown"
                    defaultMonth={new Date()}
                    startMonth={new Date()}
                    disabled={(date) => date < new Date() || date.getDay() === 0}
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
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 min-w-[80px]">
                          Select time
                        </label>
                        <div className="relative flex-1">
                          <Select
                            value={selectedTime}
                            onValueChange={handleTimeSelection}
                          >
                            <SelectTrigger className="w-full pl-9 h-10">
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* My Appointments Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-6">My Appointments</h2>
            {appointments.length === 0 ? (
              <div className="flex items-center justify-center h-[400px] text-gray-500">
                No appointments found
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg text-[#6C63FF]">
                            {appointment.service}
                          </h3>
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <p>Date: {format(new Date(appointment.appointment_date), 'MMMM d, yyyy')}</p>
                            <p>Time: {appointment.time}</p>
                            <p className="capitalize">Status: {appointment.status}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {appointment.status !== 'cancelled' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleCancelAppointment(appointment.id)}
                            >
                              Cancel
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            onClick={() => initiateDelete(appointment.id)}
                          >
                            Delete
                          </Button>
                          {feedbackButton(appointment)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </main>

      {/* Appointment Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Your Appointment</DialogTitle>
            <DialogDescription>
              Please review your appointment details before confirming.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-500">Service</p>
                  <p className="mt-1">{selectedService}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-500">Date</p>
                  <p className="mt-1">{date ? format(date, 'MMMM d, yyyy') : ''}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-500">Time</p>
                  <p className="mt-1">{selectedTime}</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSummary(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#6C63FF] hover:bg-[#6C63FF]/90" 
              onClick={handleConfirmBooking}
              disabled={loading}
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
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
  )
} 
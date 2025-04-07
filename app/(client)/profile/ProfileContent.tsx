'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, User, Mail, Phone, Star, Calendar, DollarSign, Award, ArrowLeft, Edit2, Save, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { motion } from 'framer-motion'

interface ClientProfile {
  id: string
  preferred_contact: 'email' | 'phone' | 'sms'
  preferred_worker_id: string | null
  last_visit_date: string | null
  total_visits: number
  total_spent: number
  loyalty_points: number
  created_at: string | null
  updated_at: string | null
}

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: 'client' | 'worker' | 'admin'
  is_active: boolean
  created_at: string | null
}

interface CompleteProfile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: 'client' | 'worker' | 'admin'
  is_active: boolean
  created_at: string | null
  client_profile: ClientProfile
  preferred_worker: {
    id: string
    full_name: string | null
    email: string
  } | null
  upcoming_appointments: Array<any>
  recent_services: Array<any>
}

interface ProfileResponse {
  profile: CompleteProfile
}

interface EditableProfile {
  full_name: string | null
  phone: string | null
}

export default function ProfileContent() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<CompleteProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<EditableProfile>({
    full_name: null,
    phone: null
  })
  const [isSaving, setIsSaving] = useState(false)

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('Auth error:', userError)
        throw new Error('Authentication error: ' + userError.message)
      }
      if (!user) {
        throw new Error('No authenticated user found')
      }

      // Get user profile
      const { data: userData, error: userProfileError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          phone,
          role,
          is_active,
          created_at
        `)
        .eq('id', user.id)
        .single()

      if (userProfileError) {
        console.error('Profile fetch error:', JSON.stringify(userProfileError))
        throw new Error('Failed to fetch profile: ' + (userProfileError.message || 'Unknown error'))
      }

      // Handle empty response
      if (!userData) {
        throw new Error('User profile not found')
      }

      // Get upcoming appointments
      const { data: upcomingAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          service,
          service_name,
          appointment_date,
          time,
          status,
          total_amount
        `)
        .eq('client_id', user.id)
        .eq('status', 'pending')
        .order('appointment_date', { ascending: true })
        .limit(5)

      if (appointmentsError) {
        console.error('Appointments fetch error:', appointmentsError)
      }

      // Get recent services (completed appointments)
      const { data: recentServices, error: servicesError } = await supabase
        .from('appointments')
        .select(`
          id,
          service,
          service_name,
          appointment_date,
          time,
          status,
          total_amount
        `)
        .eq('client_id', user.id)
        .eq('status', 'completed')
        .order('appointment_date', { ascending: false })
        .limit(5)

      if (servicesError) {
        console.error('Services fetch error:', servicesError)
      }

      // Calculate client stats from appointments
      const { data: allAppointments, error: allAppointmentsError } = await supabase
        .from('appointments')
        .select('status, total_amount, appointment_date')
        .eq('client_id', user.id)

      if (allAppointmentsError) {
        console.error('Error fetching all appointments:', allAppointmentsError)
      }

      const stats = {
        total_visits: allAppointments?.filter(a => a.status === 'completed').length || 0,
        total_spent: allAppointments?.reduce((sum, a) => sum + (a.total_amount || 0), 0) || 0,
        loyalty_points: Math.floor((allAppointments?.reduce((sum, a) => sum + (a.total_amount || 0), 0) || 0) / 10) // 1 point per $10 spent
      }

      // Construct complete profile
      const completeProfile: CompleteProfile = {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        phone: userData.phone,
        role: userData.role as 'client' | 'worker' | 'admin',
        is_active: userData.is_active || false,
        created_at: userData.created_at || null,
        client_profile: {
          id: userData.id,
          preferred_contact: 'email',
          preferred_worker_id: null,
          last_visit_date: allAppointments?.find(a => a.status === 'completed')?.appointment_date || null,
          total_visits: stats.total_visits,
          total_spent: stats.total_spent,
          loyalty_points: stats.loyalty_points,
          created_at: userData.created_at || null,
          updated_at: userData.created_at || null
        },
        preferred_worker: null,
        upcoming_appointments: upcomingAppointments || [],
        recent_services: recentServices || []
      }

      setProfile(completeProfile)
      setEditedProfile({
        full_name: completeProfile.full_name,
        phone: completeProfile.phone
      })
    } catch (error) {
      console.error('Error in fetchProfile:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    if (profile) {
      setEditedProfile({
        full_name: profile.full_name,
        phone: profile.phone
      })
    }
  }, [profile])

  const handleInputChange = (field: keyof EditableProfile, value: string | null) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!profile) return

    try {
      setIsSaving(true)
      const supabase = createClient()

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: editedProfile.full_name || undefined,
          phone: editedProfile.phone || undefined
        })
        .eq('id', profile.id)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        toast.error('Failed to update profile')
        return
      }

      // Refresh profile data
      await fetchProfile()
      setIsEditing(false)
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error in handleSave:', error)
      toast.error('An error occurred while saving')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF6B6B] mx-auto" />
          <p className="text-gray-500">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="bg-red-100 rounded-full p-4 inline-block">
            <X className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-red-500">Error Loading Profile</h1>
          <p className="text-gray-600">{error || 'Profile not found'}</p>
          <Button 
            variant="outline"
            onClick={() => window.history.back()}
            className="mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-[#FF6B6B]/10 rounded-full p-4">
              <User className="h-8 w-8 text-[#FF6B6B]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{profile.full_name}</h1>
              <p className="text-gray-500">Member since {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setEditedProfile({
                      full_name: profile.full_name,
                      phone: profile.phone
                    })
                  }}
                  disabled={isSaving}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Profile Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Full Name</Label>
                {isEditing ? (
                  <Input
                    value={editedProfile.full_name || ''}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                  />
                ) : (
                  <p>{profile.full_name}</p>
                )}
              </div>
              <div>
                <Label>Email</Label>
                <div className="flex items-center gap-2">
                  <Input value={profile.email} disabled />
                  {editedProfile.full_name === profile.full_name && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Preferred
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={editedProfile.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                ) : (
                  <p>{profile.phone || 'Not provided'}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Member Since</Label>
                  <p>{profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}</p>
                </div>
                <div>
                  <Label>Total Visits</Label>
                  <p>{profile.client_profile.total_visits}</p>
                </div>
                <div>
                  <Label>Total Spent</Label>
                  <p>${profile.client_profile.total_spent.toFixed(2)}</p>
                </div>
                <div>
                  <Label>Loyalty Points</Label>
                  <p>{profile.client_profile.loyalty_points}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Account Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Last Visit</span>
                  </div>
                  <p className="font-semibold">
                    {profile.client_profile.last_visit_date
                      ? new Date(profile.client_profile.last_visit_date).toLocaleDateString()
                      : 'No visits yet'}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Total Visits</span>
                  </div>
                  <p className="font-semibold">{profile.client_profile.total_visits}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Total Spent</span>
                  </div>
                  <p className="font-semibold">
                    ${profile.client_profile.total_spent.toFixed(2)}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Loyalty Points</span>
                  </div>
                  <p className="font-semibold">{profile.client_profile.loyalty_points}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.upcoming_appointments.length > 0 ? (
                <div className="space-y-4">
                  {profile.upcoming_appointments.map((appointment: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold">{appointment.service_name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(appointment.appointment_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming appointments</p>
                  <Button variant="outline" className="mt-4">
                    Book Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Recent Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.recent_services.length > 0 ? (
                <div className="space-y-4">
                  {profile.recent_services.map((service: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold">{service.service_name}</p>
                        <p className="text-sm text-gray-500">
                          {service.appointment_date ? new Date(service.appointment_date).toLocaleDateString() : 'No date'}
                        </p>
                      </div>
                      <p className="font-semibold">${service.total_amount.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recent services</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
} 
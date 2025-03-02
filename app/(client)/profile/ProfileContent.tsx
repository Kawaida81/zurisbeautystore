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
  created_at: string
  updated_at: string
}

interface UserProfile {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: 'client' | 'worker' | 'admin'
  is_active: boolean
  created_at: string
}

interface CompleteProfile {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: 'client' | 'worker' | 'admin'
  is_active: boolean
  created_at: string
  client_profile: ClientProfile
  preferred_worker: {
    id: string
    full_name: string
    email: string
  } | null
  upcoming_appointments: Array<any>
  recent_services: Array<any>
}

interface ProfileResponse {
  profile: CompleteProfile
}

export default function ProfileContent() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<CompleteProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<Partial<ClientProfile>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
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

        // Get client profile
        const { data: rpcResponse, error: profileError } = await supabase
          .rpc('get_client_profile', {
            p_client_id: user.id
          })

        if (profileError) {
          console.error('Profile fetch error:', JSON.stringify(profileError))
          throw new Error('Failed to fetch profile: ' + (profileError.message || 'Unknown error'))
        }

        // Debug logging
        console.log('Raw RPC response:', rpcResponse)

        // Handle empty response
        if (!rpcResponse || (Array.isArray(rpcResponse) && rpcResponse.length === 0)) {
          // Try to create a new profile
          const { error: createError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              preferred_contact: 'email',
              total_visits: 0,
              total_spent: 0,
              loyalty_points: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (createError) {
            console.error('Error creating profile:', createError)
            throw new Error('Failed to create profile')
          }

          // Retry fetching the profile
          const { data: retryResponse, error: retryError } = await supabase
            .rpc('get_client_profile', {
              p_client_id: user.id
            })

          if (retryError) {
            throw new Error('Failed to fetch profile after creation')
          }

          const retryData = retryResponse as ProfileResponse
          if (!retryData?.profile) {
            throw new Error('Invalid profile data structure after creation')
          }

          // Set the profile data
          setProfile(retryData.profile)
          setEditedProfile(retryData.profile.client_profile)
          return
        }

        const data = rpcResponse as ProfileResponse
        if (!data?.profile || typeof data.profile !== 'object') {
          console.error('Invalid profile data structure:', data)
          throw new Error('Invalid profile data structure')
        }

        // Set the profile data
        setProfile(data.profile)
        setEditedProfile(data.profile.client_profile)
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleInputChange = (field: keyof ClientProfile, value: any) => {
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

      const { error } = await supabase
        .from('profiles')
        .update({
          preferred_contact: editedProfile.preferred_contact,
          preferred_worker_id: editedProfile.preferred_worker_id
        })
        .eq('id', profile.id)

      if (error) throw error

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        client_profile: {
          ...prev.client_profile,
          ...editedProfile
        }
      } : null)

      setIsEditing(false)
      toast.success('Profile updated successfully')
    } catch (err) {
      console.error('Error updating profile:', err)
      toast.error('Failed to update profile')
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
              <p className="text-gray-500">Member since {new Date(profile.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setEditedProfile(profile.client_profile)
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
                <Input value={profile.full_name} disabled />
              </div>
              <div>
                <Label>Email</Label>
                <div className="flex items-center gap-2">
                  <Input value={profile.email} disabled />
                  {editedProfile.preferred_contact === 'email' && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Preferred
                    </span>
                  )}
                </div>
              </div>
              <div>
                <Label>Phone</Label>
                <div className="flex items-center gap-2">
                  <Input value={profile.phone || 'Not provided'} disabled />
                  {editedProfile.preferred_contact === 'phone' && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Preferred
                    </span>
                  )}
                </div>
              </div>
              {isEditing && (
                <div>
                  <Label>Preferred Contact Method</Label>
                  <Select
                    value={editedProfile.preferred_contact}
                    onValueChange={(value) => handleInputChange('preferred_contact', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select preferred contact" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
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
                          {new Date(service.service_date).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="font-semibold">${service.price.toFixed(2)}</p>
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
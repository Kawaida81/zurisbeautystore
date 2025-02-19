'use client'

import { useEffect, useState, useCallback } from 'react'
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
  profile: UserProfile
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
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
        const { data, error: profileError } = await supabase
          .rpc('get_client_profile', {
            p_client_id: user.id
          })

        if (profileError) {
          console.error('Profile fetch error:', JSON.stringify(profileError))
          throw new Error('Failed to fetch profile: ' + (profileError.message || 'Unknown error'))
        }
        if (!data) {
          throw new Error('No profile data returned from server')
        }

        // Parse the JSONB response
        const profileData = data as { profile: UserProfile }
        if (!profileData.profile) {
          throw new Error('Invalid profile data structure')
        }

        // Validate profile data
        if (!profileData.profile.client_profile) {
          throw new Error('Client profile data is missing')
        }

        setProfile(profileData.profile)
        setEditedProfile(profileData.profile.client_profile)
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
          <div className="flex gap-4">
            <Button 
              variant="outline"
              onClick={() => window.history.back()}
              className="border-gray-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setEditedProfile(profile.client_profile)
                  }}
                  disabled={isSaving}
                  className="border-gray-200"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  className="bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                className="bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Basic Information Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                <CardTitle className="flex items-center gap-2 text-gray-700">
                  <User className="w-5 h-5 text-[#FF6B6B]" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label className="text-gray-500 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input value={profile.email} readOnly className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone
                  </Label>
                  <Input value={profile.phone || ''} readOnly className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Preferred Contact Method</Label>
                  {isEditing ? (
                    <Select
                      value={editedProfile.preferred_contact}
                      onValueChange={(value) => handleInputChange('preferred_contact', value)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select contact method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input 
                      value={profile.client_profile.preferred_contact.charAt(0).toUpperCase() + 
                             profile.client_profile.preferred_contact.slice(1)} 
                      readOnly 
                      className="bg-gray-50"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Profile Details Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                <CardTitle className="flex items-center gap-2 text-gray-700">
                  <Star className="w-5 h-5 text-[#FF6B6B]" />
                  Profile Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label className="text-gray-500 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Loyalty Points
                  </Label>
                  <Input 
                    value={profile.client_profile.loyalty_points.toString()} 
                    readOnly 
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Total Visits
                  </Label>
                  <Input 
                    value={profile.client_profile.total_visits.toString()} 
                    readOnly 
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Total Spent
                  </Label>
                  <Input 
                    value={`$${profile.client_profile.total_spent.toFixed(2)}`} 
                    readOnly 
                    className="bg-gray-50"
                  />
                </div>
                {profile.client_profile.last_visit_date && (
                  <div className="space-y-2">
                    <Label className="text-gray-500 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Last Visit
                    </Label>
                    <Input 
                      value={new Date(profile.client_profile.last_visit_date).toLocaleDateString()} 
                      readOnly 
                      className="bg-gray-50"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
} 
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type WorkerProfile = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  role: 'worker'
  is_active: boolean
  created_at: string
}

export function WorkerProfile() {
  const [profile, setProfile] = useState<WorkerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<WorkerProfile>>({})

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setProfile(data as WorkerProfile)
      setFormData({
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof WorkerProfile, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { error } = await supabase
        .from('users')
        .update(formData)
        .eq('id', profile?.id)

      if (error) throw error

      toast.success('Profile updated successfully')
      setIsEditing(false)
      fetchProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B6B]" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link 
            href="/worker/dashboard" 
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Worker Profile</h1>
        </div>
        <Button
          variant={isEditing ? "outline" : "default"}
          onClick={() => {
            if (isEditing) {
              setFormData({
                first_name: profile?.first_name,
                last_name: profile?.last_name,
                phone: profile?.phone
              })
            }
            setIsEditing(!isEditing)
          }}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={isEditing ? formData.first_name || '' : profile?.first_name || ''}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={isEditing ? formData.last_name || '' : profile?.last_name || ''}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile?.email || ''}
                disabled
                type="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={isEditing ? formData.phone || '' : profile?.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!isEditing}
                type="tel"
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={profile?.role || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>Member Since</Label>
                <Input 
                  value={new Date(profile?.created_at || '').toLocaleDateString()} 
                  disabled 
                />
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 
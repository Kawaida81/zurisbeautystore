'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui/card'
import { Button } from '@/app/admin/components/ui/button'
import { Input } from '@/app/admin/components/ui/input'
import { Label } from '@/app/admin/components/ui/label'
import { LoadingSpinner } from '@/app/admin/components/loading-spinner'
import { toast } from 'react-hot-toast'

interface Settings {
  businessName: string
  email: string
  phone: string
  address: string
  loyaltyPointsRate: number
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    businessName: '',
    email: '',
    phone: '',
    address: '',
    loyaltyPointsRate: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .single()

        if (error) throw error
        if (data) {
          setSettings(data)
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
        toast.error('Failed to load settings. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const supabase = createClient()
      const { error } = await supabase
        .from('settings')
        .upsert(settings)

      if (error) throw error
      toast.success('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size={40} />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h2>
      </div>
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={settings.businessName}
                onChange={(e) =>
                  setSettings({ ...settings, businessName: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) =>
                  setSettings({ ...settings, email: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={settings.phone}
                onChange={(e) =>
                  setSettings({ ...settings, phone: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={settings.address}
                onChange={(e) =>
                  setSettings({ ...settings, address: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Loyalty Program</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="loyaltyPointsRate">
                Points earned per KSh 100 spent
              </Label>
              <Input
                id="loyaltyPointsRate"
                type="number"
                value={settings.loyaltyPointsRate}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    loyaltyPointsRate: parseFloat(e.target.value)
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <LoadingSpinner size={16} />
                <span className="ml-2">Saving...</span>
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 
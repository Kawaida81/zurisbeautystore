'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui/card'
import { Button } from '@/app/admin/components/ui/button'
import { Input } from '@/app/admin/components/ui/input'
import { Label } from '@/app/admin/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'react-hot-toast'

interface Settings {
  id: string
  name: string
  value: string
  created_at?: string | null
  updated_at?: string | null
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')

        if (error) {
          toast.error('Failed to fetch settings')
          return
        }

        if (data) {
          setSettings(data as Settings[])
        }
      } catch (error) {
        toast.error('An error occurred while fetching settings')
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const updateSetting = async (setting: Settings) => {
    try {
      const { error } = await supabase
        .from('settings')
        .update(setting)
        .eq('id', setting.id)

      if (error) {
        toast.error('Failed to update setting')
        return
      }

      toast.success('Setting updated successfully')
    } catch (error) {
      toast.error('An error occurred while updating setting')
    }
  }

  if (loading) {
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
        {settings.map((setting) => (
          <Card key={setting.id}>
            <CardHeader>
              <CardTitle>{setting.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="grid gap-2">
                <Label htmlFor={setting.id}>{setting.name}</Label>
                <Input
                  id={setting.id}
                  value={setting.value}
                  onChange={(e) =>
                    updateSetting({ ...setting, value: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
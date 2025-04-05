'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/app/admin/components/loading-spinner'
import { toast } from 'react-hot-toast'

interface DashboardMetrics {
  totalCustomers: number
  totalAppointments: number
  totalServices: number
  totalWorkers: number
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCustomers: 0,
    totalAppointments: 0,
    totalServices: 0,
    totalWorkers: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const supabase = createClient()
        
        // Fetch total customers
        const { count: customersCount } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
        
        // Fetch total appointments
        const { count: appointmentsCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
        
        // Fetch total services
        const { count: servicesCount } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
        
        // Fetch total workers
        const { count: workersCount } = await supabase
          .from('workers')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')

        setMetrics({
          totalCustomers: customersCount || 0,
          totalAppointments: appointmentsCount || 0,
          totalServices: servicesCount || 0,
          totalWorkers: workersCount || 0
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        toast.error('Failed to load dashboard data. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <LoadingSpinner size={40} />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard Overview</h2>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metrics Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{metrics.totalCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{metrics.totalAppointments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{metrics.totalServices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Workers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{metrics.totalWorkers}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
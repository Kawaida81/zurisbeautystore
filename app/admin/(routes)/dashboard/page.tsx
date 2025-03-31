'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui/card'
import { Overview, RecentSales } from '@/app/admin/components'

interface DashboardMetrics {
  totalSales: number
  totalCustomers: number
  totalAppointments: number
  totalProducts: number
  recentSales: any[]
  salesData: any[]
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSales: 0,
    totalCustomers: 0,
    totalAppointments: 0,
    totalProducts: 0,
    recentSales: [],
    salesData: []
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const supabase = createClient()
        
        // Fetch total sales
        const { data: salesData } = await supabase
          .from('sales')
          .select('amount')
        
        // Fetch total customers
        const { count: customersCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'client')
        
        // Fetch total appointments
        const { count: appointmentsCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
        
        // Fetch total products
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
        
        // Fetch recent sales
        const { data: recentSales } = await supabase
          .from('sales')
          .select(`
            *,
            client:users(full_name),
            worker:users(full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(5)

        // Calculate total sales amount
        const totalSales = salesData?.reduce((acc, sale) => acc + sale.amount, 0) || 0

        setMetrics({
          totalSales,
          totalCustomers: customersCount || 0,
          totalAppointments: appointmentsCount || 0,
          totalProducts: productsCount || 0,
          recentSales: recentSales || [],
          salesData: salesData || []
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSh {metrics.totalSales.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAppointments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProducts}</div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview data={metrics.salesData} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentSales data={metrics.recentSales} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
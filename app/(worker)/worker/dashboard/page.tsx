'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Calendar, DollarSign, Package, Users } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { format } from 'date-fns'
import Link from 'next/link'

interface QuickStat {
  title: string
  value: string | number
  icon: React.ReactNode
  description: string
}

interface DatabaseSale {
  total_amount: number
  created_at: string
  worker: {
    id: string
  } | null
}

interface Sale {
  total_amount: number
}

type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

interface Appointment {
  id: string
  client: {
    full_name: string
    email: string
  }
  service: {
    name: string
  }
  appointment_date: string
  status: AppointmentStatus
}

export default function WorkerDashboard() {
  const [quickStats, setQuickStats] = useState<QuickStat[]>([
    {
      title: "Today's Appointments",
      value: '...',
      icon: <Calendar className="h-8 w-8 text-[#FF6B6B]" />,
      description: 'Scheduled for today'
    },
    {
      title: "Today's Sales",
      value: '...',
      icon: <DollarSign className="h-8 w-8 text-[#FF6B6B]" />,
      description: 'Revenue today'
    },
    {
      title: 'Inventory Alerts',
      value: '...',
      icon: <Package className="h-8 w-8 text-[#FF6B6B]" />,
      description: 'Items low in stock'
    },
    {
      title: 'Active Clients',
      value: '...',
      icon: <Users className="h-8 w-8 text-[#FF6B6B]" />,
      description: 'Served this month'
    }
  ])

  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    const supabase = createClient()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    // Fetch today's appointments
    const { count: appointmentsCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact' })
      .eq('worker_id', user.id)
      .neq('client_id', user.id) // Only client-created appointments
      .gte('appointment_date', today.toISOString())
      .lt('appointment_date', new Date(today.getTime() + 86400000).toISOString())

    // Fetch today's sales
    const { data: salesData } = await supabase
      .from('sales')
      .select(`
        total_amount,
        created_at,
        worker:worker_id (
          id
        )
      `)
      .gte('created_at', today.toISOString())
      .lt('created_at', new Date(today.getTime() + 86400000).toISOString())

    console.log('Raw sales data:', salesData)

    // Calculate total sales for the current worker only
    const todaySales = Array.isArray(salesData) 
      ? (salesData as unknown as DatabaseSale[])
          .filter(sale => sale.worker?.id === user.id)
          .reduce((sum, sale) => sum + (sale.total_amount || 0), 0)
      : 0

    console.log('Calculated today sales:', todaySales)

    // Fetch low stock items
    const { count: lowStockCount } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .lt('stock_quantity', 10)

    // Fetch active clients this month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const { count: activeClientsCount } = await supabase
      .from('appointments')
      .select('client_id', { count: 'exact' })
      .eq('worker_id', user.id)
      .neq('client_id', user.id) // Only client-created appointments
      .gte('appointment_date', monthStart.toISOString())
      .lt('appointment_date', today.toISOString())

    // Fetch upcoming appointments for the next 7 days
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    const { data: upcomingData, error: upcomingError } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        status,
        users!appointments_client_id_fkey (
          full_name,
          email
        ),
        services (
          name
        )
      `)
      .eq('status', 'pending') // Only fetch pending appointments
      .neq('client_id', user.id) // Only client-created appointments
      .gte('appointment_date', today.toISOString())
      .lte('appointment_date', nextWeek.toISOString())
      .order('appointment_date', { ascending: true })
      .limit(5)

    if (upcomingError) {
      console.error('Error fetching upcoming appointments:', upcomingError)
    } else {
      setUpcomingAppointments(upcomingData.map((item: any) => ({
        id: item.id,
        client: {
          full_name: item.users?.full_name || 'Unknown',
          email: item.users?.email || 'No email'
        },
        service: {
          name: item.services?.name || 'Unknown service'
        },
        appointment_date: item.appointment_date,
        status: item.status
      })))
    }

    setQuickStats([
      {
        title: "Today's Appointments",
        value: appointmentsCount || 0,
        icon: <Calendar className="h-8 w-8 text-[#FF6B6B]" />,
        description: 'Scheduled for today'
      },
      {
        title: "Today's Sales",
        value: `Kes ${Number(todaySales).toFixed(2)}`,
        icon: <DollarSign className="h-8 w-8 text-[#FF6B6B]" />,
        description: 'Revenue today'
      },
      {
        title: 'Inventory Alerts',
        value: lowStockCount || 0,
        icon: <Package className="h-8 w-8 text-[#FF6B6B]" />,
        description: 'Items low in stock'
      },
      {
        title: 'Active Clients',
        value: activeClientsCount || 0,
        icon: <Users className="h-8 w-8 text-[#FF6B6B]" />,
        description: 'Served this month'
      }
    ])

    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B6B]"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Welcome Back!</h1>
        <p className="text-gray-600">Here's what's happening today</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {quickStats.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <h3 className="text-2xl font-bold mt-2 mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-500">{stat.description}</p>
              </div>
              <div className="bg-[#FF6B6B]/10 p-3 rounded-lg">
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <p className="text-gray-500 text-center py-8">
              Activity feed coming soon...
            </p>
          </div>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Pending Appointments</h2>
            <Link 
              href="/worker/appointments" 
              className="text-sm text-[#FF6B6B] hover:text-[#FF6B6B]/80"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {upcomingAppointments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No pending appointments
              </p>
            ) : (
              upcomingAppointments.map((appointment) => (
                <div 
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{appointment.client.full_name}</p>
                    <p className="text-sm text-gray-600">{appointment.service.name}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(appointment.appointment_date), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                    {appointment.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
} 
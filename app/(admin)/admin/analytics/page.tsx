'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar,
  Package,
  Star
} from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'

interface AnalyticsData {
  revenue: {
    total: number
    previousPeriod: number
    percentageChange: number
  }
  appointments: {
    total: number
    completed: number
    cancelled: number
    percentageCompleted: number
  }
  products: {
    totalSold: number
    revenue: number
    topSelling: Array<{
      name: string
      quantity: number
      revenue: number
    }>
  }
  services: {
    totalBooked: number
    revenue: number
    topServices: Array<{
      name: string
      bookings: number
      revenue: number
    }>
  }
  clients: {
    total: number
    new: number
    returning: number
  }
}

interface SaleItem {
  product: {
    name: string
  }
  quantity: number
  price_per_unit: number
}

interface Sale {
  id: string
  total_amount: number
  created_at: string
  service_id: string | null
  items: SaleItem[]
}

interface Appointment {
  id: string
  status: string
  service: {
    name: string
    price: number
  }
}

type Database = {
  public: {
    Tables: {
      sales: {
        Row: {
          id: string
          total_amount: number
          created_at: string
          service_id: string | null
          items: {
            quantity: number
            price_per_unit: number
            product: {
              name: string
            }
          }[]
        }
      }
      appointments: {
        Row: {
          id: string
          status: string
          service: {
            name: string
            price: number
          }
        }
      }
    }
  }
}

export default function AdminAnalytics() {
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week')
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    revenue: {
      total: 0,
      previousPeriod: 0,
      percentageChange: 0
    },
    appointments: {
      total: 0,
      completed: 0,
      cancelled: 0,
      percentageCompleted: 0
    },
    products: {
      totalSold: 0,
      revenue: 0,
      topSelling: []
    },
    services: {
      totalBooked: 0,
      revenue: 0,
      topServices: []
    },
    clients: {
      total: 0,
      new: 0,
      returning: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeframe])

  const fetchAnalyticsData = async () => {
    try {
      const supabase = createClient()
      const now = new Date()
      let startDate: Date
      let previousStartDate: Date

      if (timeframe === 'week') {
        startDate = subDays(now, 7)
        previousStartDate = subDays(startDate, 7)
      } else {
        startDate = startOfMonth(now)
        previousStartDate = startOfMonth(subDays(startDate, 1))
      }

      // Fetch current period sales
      const { data: currentSales } = await supabase
        .from('sales')
        .select(`
          id,
          total_amount,
          created_at,
          service_id,
          items:sale_items (
            quantity,
            price_per_unit,
            product:products (
              name
            )
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString()) as { 
          data: Database['public']['Tables']['sales']['Row'][] | null 
        }

      // Fetch previous period sales
      const { data: previousSales } = await supabase
        .from('sales')
        .select('total_amount')
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString())

      // Fetch appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          id,
          status,
          service:service_id (
            name,
            price
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString()) as {
          data: Database['public']['Tables']['appointments']['Row'][] | null
        }

      // Calculate analytics
      const currentRevenue = currentSales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0
      const previousRevenue = previousSales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0
      const percentageChange = previousRevenue === 0 
        ? 100 
        : ((currentRevenue - previousRevenue) / previousRevenue) * 100

      // Process product sales
      const productSales = new Map()
      ;(currentSales || []).forEach((sale) => {
        if (sale.items) {
          sale.items.forEach((item) => {
            const productName = item.product.name
            const revenue = item.quantity * item.price_per_unit
            
            if (productSales.has(productName)) {
              const current = productSales.get(productName)
              productSales.set(productName, {
                quantity: current.quantity + item.quantity,
                revenue: current.revenue + revenue
              })
            } else {
              productSales.set(productName, {
                quantity: item.quantity,
                revenue: revenue
              })
            }
          })
        }
      })

      const topProducts = Array.from(productSales.entries())
        .map(([name, data]) => ({
          name,
          quantity: data.quantity,
          revenue: data.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      // Process service bookings
      const serviceBookings = new Map()
      ;(appointments || []).forEach((appointment) => {
        const serviceName = appointment.service?.name
        const servicePrice = appointment.service?.price || 0
        
        if (serviceName) {
          if (serviceBookings.has(serviceName)) {
            const current = serviceBookings.get(serviceName)
            serviceBookings.set(serviceName, {
              bookings: current.bookings + 1,
              revenue: current.revenue + servicePrice
            })
          } else {
            serviceBookings.set(serviceName, {
              bookings: 1,
              revenue: servicePrice
            })
          }
        }
      })

      const topServices = Array.from(serviceBookings.entries())
        .map(([name, data]) => ({
          name,
          bookings: data.bookings,
          revenue: data.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      // Calculate appointment statistics
      const totalAppointments = appointments?.length || 0
      const completedAppointments = appointments?.filter(a => a.status === 'completed').length || 0
      const cancelledAppointments = appointments?.filter(a => a.status === 'cancelled').length || 0

      setAnalytics({
        revenue: {
          total: currentRevenue,
          previousPeriod: previousRevenue,
          percentageChange
        },
        appointments: {
          total: totalAppointments,
          completed: completedAppointments,
          cancelled: cancelledAppointments,
          percentageCompleted: totalAppointments === 0 
            ? 0 
            : (completedAppointments / totalAppointments) * 100
        },
        products: {
          totalSold: Array.from(productSales.values()).reduce((sum, data) => sum + data.quantity, 0),
          revenue: Array.from(productSales.values()).reduce((sum, data) => sum + data.revenue, 0),
          topSelling: topProducts
        },
        services: {
          totalBooked: Array.from(serviceBookings.values()).reduce((sum, data) => sum + data.bookings, 0),
          revenue: Array.from(serviceBookings.values()).reduce((sum, data) => sum + data.revenue, 0),
          topServices
        },
        clients: {
          total: 0, // To be implemented
          new: 0,
          returning: 0
        }
      })

      setLoading(false)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast({
        title: "Error",
        description: "Could not fetch analytics data",
        variant: "destructive",
      })
      setLoading(false)
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
      <Toaster />
      
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-600 mt-1">Track business performance and insights</p>
        </div>
        <Select value={timeframe} onValueChange={(value: 'week' | 'month') => setTimeframe(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <h3 className="text-2xl font-bold mt-2">Kes {analytics.revenue.total.toFixed(2)}</h3>
              <p className={`text-xs mt-1 flex items-center ${
                analytics.revenue.percentageChange >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {analytics.revenue.percentageChange >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(analytics.revenue.percentageChange).toFixed(1)}% from last period
              </p>
            </div>
            <div className="bg-[#FF6B6B]/10 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-[#FF6B6B]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Appointments</p>
              <h3 className="text-2xl font-bold mt-2">{analytics.appointments.total}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {analytics.appointments.percentageCompleted.toFixed(1)}% completion rate
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Products Sold</p>
              <h3 className="text-2xl font-bold mt-2">{analytics.products.totalSold}</h3>
              <p className="text-xs text-gray-500 mt-1">
                Kes {analytics.products.revenue.toFixed(2)} in revenue
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Services Booked</p>
              <h3 className="text-2xl font-bold mt-2">{analytics.services.totalBooked}</h3>
              <p className="text-xs text-gray-500 mt-1">
                Kes {analytics.services.revenue.toFixed(2)} in revenue
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Selling Products */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Top Selling Products</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.products.topSelling.map((product) => (
                  <TableRow key={product.name}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>Kes {product.revenue.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Most Booked Services */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Most Booked Services</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.services.topServices.map((service) => (
                  <TableRow key={service.name}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{service.bookings}</TableCell>
                    <TableCell>Kes {service.revenue.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Appointment Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Appointments</span>
              <span className="font-semibold">{analytics.appointments.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Completed</span>
              <span className="font-semibold text-green-600">
                {analytics.appointments.completed}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Cancelled</span>
              <span className="font-semibold text-red-600">
                {analytics.appointments.cancelled}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Completion Rate</span>
              <span className="font-semibold">
                {analytics.appointments.percentageCompleted.toFixed(1)}%
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Revenue Breakdown</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Revenue</span>
              <span className="font-semibold">
                Kes {analytics.revenue.total.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Products Revenue</span>
              <span className="font-semibold">
                Kes {analytics.products.revenue.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Services Revenue</span>
              <span className="font-semibold">
                Kes {analytics.services.revenue.toFixed(2)}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Performance Indicators</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Average Order Value</span>
              <span className="font-semibold">
                Kes {(analytics.revenue.total / (analytics.products.totalSold || 1)).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Revenue Growth</span>
              <span className={`font-semibold ${
                analytics.revenue.percentageChange >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {analytics.revenue.percentageChange >= 0 ? '+' : ''}
                {analytics.revenue.percentageChange.toFixed(1)}%
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 
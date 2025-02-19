'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { 
  Users,
  UserCheck,
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from 'date-fns'

interface DashboardStats {
  totalPatients: number
  availableStaff: number
  avgTreatmentCosts: number
  availableCars: number
  patientsThisMonth: number
  totalAppointments: number
  totalRevenue: number
  totalProducts: number
}

interface RecentSale {
  id: string
  created_at: string
  total_amount: number
  payment_method: string
  client: {
    full_name: string
  } | null
  worker: {
    full_name: string
  } | null
}

interface StaffMember {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
}

interface SaleResponse {
  id: string
  created_at: string
  total_amount: number
  payment_method: string
  client: {
    full_name: string
  } | null
  worker: {
    full_name: string
  } | null
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    availableStaff: 0,
    avgTreatmentCosts: 0,
    availableCars: 0,
    patientsThisMonth: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    totalProducts: 0
  })
  const [recentSales, setRecentSales] = useState<RecentSale[]>([])
  const [activeStaff, setActiveStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const supabase = createClient()
      
      // Fetch total clients (patients)
      const { count: clientsCount } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('role', 'client')

      // Fetch available staff
      const { count: staffCount } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('role', 'worker')

      // Fetch average service cost
      const { data: services } = await supabase
        .from('services')
        .select('price')
        .eq('is_active', true)

      const avgCost = services ? services.reduce((sum, service) => sum + (service.price || 0), 0) / (services.length || 1) : 0

      // Fetch total products
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('is_active', true)

      // Fetch recent sales
      const { data: sales } = await supabase
        .from('sales')
        .select(`
          id,
          created_at,
          total_amount,
          payment_method,
          client:client_id(full_name),
          worker:worker_id(full_name)
        `)
        .returns<SaleResponse[]>()
        .order('created_at', { ascending: false })
        .limit(5)

      // Fetch active staff
      const { data: staff } = await supabase
        .from('users')
        .select('id, full_name, email, role, created_at')
        .eq('role', 'worker')
        .order('created_at', { ascending: false })
        .limit(5)

      // Calculate total revenue
      const { data: allSales } = await supabase
        .from('sales')
        .select('total_amount')

      const totalRevenue = allSales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0

      // Calculate total appointments
      const { count: appointmentsCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact' })

      setStats({
        totalPatients: clientsCount || 0,
        availableStaff: staffCount || 0,
        avgTreatmentCosts: avgCost,
        availableCars: 38, // Placeholder
        patientsThisMonth: 3240, // Placeholder
        totalAppointments: appointmentsCount || 0,
        totalRevenue: totalRevenue,
        totalProducts: productsCount || 0
      })

      if (sales) {
        const formattedSales: RecentSale[] = sales.map(sale => ({
          id: sale.id,
          created_at: sale.created_at,
          total_amount: sale.total_amount,
          payment_method: sale.payment_method,
          client: sale.client,
          worker: sale.worker
        }))
        setRecentSales(formattedSales)
      }

      setActiveStaff(staff || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
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
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <h3 className="text-2xl font-bold mt-2">{stats.totalPatients}</h3>
              <p className="text-xs text-gray-500 mt-1">+2.5% from last month</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Staff</p>
              <h3 className="text-2xl font-bold mt-2">{stats.availableStaff}</h3>
              <p className="text-xs text-gray-500 mt-1">Currently working</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <h3 className="text-2xl font-bold mt-2">Kes {stats.totalRevenue.toFixed(2)}</h3>
              <p className="text-xs text-green-500 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +4.75% from last month
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <h3 className="text-2xl font-bold mt-2">{stats.totalProducts}</h3>
              <p className="text-xs text-red-500 mt-1 flex items-center">
                <TrendingDown className="h-3 w-3 mr-1" />
                -1.2% from last month
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Sales</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Worker</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{sale.client?.full_name || 'Walk-in Client'}</TableCell>
                    <TableCell>{sale.worker?.full_name || 'N/A'}</TableCell>
                    <TableCell>Kes {sale.total_amount.toFixed(2)}</TableCell>
                    <TableCell>{format(new Date(sale.created_at), 'MMM d, yyyy')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Active Staff Members</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Join Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeStaff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.full_name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{format(new Date(member.created_at), 'MMM d, yyyy')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Appointments Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Appointments</span>
              <span className="font-semibold">{stats.totalAppointments}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Completed</span>
              <span className="font-semibold text-green-600">75%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pending</span>
              <span className="font-semibold text-yellow-600">20%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Cancelled</span>
              <span className="font-semibold text-red-600">5%</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Revenue Breakdown</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Services</span>
              <span className="font-semibold">65%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Products</span>
              <span className="font-semibold">35%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Avg. Transaction</span>
              <span className="font-semibold">Kes {stats.avgTreatmentCosts.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <button className="w-full bg-blue-50 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors text-left">
              View All Appointments
            </button>
            <button className="w-full bg-green-50 text-green-600 py-2 px-4 rounded-lg hover:bg-green-100 transition-colors text-left">
              Manage Staff
            </button>
            <button className="w-full bg-purple-50 text-purple-600 py-2 px-4 rounded-lg hover:bg-purple-100 transition-colors text-left">
              View Sales Report
            </button>
            <button className="w-full bg-orange-50 text-orange-600 py-2 px-4 rounded-lg hover:bg-orange-100 transition-colors text-left">
              Check Inventory
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
} 
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui/card'
import { Overview } from '@/app/admin/components/Overview'
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'

interface AnalyticsData {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  topProducts: Array<{
    name: string
    total_sales: number
  }>
  monthlySales: Array<{
    amount: number
    created_at: string
  }>
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topProducts: [],
    monthlySales: []
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const supabase = createClient()
        
        // Fetch sales data
        const { data: salesData } = await supabase
          .from('sales')
          .select('amount, created_at')
        
        // Calculate total revenue and orders
        const totalRevenue = salesData?.reduce((acc, sale) => acc + sale.amount, 0) || 0
        const totalOrders = salesData?.length || 0
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

        // Fetch top products
        const { data: topProducts } = await supabase
          .from('products')
          .select('name, total_sales')
          .order('total_sales', { ascending: false })
          .limit(5)

        setAnalytics({
          totalRevenue,
          totalOrders,
          averageOrderValue,
          topProducts: topProducts || [],
          monthlySales: salesData || []
        })
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSh {analytics.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KSh {analytics.averageOrderValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview data={analytics.monthlySales} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {analytics.topProducts.map((product) => (
                <div key={product.name} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.total_sales} sales
                    </p>
                  </div>
                  <div className="ml-auto font-medium">
                    {((product.total_sales / analytics.totalOrders) * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { format, subDays, subMonths } from 'date-fns'
import { LoadingSpinner } from '@/app/admin/components/loading-spinner'
import { toast } from 'react-hot-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface DailyProfit {
  date: string
  total_revenue: number
  total_cost: number
  profit: number
  order_count: number
  average_order_value: number
}

interface CategoryProfit {
  category: string
  total_revenue: number
  total_cost: number
  profit: number
  order_count: number
  average_order_value: number
}

interface TopItem {
  item_id: string
  item_name: string
  item_type: string
  total_revenue: number
  total_cost: number
  profit: number
  units_sold: number
}

export default function ProfitPage() {
  const [view, setView] = useState<'daily' | 'monthly'>('daily')
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '12m'>('30d')
  const [loading, setLoading] = useState(false)
  const [dailyProfits, setDailyProfits] = useState<DailyProfit[]>([])
  const [categoryProfits, setCategoryProfits] = useState<CategoryProfit[]>([])
  const [topItems, setTopItems] = useState<TopItem[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'top-items'>('overview')
  const supabase = createClient()

  // Calculate date range based on selected time range
  const getDateRange = () => {
    const endDate = new Date()
    let startDate: Date

    switch (timeRange) {
      case '7d':
        startDate = subDays(endDate, 7)
        break
      case '30d':
        startDate = subDays(endDate, 30)
        break
      case '90d':
        startDate = subDays(endDate, 90)
        break
      case '12m':
        startDate = subMonths(endDate, 12)
        break
      default:
        startDate = subDays(endDate, 30)
    }

    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const { startDate, endDate } = getDateRange()

      // Fetch profits based on view
      const { data: profits, error: profitsError } = await supabase.rpc(
        view === 'daily' ? 'get_daily_profits' : 'get_monthly_profits',
        { p_start_date: startDate, p_end_date: endDate }
      )

      if (profitsError) throw profitsError
      setDailyProfits(profits || [])

      // Fetch category profits
      const { data: categories, error: categoriesError } = await supabase.rpc(
        'get_profit_by_category',
        { p_start_date: startDate, p_end_date: endDate }
      )

      if (categoriesError) throw categoriesError
      setCategoryProfits(categories || [])

      // Fetch top items
      const { data: items, error: itemsError } = await supabase.rpc(
        'get_top_performing_items',
        { p_start_date: startDate, p_end_date: endDate, p_limit: 10 }
      )

      if (itemsError) throw itemsError
      setTopItems(items || [])

      toast.success('Report generated successfully')
    } catch (error) {
      console.error('Error fetching profit data:', error)
      toast.error('Failed to generate report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when view or time range changes
  useEffect(() => {
    fetchData()
  }, [view, timeRange])

  const getChartData = () => {
    return {
      labels: dailyProfits.map(item => format(new Date(item.date), view === 'daily' ? 'MMM d' : 'MMM yyyy')),
      datasets: [
        {
          label: 'Revenue',
          data: dailyProfits.map(item => item.total_revenue),
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderColor: 'rgb(34, 197, 94)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Profit',
          data: dailyProfits.map(item => item.profit),
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgb(59, 130, 246)',
          fill: true,
          tension: 0.4
        }
      ]
    }
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        beginAtZero: true,
        ticks: {
          callback: function(value: number | string) {
            if (typeof value === 'number') {
              return `KSh ${value.toLocaleString()}`
            }
            return value
          }
        }
      }
    }
  } as const

  const getCategoryChartData = () => {
    return {
      labels: categoryProfits.map(item => item.category),
      datasets: [
        {
          label: 'Revenue by Category',
          data: categoryProfits.map(item => item.total_revenue),
          backgroundColor: [
            'rgba(34, 197, 94, 0.6)',
            'rgba(59, 130, 246, 0.6)'
          ]
        }
      ]
    }
  }

  const categoryChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        beginAtZero: true,
        ticks: {
          callback: function(value: number | string) {
            if (typeof value === 'number') {
              return `KSh ${value.toLocaleString()}`
            }
            return value
          }
        }
      }
    }
  } as const

  const getTotalMetrics = () => {
    const revenue = dailyProfits.reduce((sum, day) => sum + day.total_revenue, 0)
    const cost = dailyProfits.reduce((sum, day) => sum + day.total_cost, 0)
    const profit = dailyProfits.reduce((sum, day) => sum + day.profit, 0)
    const orders = dailyProfits.reduce((sum, day) => sum + day.order_count, 0)
    const averageOrderValue = orders > 0 ? revenue / orders : 0

    return { revenue, cost, profit, orders, averageOrderValue }
  }

  const exportData = () => {
    const csv = [
      ['Date', 'Revenue', 'Cost', 'Profit', 'Orders', 'Average Order Value'].join(','),
      ...dailyProfits.map(item => [
        item.date,
        item.total_revenue,
        item.total_cost,
        item.profit,
        item.order_count,
        item.average_order_value
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.setAttribute('hidden', '')
    a.setAttribute('href', url)
    a.setAttribute('download', `profit-report-${timeRange}.csv`)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Profit Analytics</h1>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={exportData}
            disabled={loading}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KSh {getTotalMetrics().revenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KSh {getTotalMetrics().cost.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              KSh {getTotalMetrics().profit.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KSh {getTotalMetrics().averageOrderValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          onClick={() => setActiveTab('overview')}
          className={activeTab === 'overview' ? 'bg-primary text-primary-foreground' : ''}
        >
          Overview
        </Button>
        <Button
          variant="outline"
          onClick={() => setActiveTab('categories')}
          className={activeTab === 'categories' ? 'bg-primary text-primary-foreground' : ''}
        >
          Categories
        </Button>
        <Button
          variant="outline"
          onClick={() => setActiveTab('top-items')}
          className={activeTab === 'top-items' ? 'bg-primary text-primary-foreground' : ''}
        >
          Top Items
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{view === 'daily' ? 'Daily' : 'Monthly'} Revenue & Profit</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <LoadingSpinner size={40} />
                </div>
              ) : (
                <div className="h-[300px]">
                  <Line data={getChartData()} options={chartOptions} />
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Revenue & Profit Trends</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setView('daily')}
                    className={view === 'daily' ? 'bg-primary text-primary-foreground' : ''}
                  >
                    Daily
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setView('monthly')}
                    className={view === 'monthly' ? 'bg-primary text-primary-foreground' : ''}
                  >
                    Monthly
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {loading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <LoadingSpinner size={40} />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-right py-3 px-4">Revenue</th>
                        <th className="text-right py-3 px-4">Cost</th>
                        <th className="text-right py-3 px-4">Profit</th>
                        <th className="text-right py-3 px-4">Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyProfits.map((day) => (
                        <tr key={day.date} className="border-b">
                          <td className="py-3 px-4">{format(new Date(day.date), view === 'daily' ? 'MMM d, yyyy' : 'MMM yyyy')}</td>
                          <td className="text-right py-3 px-4">KSh {day.total_revenue.toLocaleString()}</td>
                          <td className="text-right py-3 px-4">KSh {day.total_cost.toLocaleString()}</td>
                          <td className="text-right py-3 px-4 text-green-600">KSh {day.profit.toLocaleString()}</td>
                          <td className="text-right py-3 px-4">{day.order_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'categories' && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-24">
                <LoadingSpinner size={40} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Category</th>
                      <th className="text-right py-3 px-4">Revenue</th>
                      <th className="text-right py-3 px-4">Cost</th>
                      <th className="text-right py-3 px-4">Profit</th>
                      <th className="text-right py-3 px-4">Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryProfits.map((category) => (
                      <tr key={category.category} className="border-b">
                        <td className="py-3 px-4">{category.category}</td>
                        <td className="text-right py-3 px-4">KSh {category.total_revenue.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">KSh {category.total_cost.toLocaleString()}</td>
                        <td className="text-right py-3 px-4 text-green-600">KSh {category.profit.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">{category.order_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'top-items' && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Items</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-24">
                <LoadingSpinner size={40} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Item</th>
                      <th className="text-left py-3 px-4">Type</th>
                      <th className="text-right py-3 px-4">Units Sold</th>
                      <th className="text-right py-3 px-4">Revenue</th>
                      <th className="text-right py-3 px-4">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topItems.map((item) => (
                      <tr key={item.item_id} className="border-b">
                        <td className="py-3 px-4">{item.item_name}</td>
                        <td className="py-3 px-4">{item.item_type}</td>
                        <td className="text-right py-3 px-4">{item.units_sold}</td>
                        <td className="text-right py-3 px-4">
                          KSh {item.total_revenue.toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4 text-green-600">
                          KSh {item.profit.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

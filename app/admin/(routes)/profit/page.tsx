'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/app/admin/components/ui/date-picker'
import { Download } from 'lucide-react'
import { format } from 'date-fns'
import { LoadingSpinner } from '@/app/admin/components/loading-spinner'
import { toast } from 'react-hot-toast'

interface Transaction {
  id: string
  date: string
  type: 'sale' | 'refund' | 'expense'
  amount: number
  description: string
  category: string
}

export default function ProfitPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [isLoading, setIsLoading] = useState(false)

  const fetchTransactions = async () => {
    if (!startDate || !endDate) return

    try {
      setIsLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: false })

      if (error) throw error

      setTransactions(data || [])
      toast.success('Report generated successfully')
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to generate report. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  interface Metrics {
    revenue: number
    refunds: number
    expenses: number
    netProfit: number
  }

  const calculateMetrics = (): Metrics => {
    const metrics = transactions.reduce((acc, transaction) => {
      const amount = transaction.amount
      if (transaction.type === 'sale') {
        acc.revenue += amount
      } else if (transaction.type === 'refund') {
        acc.refunds += amount
      } else if (transaction.type === 'expense') {
        acc.expenses += amount
      }
      return acc
    }, { revenue: 0, refunds: 0, expenses: 0, netProfit: 0 })

    metrics.netProfit = metrics.revenue - metrics.refunds - metrics.expenses
    return metrics
  }

  const exportData = () => {
    // Implementation for exporting data to CSV/PDF
  }

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Profit Tracking</h2>
        <Button onClick={exportData} className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-full sm:w-auto grid grid-cols-2 sm:flex gap-4">
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            placeholder="Start Date"
          />
          <DatePicker
            value={endDate}
            onChange={setEndDate}
            placeholder="End Date"
          />
        </div>
        <Button 
          onClick={fetchTransactions} 
          disabled={!startDate || !endDate || isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size={16} />
              <span className="ml-2">Generating...</span>
            </>
          ) : (
            'Generate Report'
          )}
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KSh {calculateMetrics().revenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refunds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              KSh {calculateMetrics().refunds.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              KSh {calculateMetrics().expenses.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              KSh {calculateMetrics().netProfit.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-24">
              <LoadingSpinner size={40} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <DataTable
                columns={columns}
                data={transactions}
                searchKey="description"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

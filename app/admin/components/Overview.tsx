'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'

interface OverviewProps {
  data: Array<{ amount: number; created_at: string }>
}

export function Overview({ data }: OverviewProps) {
  // Process data for the chart
  const chartData = data.reduce((acc: any[], sale) => {
    const date = new Date(sale.created_at).toLocaleDateString()
    const existingDay = acc.find(item => item.name === date)
    
    if (existingDay) {
      existingDay.total += sale.amount
    } else {
      acc.push({
        name: date,
        total: sale.amount
      })
    }
    
    return acc
  }, [])

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `KSh${value}`}
        />
        <Bar
          dataKey="total"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
        />
      </BarChart>
    </ResponsiveContainer>
  )
} 
'use client'

interface RecentSale {
  id: string
  amount: number
  created_at: string
  client: {
    full_name: string
  }
  worker: {
    full_name: string
  }
}

interface RecentSalesProps {
  data: RecentSale[]
}

export function RecentSales({ data }: RecentSalesProps) {
  return (
    <div className="space-y-8">
      {data.map((sale) => (
        <div key={sale.id} className="flex items-center">
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{sale.client.full_name}</p>
            <p className="text-sm text-muted-foreground">
              Served by {sale.worker.full_name}
            </p>
          </div>
          <div className="ml-auto font-medium">
            +KSh {sale.amount.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  )
} 
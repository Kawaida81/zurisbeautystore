'use client'

import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

export type Transaction = {
  id: string
  date: string
  type: 'sale' | 'refund' | 'expense'
  amount: number
  description: string
  category: string
}

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => (
      <div>
        <div>{format(new Date(row.getValue('date')), 'MMM d, yyyy')}</div>
        <div className="sm:hidden text-sm text-muted-foreground">
          {row.getValue('category')} | {row.getValue('description')}
        </div>
      </div>
    )
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('type') as string
      const badgeVariants: Record<string, 'default' | 'destructive' | 'secondary'> = {
        sale: 'default',
        refund: 'destructive',
        expense: 'secondary'
      }
      return (
        <Badge variant={badgeVariants[type as keyof typeof badgeVariants]}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Badge>
      )
    }
  },
  {
    accessorKey: 'category',
    header: 'Category',
    meta: {
      className: 'hidden sm:table-cell'
    }
  },
  {
    accessorKey: 'description',
    header: 'Description',
    meta: {
      className: 'hidden sm:table-cell'
    }
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => {
      const amount = row.getValue('amount') as number
      const type = row.getValue('type') as string
      const textColor = type === 'sale' ? 'text-green-600' : type === 'refund' ? 'text-red-600' : 'text-yellow-600'
      return (
        <div className={textColor}>
          KSh {amount.toLocaleString()}
        </div>
      )
    }
  }
]

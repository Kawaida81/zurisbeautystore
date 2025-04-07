'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DataTable } from '@/components/ui/data-table'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Heading } from '@/components/ui/heading'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { createColumns } from './columns'
import { CustomerModal } from './customer-modal'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'react-hot-toast'

import type { Customer } from './columns'

export default function CustomersPage() {
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const supabase = createClient()

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('list_customers', {
        p_search: search || null,
        p_sort_by: sortBy,
        p_sort_order: sortOrder
      })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('Failed to load customers. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers()
    }, 300)

    return () => clearTimeout(timer)
  }, [search, sortBy, sortOrder])

  const handleCreate = () => {
    setSelectedCustomer(undefined)
    setIsModalOpen(true)
  }

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsModalOpen(true)
  }

  const handleDelete = async (customer: Customer) => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone if they have existing orders.')) {
      return
    }

    try {
      const { error } = await supabase.rpc('delete_customer', {
        p_customer_id: customer.id
      })

      if (error) {
        if (error.message.includes('existing orders')) {
          toast.error('Cannot delete customer with existing orders')
        } else {
          throw error
        }
        return
      }

      await fetchCustomers()
      toast.success('Customer deleted successfully')
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast.error('Failed to delete customer. Please try again.')
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedCustomer(undefined)
  }

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Heading
            title="Customers"
            description="Manage your customer profiles and view their order history"
          />
          <Button 
            onClick={handleCreate}
            className="w-full sm:w-auto flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>
        <Separator />
        <Card className="p-4">
          <div className="mb-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="w-full sm:w-auto">
              <Input
                placeholder="Search customers..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3"
              >
                <option value="created_at">Join Date</option>
                <option value="name">Name</option>
                <option value="total_orders">Total Orders</option>
                <option value="total_spent">Total Spent</option>
              </select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-24">
              <LoadingSpinner size={40} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <DataTable
                columns={createColumns({
                  onEdit: handleEdit,
                  onDelete: handleDelete
                })}
                data={customers}
                searchKey="first_name"
              />
            </div>
          )}
        </Card>
      </div>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={fetchCustomers}
        customer={selectedCustomer}
      />
    </div>
  )
} 
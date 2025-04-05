'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DataTable } from '@/components/ui/data-table'
import { Card } from '@/components/ui/card'
import { Heading } from '@/components/ui/heading'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { createColumns } from './columns'
import { CustomerModal } from './customer-modal'
import { LoadingSpinner } from '@/app/admin/components/loading-spinner'
import { toast } from 'react-hot-toast'

import type { Customer } from './columns'

export default function CustomersPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          appointments:appointments(count),
          total_spent:orders(sum(total_amount))
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('Failed to load customers. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingCustomer(null)
    setIsModalOpen(true)
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setIsModalOpen(true)
  }

  const handleDelete = async (customer: Customer) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customer.id)

      if (error) throw error
      await fetchCustomers()
      toast.success('Customer deleted successfully')
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast.error('Failed to delete customer. Please try again.')
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingCustomer(null)
  }

  const handleModalSubmit = async () => {
    await fetchCustomers()
    handleModalClose()
  }

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Heading
            title="Customers"
            description="Manage your customer profiles and loyalty points"
          />
          <Button 
            onClick={handleCreate}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
        <Separator />
        <Card className="p-4">
          {isLoading ? (
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
                searchKey="full_name"
              />
            </div>
          )}
        </Card>
      </div>
      <CustomerModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        customer={editingCustomer}
      />
    </div>
  )
} 
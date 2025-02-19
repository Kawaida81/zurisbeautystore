'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Search, Plus, Edit2, Trash2, Clock, Star } from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
  category: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ServiceFormData {
  name: string
  description: string
  price: number
  duration: number
  category: string
  is_active: boolean
}

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showServiceDialog, setShowServiceDialog] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    price: 0,
    duration: 30,
    category: '',
    is_active: true
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setServices(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching services:', error)
      toast({
        title: "Error",
        description: "Could not fetch services data",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const handleCreateService = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('services')
        .insert([{
          name: formData.name,
          description: formData.description,
          price: formData.price,
          duration: formData.duration,
          category: formData.category,
          is_active: formData.is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])

      if (error) throw error

      toast({
        title: "Success",
        description: "Service created successfully",
      })

      setShowServiceDialog(false)
      resetForm()
      fetchServices()
    } catch (error) {
      console.error('Error creating service:', error)
      toast({
        title: "Error",
        description: "Could not create service. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateService = async () => {
    if (!editingService) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('services')
        .update({
          name: formData.name,
          description: formData.description,
          price: formData.price,
          duration: formData.duration,
          category: formData.category,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingService.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Service updated successfully",
      })

      setShowServiceDialog(false)
      resetForm()
      fetchServices()
    } catch (error) {
      console.error('Error updating service:', error)
      toast({
        title: "Error",
        description: "Could not update service. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleToggleActive = async (service: Service) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('services')
        .update({
          is_active: !service.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', service.id)

      if (error) throw error

      toast({
        title: "Success",
        description: `Service ${service.is_active ? 'deactivated' : 'activated'} successfully`,
      })

      fetchServices()
    } catch (error) {
      console.error('Error toggling service status:', error)
      toast({
        title: "Error",
        description: "Could not update service status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditClick = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      category: service.category,
      is_active: service.is_active
    })
    setShowServiceDialog(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      duration: 30,
      category: '',
      is_active: true
    })
    setEditingService(null)
  }

  const filteredServices = services.filter(service => {
    if (categoryFilter !== 'all' && service.category !== categoryFilter) return false
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      return (
        service.name.toLowerCase().includes(searchLower) ||
        service.description.toLowerCase().includes(searchLower) ||
        service.category.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const categories = Array.from(new Set(services.map(s => s.category)))

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
          <h1 className="text-2xl font-bold text-gray-900">Services Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage beauty services and treatments</p>
        </div>
        <Button 
          className="bg-[#FF6B6B] hover:bg-[#FF6B6B]/90"
          onClick={() => {
            resetForm()
            setShowServiceDialog(true)
          }}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Service
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Services</p>
              <h3 className="text-2xl font-bold mt-2">{services.length}</h3>
            </div>
            <div className="bg-[#FF6B6B]/10 p-3 rounded-lg">
              <Star className="h-6 w-6 text-[#FF6B6B]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Services</p>
              <h3 className="text-2xl font-bold mt-2">
                {services.filter(s => s.is_active).length}
              </h3>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Star className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <h3 className="text-2xl font-bold mt-2">{categories.length}</h3>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-[2] min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-gray-500">{service.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>{service.category}</TableCell>
                    <TableCell>
                      <span className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-1" />
                        {service.duration} min
                      </span>
                    </TableCell>
                    <TableCell>Kes {service.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        service.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {service.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(service)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(service)}
                          className={service.is_active ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredServices.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No services found</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Form Dialog */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
            <DialogDescription>
              {editingService 
                ? 'Update service information and details'
                : 'Create a new beauty service'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Service Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter service name"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter service description"
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Enter service category"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (Kes)</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  placeholder="30"
                  min="0"
                  step="15"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.is_active ? 'active' : 'inactive'}
                onValueChange={(value) => setFormData({ ...formData, is_active: value === 'active' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowServiceDialog(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingService ? handleUpdateService : handleCreateService}
              className="bg-[#FF6B6B] hover:bg-[#FF6B6B]/90"
            >
              {editingService ? 'Update Service' : 'Create Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
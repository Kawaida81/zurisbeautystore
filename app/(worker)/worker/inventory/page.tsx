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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Package, AlertTriangle, Search, Plus, Trash2, Upload, Clock, DollarSign } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  ProductWithRelations,
  ProductCategory,
  CreateProductInput,
  UpdateProductInput,
  StockUpdate,
  StockStatus
} from '@/lib/types/inventory'
import {
  getProducts,
  createProduct,
  updateProduct,
  updateStock,
  getCategories,
  createCategory
} from '@/lib/queries/inventory'
import { Badge } from '@/components/ui/badge'

// Service interfaces
interface Service {
  id: string
  name: string
  description: string | null
  duration: number
  price: number
  category: string
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ServiceFormData {
  name: string
  description: string
  duration: string
  price: string
  category: string
  image_url: string | null
  is_active: boolean
}

interface ProductFormData {
  name: string
  description: string
  category_id: string
  price: string
  stock_quantity: string
  image_url: string | null
  is_active: boolean
  reorder_point: string
}

export default function WorkerInventory() {
  const [products, setProducts] = useState<ProductWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [showLowStock, setShowLowStock] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductWithRelations | null>(null)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category_id: '',
    price: '',
    stock_quantity: '',
    image_url: null,
    is_active: true,
    reorder_point: '5'
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')

  // Service state variables
  const [services, setServices] = useState<Service[]>([])
  const [showAddServiceDialog, setShowAddServiceDialog] = useState(false)
  const [showEditServiceDialog, setShowEditServiceDialog] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null)
  const [serviceFormData, setServiceFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    duration: '',
    price: '',
    category: '',
    image_url: null,
    is_active: true
  })
  const [serviceImageFile, setServiceImageFile] = useState<File | null>(null)

  // Add this near the top of the component, with other state variables
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products')

  useEffect(() => {
    fetchInventory()
    fetchCategories()
    fetchServices()
  }, [searchQuery, categoryFilter, stockFilter])

  useEffect(() => {
    checkLowStock()
  }, [products])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const filters = {
        is_active: true,
        search: searchQuery,
        category_id: categoryFilter !== 'all' ? categoryFilter : undefined,
        min_stock: stockFilter === 'low' ? 0 : undefined,
        max_stock: stockFilter === 'low' ? 5 : undefined
      }

      const { data, error } = await getProducts(filters)
      if (error) throw error

      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching inventory:', error)
      toast({
        title: "Error fetching inventory",
        description: error instanceof Error ? error.message : "Could not fetch inventory data",
        variant: "destructive",
      })
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await getCategories()
      if (error) throw error
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast({
        title: "Error fetching categories",
        description: error instanceof Error ? error.message : "Could not fetch categories",
        variant: "destructive",
      })
    }
  }

  const fetchServices = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name')

      if (error) throw error
      
      // Properly type the data
      const typedData = (data || []).map(item => ({
        id: item.id as string,
        name: item.name as string,
        description: item.description as string | null,
        duration: item.duration as number,
        price: item.price as number,
        category: item.category as string,
        image_url: item.image_url as string | null,
        is_active: item.is_active as boolean,
        created_at: item.created_at as string,
        updated_at: item.updated_at as string
      }))

      setServices(typedData)
    } catch (error) {
      console.error('Error fetching services:', error)
      toast({
        title: "Error fetching services",
        description: error instanceof Error ? error.message : "Could not fetch services",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const checkLowStock = () => {
    const hasLowStock = products.some(product => 
      product.stock_quantity <= (product.reorder_point || 5)
    )
    setShowLowStock(hasLowStock)
  }

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `product-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: "Error uploading image",
        description: error instanceof Error ? error.message : "Could not upload image",
        variant: "destructive",
      })
      return null
    }
  }

  const handleAddProduct = async () => {
    try {
      setSubmitting(true)

      // Validate form data
      const errors = []
      if (!formData.name.trim()) errors.push('Product name is required')
      if (!formData.price || isNaN(parseFloat(formData.price))) errors.push('Valid price is required')
      if (!formData.stock_quantity || isNaN(parseInt(formData.stock_quantity))) errors.push('Valid stock quantity is required')
      if (!formData.category_id) errors.push('Category is required')
      if (!formData.reorder_point || isNaN(parseInt(formData.reorder_point))) errors.push('Valid reorder point is required')

      if (errors.length > 0) {
        toast({
          title: "Validation Error",
          description: errors.join(', '),
          variant: "destructive",
        })
        return
      }

      let imageUrl = null
      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile)
      }

      const productInput: CreateProductInput = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        category_id: formData.category_id,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        image_url: imageUrl,
        is_active: true,
        reorder_point: parseInt(formData.reorder_point)
      }

      const { error } = await createProduct(productInput)
      if (error) throw error

      toast({
        title: "Product added",
        description: "Product has been added successfully",
      })

      setShowAddDialog(false)
      setFormData({
        name: '',
        description: '',
        category_id: '',
        price: '',
        stock_quantity: '',
        image_url: null,
        is_active: true,
        reorder_point: '5'
      })
      setImageFile(null)
      fetchInventory()
    } catch (error) {
      console.error('Error adding product:', error)
      toast({
        title: "Error adding product",
        description: error instanceof Error ? error.message : "Could not add product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      setSubmitting(true);

      // Validate form data
      const errors = []
      if (!formData.name.trim()) errors.push('Product name is required')
      if (!formData.price || isNaN(parseFloat(formData.price))) errors.push('Valid price is required')
      if (!formData.stock_quantity || isNaN(parseInt(formData.stock_quantity))) errors.push('Valid stock quantity is required')
      if (!formData.category_id) errors.push('Category is required')
      if (!formData.reorder_point || isNaN(parseInt(formData.reorder_point))) errors.push('Valid reorder point is required')

      if (errors.length > 0) {
        toast({
          title: "Validation Error",
          description: errors.join(', '),
          variant: "destructive",
        })
        return
      }

      let imageUrl = formData.image_url
      if (imageFile) {
        const newImageUrl = await handleImageUpload(imageFile)
        if (newImageUrl) imageUrl = newImageUrl
      }

      const productInput: UpdateProductInput = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        category_id: formData.category_id,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        image_url: imageUrl,
        is_active: formData.is_active,
        reorder_point: parseInt(formData.reorder_point)
      }

      const { error } = await updateProduct(selectedProduct.id, productInput)
      if (error) throw error

      toast({
        title: "Product updated",
        description: "Product has been updated successfully",
      })

      setShowEditDialog(false)
      setSelectedProduct(null)
      setFormData({
        name: '',
        description: '',
        category_id: '',
        price: '',
        stock_quantity: '',
        image_url: null,
        is_active: true,
        reorder_point: '5'
      })
      setImageFile(null)
      fetchInventory()
    } catch (error) {
      console.error('Error updating product:', error)
      toast({
        title: "Error updating product",
        description: error instanceof Error ? error.message : "Could not update product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!productToDelete) return

    try {
      const { error } = await updateProduct(productToDelete, { is_active: false })
      if (error) throw error

      toast({
        title: "Success",
        description: "Product deleted successfully",
      })

      setProductToDelete(null)
      fetchInventory()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast({
        title: "Error",
        description: "Could not delete product. Please try again.",
        variant: "destructive",
      })
    }
  }

  const updateStockQuantity = async (productId: string, newQuantity: number) => {
    try {
      const stockUpdate: StockUpdate = {
        product_id: productId,
        quantity: newQuantity,
        type: 'set'
      }

      const { error } = await updateStock(stockUpdate)
      if (error) throw error

      toast({
        title: "Success",
        description: "Stock updated successfully",
      })

      fetchInventory()
    } catch (error) {
      console.error('Error updating stock:', error)
      toast({
        title: "Error",
        description: "Could not update stock. Please try again.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category_id: '',
      price: '',
      stock_quantity: '',
      image_url: null,
      is_active: true,
      reorder_point: '5'
    })
    setImageFile(null)
    setSelectedProduct(null)
  }

  const handleEditClick = (product: ProductWithRelations) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      category_id: product.category_id || '',
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      image_url: product.image_url,
      is_active: product.is_active === null ? true : product.is_active,
      reorder_point: (product.reorder_point || 5).toString()
    })
    setShowEditDialog(true)
  }

  const handleAddCategory = async () => {
    try {
      if (!newCategoryName.trim()) {
        toast({
          title: "Error",
          description: "Category name is required",
          variant: "destructive",
        })
        return
      }

      const { error } = await createCategory({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || null,
        is_active: true
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Category added successfully",
      })

      setShowAddCategoryDialog(false)
      setNewCategoryName('')
      setNewCategoryDescription('')
      fetchCategories()
    } catch (error) {
      console.error('Error adding category:', error)
      toast({
        title: "Error",
        description: "Could not add category. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter
    const matchesStock = stockFilter === 'all' || 
                        (stockFilter === 'low' && product.stock_quantity <= product.reorder_point) ||
                        (stockFilter === 'out' && product.stock_quantity === 0)
    
    return matchesSearch && matchesCategory && matchesStock
  })

  const getStockStatus = (quantity: number, reorderPoint: number = 5): StockStatus => {
    if (quantity === 0) return 'out_of_stock'
    if (quantity <= reorderPoint) return 'low_stock'
    return 'in_stock'
  }

  const getStockStatusDisplay = (status: StockStatus) => {
    switch (status) {
      case 'out_of_stock':
        return { color: 'bg-red-100 text-red-800', text: 'Out of Stock' }
      case 'low_stock':
        return { color: 'bg-yellow-100 text-yellow-800', text: 'Low Stock' }
      case 'in_stock':
        return { color: 'bg-green-100 text-green-800', text: 'In Stock' }
    }
  }

  const renderProductForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Product Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter product name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter product description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price (Kes) *</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock_quantity">Stock Quantity *</Label>
          <Input
            id="stock_quantity"
            type="number"
            value={formData.stock_quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
            placeholder="0"
            min="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reorder_point">Reorder Point *</Label>
        <div className="flex items-center gap-2">
          <Input
            id="reorder_point"
            type="number"
            value={formData.reorder_point}
            onChange={(e) => setFormData(prev => ({ ...prev, reorder_point: e.target.value }))}
            placeholder="5"
            min="0"
          />
          <div className="text-sm text-gray-500">
            Alert when stock falls below this number
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category_id">Category *</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={() => setShowAddCategoryDialog(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Product Image</Label>
        <div className="flex items-center gap-4">
          {(formData.image_url || imageFile) && (
            <div className="relative w-20 h-20">
              <img
                src={imageFile ? URL.createObjectURL(imageFile) : formData.image_url || ''}
                alt="Product preview"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          )}
          <Label
            htmlFor="image-upload"
            className="cursor-pointer flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <Input
              id="image-upload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setImageFile(file)
                }
              }}
            />
            <Upload className="h-4 w-4" />
            {imageFile ? 'Change Image' : 'Upload Image'}
          </Label>
        </div>
      </div>
    </div>
  )

  const renderServiceForm = () => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Service Name</Label>
        <Input
          id="name"
          value={serviceFormData.name}
          onChange={(e) => setServiceFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter service name"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={serviceFormData.description}
          onChange={(e) => setServiceFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter service description"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            value={serviceFormData.duration}
            onChange={(e) => setServiceFormData(prev => ({ ...prev, duration: e.target.value }))}
            placeholder="Enter duration"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={serviceFormData.price}
            onChange={(e) => setServiceFormData(prev => ({ ...prev, price: e.target.value }))}
            placeholder="Enter price"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          value={serviceFormData.category}
          onChange={(e) => setServiceFormData(prev => ({ ...prev, category: e.target.value }))}
          placeholder="Enter service category"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="service-image">Service Image</Label>
        <Input
          id="service-image"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              setServiceImageFile(file)
            }
          }}
        />
      </div>
    </div>
  )

  // Add service dialog
  const handleAddService = async () => {
    try {
      setSubmitting(true)

      // Validate form data
      const errors = []
      if (!serviceFormData.name.trim()) errors.push('Service name is required')
      if (!serviceFormData.duration || isNaN(parseInt(serviceFormData.duration))) errors.push('Valid duration is required')
      if (!serviceFormData.price || isNaN(parseFloat(serviceFormData.price))) errors.push('Valid price is required')
      if (!serviceFormData.category.trim()) errors.push('Category is required')

      if (errors.length > 0) {
        toast({
          title: "Validation Error",
          description: errors.join(', '),
          variant: "destructive",
        })
        return
      }

      let imageUrl = null
      if (serviceImageFile) {
        imageUrl = await handleImageUpload(serviceImageFile)
      }

      const { error } = await createClient()
        .from('services')
        .insert([{
          name: serviceFormData.name.trim(),
          description: serviceFormData.description?.trim() || null,
          duration: parseInt(serviceFormData.duration),
          price: parseFloat(serviceFormData.price),
          category: serviceFormData.category.trim(),
          image_url: imageUrl,
          is_active: true
        }])

      if (error) throw error

      toast({
        title: "Service added",
        description: "Service has been added successfully",
      })

      setShowAddServiceDialog(false)
      setServiceFormData({
        name: '',
        description: '',
        duration: '',
        price: '',
        category: '',
        image_url: null,
        is_active: true
      })
      setServiceImageFile(null)
      fetchServices()
    } catch (error) {
      console.error('Error adding service:', error)
      toast({
        title: "Error adding service",
        description: error instanceof Error ? error.message : "Could not add service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Add this with other functions
  const handleEditService = async () => {
    if (!selectedService) return;
    
    try {
      setSubmitting(true)

      // Validate form data
      const errors = []
      if (!serviceFormData.name.trim()) errors.push('Service name is required')
      if (!serviceFormData.duration || isNaN(parseInt(serviceFormData.duration))) errors.push('Valid duration is required')
      if (!serviceFormData.price || isNaN(parseFloat(serviceFormData.price))) errors.push('Valid price is required')
      if (!serviceFormData.category.trim()) errors.push('Category is required')

      if (errors.length > 0) {
        toast({
          title: "Validation Error",
          description: errors.join(', '),
          variant: "destructive",
        })
        return
      }

      let imageUrl = serviceFormData.image_url
      if (serviceImageFile) {
        const newImageUrl = await handleImageUpload(serviceImageFile)
        if (newImageUrl) imageUrl = newImageUrl
      }

      const { error } = await createClient()
        .from('services')
        .update({
          name: serviceFormData.name.trim(),
          description: serviceFormData.description?.trim() || null,
          duration: parseInt(serviceFormData.duration),
          price: parseFloat(serviceFormData.price),
          category: serviceFormData.category.trim(),
          image_url: imageUrl,
          is_active: serviceFormData.is_active
        })
        .eq('id', selectedService.id)

      if (error) throw error

      toast({
        title: "Service updated",
        description: "Service has been updated successfully",
      })

      setShowEditServiceDialog(false)
      setSelectedService(null)
      setServiceFormData({
        name: '',
        description: '',
        duration: '',
        price: '',
        category: '',
        image_url: null,
        is_active: true
      })
      setServiceImageFile(null)
      fetchServices()
    } catch (error) {
      console.error('Error updating service:', error)
      toast({
        title: "Error updating service",
        description: error instanceof Error ? error.message : "Could not update service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Add this before the return statement
  const renderServicesTable = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => (
            <TableRow key={service.id}>
              <TableCell className="font-medium">{service.name}</TableCell>
              <TableCell>{service.category}</TableCell>
              <TableCell>{service.duration} minutes</TableCell>
              <TableCell>Kes {service.price.toFixed(2)}</TableCell>
              <TableCell>
                <Badge
                  variant={service.is_active ? "default" : "secondary"}
                  className="capitalize"
                >
                  {service.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedService(service)
                    setServiceFormData({
                      name: service.name,
                      description: service.description || '',
                      duration: service.duration.toString(),
                      price: service.price.toString(),
                      category: service.category,
                      image_url: service.image_url,
                      is_active: service.is_active
                    })
                    setShowEditServiceDialog(true)
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setServiceToDelete(service.id)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  const handleDeleteService = async () => {
    if (!serviceToDelete) return

    try {
      const { error } = await createClient()
        .from('services')
        .update({ is_active: false })
        .eq('id', serviceToDelete)

      if (error) throw error

      toast({
        title: "Success",
        description: "Service deleted successfully",
      })

      setServiceToDelete(null)
      fetchServices()
    } catch (error) {
      console.error('Error deleting service:', error)
      toast({
        title: "Error",
        description: "Could not delete service. Please try again.",
        variant: "destructive",
      })
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
      <Toaster />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inventory Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your products and services</p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={() => setShowAddServiceDialog(true)}
            className="bg-[#4CAF50] hover:bg-[#4CAF50]/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
                        <Button
          variant={activeTab === 'products' ? "default" : "outline"}
          onClick={() => setActiveTab('products')}
          className={activeTab === 'products' ? "bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white" : ""}
        >
          <Package className="w-4 h-4 mr-2" />
          Products
                        </Button>
                        <Button
          variant={activeTab === 'services' ? "default" : "outline"}
          onClick={() => setActiveTab('services')}
          className={activeTab === 'services' ? "bg-[#4CAF50] hover:bg-[#4CAF50]/90 text-white" : ""}
        >
          <Clock className="w-4 h-4 mr-2" />
          Services
                        </Button>
                      </div>

      {/* Content */}
      {activeTab === 'products' ? (
        // Products content
        <div className="space-y-4">
          {/* Search and filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Products table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock_quantity, product.reorder_point)
                  const statusDisplay = getStockStatusDisplay(stockStatus)
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium">{product.name}</span>
                            {product.description && (
                              <span className="text-sm text-gray-500">
                                {product.description.length > 50
                                  ? product.description.substring(0, 50) + '...'
                                  : product.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.category?.name || 'Uncategorized'}</TableCell>
                      <TableCell>Kes {product.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{product.stock_quantity}</span>
                          <Badge className={statusDisplay.color}>
                            {statusDisplay.text}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={product.is_active ? "default" : "secondary"}
                          className="capitalize"
                        >
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(product)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setProductToDelete(product.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
            </div>
      ) : (
        // Services content
          <div className="space-y-4">
          {renderServicesTable()}
            </div>
      )}

      {/* Add Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Add a new product to your inventory. Fill in the product details below.
            </DialogDescription>
          </DialogHeader>
          {renderProductForm()}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false)
                resetForm()
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddProduct}
              disabled={submitting}
              className="bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white"
            >
              {submitting ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Adding...
                </>
              ) : (
                'Add Product'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information. Fill in the product details below.
            </DialogDescription>
          </DialogHeader>
          {renderProductForm()}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false)
                resetForm()
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditProduct}
              disabled={submitting}
              className="bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white"
            >
              {submitting ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Add a new product category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryDescription">Description</Label>
              <Textarea
                id="categoryDescription"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="Enter category description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddCategoryDialog(false)
                setNewCategoryName('')
                setNewCategoryDescription('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCategory}
              className="bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white"
            >
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog open={showAddServiceDialog} onOpenChange={setShowAddServiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
            <DialogDescription>
              Add a new service to your catalog. Fill in the service details below.
            </DialogDescription>
          </DialogHeader>
          {renderServiceForm()}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddServiceDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddService}
              disabled={submitting}
              className="bg-[#4CAF50] hover:bg-[#4CAF50]/90 text-white"
            >
              {submitting ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Adding...
                </>
              ) : (
                'Add Service'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={showEditServiceDialog} onOpenChange={setShowEditServiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update service information. Fill in the service details below.
            </DialogDescription>
          </DialogHeader>
          {renderServiceForm()}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditServiceDialog(false)
                setSelectedService(null)
                setServiceFormData({
                  name: '',
                  description: '',
                  duration: '',
                  price: '',
                  category: '',
                  image_url: null,
                  is_active: true
                })
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditService}
              disabled={submitting}
              className="bg-[#4CAF50] hover:bg-[#4CAF50]/90 text-white"
            >
              {submitting ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Service Confirmation Dialog */}
      <AlertDialog open={!!serviceToDelete} onOpenChange={() => setServiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the service as inactive. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteService}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Product Confirmation Dialog */}
      <AlertDialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the product as inactive. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteProduct}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 
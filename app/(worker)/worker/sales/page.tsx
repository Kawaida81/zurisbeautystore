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
import { Package, Search, Plus, X } from 'lucide-react'
import { format } from 'date-fns'
import { 
  Sale, 
  SaleItem, 
  Product, 
  Service, 
  PaymentMethod, 
  PaymentStatus, 
  SaleType,
  CreateSaleInput,
  SaleFilters
} from '@/lib/types/sales'
import { getSales, createSale } from '@/lib/queries/sales'

// Component state interface
interface SaleState {
  loading: boolean
  products: Product[]
  services: Service[]
  selectedItems: Array<{id: string, quantity: number}>
  selectedServices: Array<{id: string, price: number}>
  saleType: SaleType
  paymentMethod: PaymentMethod
  showNewSaleDialog: boolean
}

export default function WorkerSales() {
  const { toast } = useToast()
  const [state, setState] = useState<SaleState>({
    loading: false,
    products: [],
    services: [],
    selectedItems: [],
    selectedServices: [],
    saleType: 'product',
    paymentMethod: 'cash',
    showNewSaleDialog: false
  })
  
  const [sales, setSales] = useState<Sale[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const ITEMS_PER_PAGE = 10

  const {
    loading,
    products,
    services,
    selectedItems,
    selectedServices,
    saleType,
    paymentMethod,
    showNewSaleDialog
  } = state

  const updateState = (updates: Partial<SaleState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  useEffect(() => {
    void fetchSales()
    void fetchProducts()
    void fetchServices()
  }, [])

  useEffect(() => {
    void fetchSales()
  }, [searchQuery, currentPage])

  const fetchSales = async () => {
    try {
      updateState({ loading: true })
      
      // Prepare filters
      const filters: SaleFilters = {}

      // Get current user
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Error getting user:', userError);
        throw new Error('Authentication error: ' + userError.message);
      }

      if (!user) {
        throw new Error('No authenticated user found')
      }

      console.log('Fetching sales for worker:', user.id);
      filters.worker_id = user.id

      // Add search query to filters if present
      if (searchQuery.trim()) {
        filters.search_query = searchQuery.trim()
      }

      // Use the getSales query function with pagination
      const { data, error, count } = await getSales(
        filters,
        { page: currentPage, limit: ITEMS_PER_PAGE }
      )
      
      if (error) {
        console.error('Error from getSales:', error);
        throw error;
      }
      
      if (data) {
        console.log(`Received ${data.length} sales records`);
        setSales(data)
        setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE))
      } else {
        console.warn('No sales data received');
        setSales([])
        setTotalPages(0)
      }
    } catch (error) {
      console.error('Error fetching sales:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not fetch sales data",
        variant: "destructive",
      })
      setSales([])
      setTotalPages(0)
    } finally {
      updateState({ loading: false })
    }
  }

  const fetchProducts = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:product_categories (
            id,
            name
          )
        `)
        .eq('is_active', true);

      if (error) throw error;

      if (data) {
        // First cast to unknown since the Supabase types don't match our Product type exactly
        const typedData = data as unknown as Array<{
          id: string;
          name: string;
          description: string;
          price: number;
          stock_quantity: number;
          category_id: string;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          category: { id: string; name: string; } | null;
        }>;

        // Then map to our Product type
        const products: Product[] = typedData.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          stock_quantity: item.stock_quantity,
          category_id: item.category_id,
          image_url: item.image_url,
          is_active: item.is_active,
          created_at: item.created_at,
          updated_at: item.updated_at,
          category: item.category
        }));

        updateState({ products });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch products",
        variant: "destructive",
      });
    }
  };

  const fetchServices = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error

      if (data) {
        const services = data.map(service => ({
          id: service.id,
          name: service.name,
          description: service.description,
          duration: service.duration,
          price: service.price,
          category: service.category,
          image_url: service.image_url,
          is_active: service.is_active,
          created_at: service.created_at,
          updated_at: service.updated_at
        })) as Service[]
        
        updateState({ services })
      }
    } catch (error) {
      console.error('Error fetching services:', error)
      toast({
        title: "Error",
        description: "Failed to fetch services",
        variant: "destructive",
      })
    }
  }

  const renderSaleItems = (sale: Sale) => {
    return (
      <div className="space-y-1">
        {/* Render services */}
        {sale.services?.map((service, index) => {
          const serviceData = services.find(s => s.id === service.service_id);
          if (!serviceData) return null;
          return (
            <div key={`service-${index}`} className="text-sm">
              {serviceData.name} - Kes {service.price}
            </div>
          );
        })}
        
        {/* Render products */}
        {sale.items?.map((item) => {
          if (!item.product) return null;
          return (
            <div key={item.id} className="text-sm">
              {item.product.name} x {item.quantity}
            </div>
          );
        })}
      </div>
    );
  };

  const formatSaleDate = (date: string | null) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM d, yyyy h:mm a');
  };

  const calculateTotalAmount = (): number => {
    if (saleType === 'service') {
      return selectedServices.reduce((total, service) => {
        const serviceData = services.find(s => s.id === service.id);
        return total + (serviceData?.price || 0);
      }, 0);
    }

    return selectedItems.reduce((total, item) => {
      const product = products.find(p => p.id === item.id);
      if (!product) return total;
      return total + (product.price * item.quantity);
    }, 0);
  };

  const handleAddService = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    setState(prev => ({
      ...prev,
      selectedServices: [...prev.selectedServices, { id: serviceId, price: service.price }]
    }));
  };

  const removeService = (serviceId: string) => {
    setState(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.filter(s => s.id !== serviceId)
    }));
  };

  const handleAddSale = async () => {
    try {
      updateState({ loading: true });

      const saleInput: CreateSaleInput = {
        sale_type: saleType,
        payment_method: paymentMethod
      };

      if (saleType === 'service' && selectedServices.length > 0) {
        saleInput.services = selectedServices.map(service => ({
          service_id: service.id,
          price: service.price
        }));
      } else if (saleType === 'product' && selectedItems.length > 0) {
        saleInput.items = selectedItems.map(item => {
          const product = products.find(p => p.id === item.id);
          if (!product) throw new Error(`Product not found: ${item.id}`);
          
          return {
            product_id: item.id,
            quantity: item.quantity,
            unit_price: product.price
          };
        });
      } else {
        throw new Error('Invalid sale: No items or services selected');
      }

      const { data, error } = await createSale(saleInput);

      if (error) throw error;

      if (data) {
        toast({
          title: "Success",
          description: "Sale created successfully",
        });
        
        updateState({ 
          showNewSaleDialog: false,
          selectedItems: [],
          selectedServices: []
        });
        
        void fetchSales();
      }
    } catch (error) {
      console.error('Error creating sale:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create sale",
        variant: "destructive",
      });
    } finally {
      updateState({ loading: false });
    }
  };

  const resetSaleForm = () => {
    updateState({
      selectedItems: [],
      selectedServices: [],
      saleType: 'product',
      paymentMethod: 'cash'
    });
  };

  const updateSelectedItems = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    setState((prevState: SaleState) => ({
      ...prevState,
      selectedItems: prevState.selectedItems.find((item: { id: string }) => item.id === productId)
        ? prevState.selectedItems.map((item: { id: string, quantity: number }) =>
            item.id === productId ? { ...item, quantity } : item
          )
        : [...prevState.selectedItems, { id: productId, quantity }]
    }))
  }

  const removeItem = (productId: string) => {
    setState((prevState: SaleState) => ({
      ...prevState,
      selectedItems: prevState.selectedItems.filter((item: { id: string }) => item.id !== productId)
    }))
  }

  const handleSaleTypeChange = (value: 'product' | 'service') => {
    updateState({
      saleType: value,
      selectedItems: [],
      selectedServices: []
    })
  }

  const calculateStats = () => {
    const todaySales = sales.filter(sale => {
      if (!sale.created_at) return false
      const saleDate = new Date(sale.created_at)
      const today = new Date()
      return saleDate.toDateString() === today.toDateString()
    })

    const totalSales = todaySales.reduce((sum, sale) => sum + sale.total_amount, 0)
    const productSales = todaySales.filter(sale => sale.sale_type === 'product').length
    const serviceSales = todaySales.filter(sale => sale.sale_type === 'service').length

    return {
      totalAmount: totalSales.toFixed(2),
      productCount: productSales,
      serviceCount: serviceSales
    }
  }

  const stats = calculateStats()

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B6B]"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-6 max-w-7xl">
      <Toaster />
      
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-sm text-gray-600 mt-1">Record and manage sales</p>
        </div>
        <Button 
          className="bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 h-10"
          onClick={() => updateState({ showNewSaleDialog: true })}
        >
          <Plus className="h-5 w-5 mr-2" />
          New Sale
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Sales</p>
              <h3 className="text-2xl font-bold mt-2">Kes {stats.totalAmount}</h3>
            </div>
            <div className="bg-[#FF6B6B]/10 p-3 rounded-lg">
              <Package className="h-8 w-8 text-[#FF6B6B]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Product Sales</p>
              <h3 className="text-2xl font-bold mt-2">{stats.productCount}</h3>
            </div>
            <div className="bg-[#FF6B6B]/10 p-3 rounded-lg">
              <Package className="h-8 w-8 text-[#FF6B6B]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Service Sales</p>
              <h3 className="text-2xl font-bold mt-2">{stats.serviceCount}</h3>
            </div>
            <div className="bg-[#FF6B6B]/10 p-3 rounded-lg">
              <Package className="h-8 w-8 text-[#FF6B6B]" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by service, product, or client name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1) // Reset to first page when search changes
            }}
            className="pl-9 h-10"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="py-3">Date</TableHead>
                <TableHead className="py-3">Type</TableHead>
                <TableHead className="py-3">Items/Service</TableHead>
                <TableHead className="py-3">Payment Method</TableHead>
                <TableHead className="py-3">Amount</TableHead>
                <TableHead className="py-3">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <p className="text-gray-500">No sales records found</p>
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-gray-50">
                    <TableCell>
                      {formatSaleDate(sale.created_at)}
                    </TableCell>
                    <TableCell>
                      {sale.sale_type === 'service' ? 'Service' : 'Product'}
                    </TableCell>
                    <TableCell>
                      {renderSaleItems(sale)}
                    </TableCell>
                    <TableCell className="capitalize">
                      {sale.payment_method}
                    </TableCell>
                    <TableCell>
                      Kes {sale.total_amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        sale.payment_status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : sale.payment_status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {sale.payment_status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentPage(prev => Math.max(1, prev - 1))
                void fetchSales()
              }}
              disabled={currentPage === 1 || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentPage(prev => Math.min(totalPages, prev + 1))
                void fetchSales()
              }}
              disabled={currentPage === totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* New Sale Dialog */}
      <Dialog open={showNewSaleDialog} onOpenChange={() => updateState({ showNewSaleDialog: false })}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>New Sale</DialogTitle>
            <DialogDescription>
              Record a new product sale or service payment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Sale Type</Label>
              <Select value={saleType} onValueChange={(value: 'product' | 'service') => {
                handleSaleTypeChange(value)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sale type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Product Sale</SelectItem>
                  <SelectItem value="service">Service Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {saleType === 'product' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Products</Label>
                  <Select onValueChange={(productId) => updateSelectedItems(productId, 1)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - Kes {product.price} ({product.stock_quantity} in stock)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedItems.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Items</Label>
                    <div className="space-y-2">
                      {selectedItems.map((item) => {
                        const product = products.find(p => p.id === item.id)
                        if (!product) return null
                        return (
                          <div key={item.id} className="flex items-center gap-4 p-2 border rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-gray-500">Kes {product.price} each</p>
                            </div>
                            <Input
                              type="number"
                              value={item.quantity || ''}
                              onChange={(e) => {
                                const val = e.target.value
                                const num = parseInt(val)
                                if (!isNaN(num) && num > 0) {
                                  updateSelectedItems(item.id, num)
                                }
                              }}
                              className="w-20"
                              min="1"
                              max={product.stock_quantity}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Services</Label>
                  <Select onValueChange={handleAddService}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services
                        .filter(service => !selectedServices.some(s => s.id === service.id))
                        .map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} - Kes {service.price}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedServices.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Services</Label>
                    <div className="space-y-2">
                      {selectedServices.map((service) => {
                        const serviceData = services.find(s => s.id === service.id);
                        if (!serviceData) return null;
                        return (
                          <div key={service.id} className="flex items-center justify-between p-2 border rounded">
                            <span>{serviceData.name} - Kes {serviceData.price}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeService(service.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(value) => {
                updateState({ paymentMethod: value as 'cash' | 'card' | 'transfer' })
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold">
                  Kes {(calculateTotalAmount() || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              updateState({ showNewSaleDialog: false })
              resetSaleForm()
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddSale}
              className="bg-[#FF6B6B] hover:bg-[#FF6B6B]/90"
            >
              Complete Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
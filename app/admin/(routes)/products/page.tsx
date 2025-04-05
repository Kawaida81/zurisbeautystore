'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/admin/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui/card'
import { Button } from '@/app/admin/components/ui/button'
import { PlusIcon } from 'lucide-react'
import { LoadingSpinner } from '@/app/admin/components/loading-spinner'
import { toast } from 'react-hot-toast'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Product {
  id: string
  name: string
  description: string
  price: number
  stock_quantity: number
  created_at: string
  category: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setProducts(data || [])
      } catch (error) {
        console.error('Error fetching products:', error)
        toast.error('Failed to load products. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <LoadingSpinner size={40} />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Products</h2>
        <Button className="w-full sm:w-auto">
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Product Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="hidden sm:table-cell">Stock</TableHead>
                    <TableHead className="hidden sm:table-cell">Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground hidden sm:block">
                          {product.description}
                        </p>
                        <div className="sm:hidden text-sm text-muted-foreground">
                          <p>Stock: {product.stock_quantity}</p>
                          <p className="capitalize">{product.category}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell capitalize">{product.category}</TableCell>
                    <TableCell>KSh {product.price.toLocaleString()}</TableCell>
                    <TableCell className="hidden sm:table-cell">{product.stock_quantity}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {new Date(product.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
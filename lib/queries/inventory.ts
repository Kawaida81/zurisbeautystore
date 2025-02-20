import { createClient } from '@/lib/supabase/client'
import type {
  Product,
  ProductWithRelations,
  ProductResponse,
  ProductsListResponse,
  CreateProductInput,
  UpdateProductInput,
  ProductFilters,
  PaginationParams,
  PaginatedProductsResponse,
  CategoryResponse,
  CategoriesListResponse,
  CreateCategoryInput,
  UpdateCategoryInput,
  StockUpdate
} from '@/lib/types/inventory'
import { Database } from '@/lib/types/database'

type Tables = Database['public']['Tables']
type Products = Tables['products']['Row']
type Categories = Tables['product_categories']['Row']

export const runtime = "edge"

// Get a single product by ID
export async function getProductById(productId: string): Promise<ProductResponse> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:product_categories(*)
      `)
      .eq('id', productId)
      .single()

    if (error) throw error

    return {
      data: data as unknown as ProductWithRelations,
      error: null
    }
  } catch (error) {
    console.error('Error fetching product:', error)
    return { data: null, error: error as Error }
  }
}

// Get products list with filters and pagination
export async function getProducts(
  filters: ProductFilters = {},
  pagination: PaginationParams = { page: 1, limit: 10 }
): Promise<PaginatedProductsResponse> {
  try {
    const supabase = createClient()
    const { page, limit } = pagination
    const offset = (page - 1) * limit

    let query = supabase
      .from('products')
      .select(`
        *,
        category:product_categories(*)`
      , { count: 'exact' })

    // Apply filters
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id)
    }
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }
    if (filters.min_stock !== undefined) {
      query = query.gte('stock_quantity', filters.min_stock)
    }
    if (filters.max_stock !== undefined) {
      query = query.lte('stock_quantity', filters.max_stock)
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    // Apply pagination
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      data: (data || []) as unknown as ProductWithRelations[],
      count: count || 0,
      error: null
    }
  } catch (error) {
    console.error('Error fetching products:', error)
    return {
      data: [],
      count: 0,
      error: error as Error
    }
  }
}

// Create a new product
export async function createProduct(input: CreateProductInput): Promise<ProductResponse> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('products')
      .insert([input as unknown as Record<string, unknown>])
      .select(`
        *,
        category:product_categories(*)
      `)
      .single()

    if (error) throw error

    return {
      data: data as unknown as ProductWithRelations,
      error: null
    }
  } catch (error) {
    console.error('Error creating product:', error)
    return { data: null, error: error as Error }
  }
}

// Update a product
export async function updateProduct(
  productId: string,
  input: UpdateProductInput
): Promise<ProductResponse> {
  try {
    const supabase = createClient()

    // Validate input
    if (!productId) {
      throw new Error('Product ID is required')
    }

    // First check if product exists
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('id, stock_quantity, reorder_point')
      .eq('id', productId)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking product existence:', checkError)
      throw new Error(`Product check failed: ${checkError.message}`)
    }

    if (!existingProduct) {
      throw new Error(`Product with ID ${productId} not found`)
    }

    // Convert input to Record<string, unknown>
    const updateData: Record<string, unknown> = {
      name: input.name,
      description: input.description,
      category_id: input.category_id,
      price: input.price,
      stock_quantity: input.stock_quantity,
      reorder_point: input.reorder_point,
      is_active: input.is_active,
      image_url: input.image_url,
      updated_at: new Date().toISOString()
    }

    // Perform the update
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select(`
        *,
        category:product_categories(*)
      `)
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      throw new Error(`Failed to update product: ${error.message}`)
    }

    if (!data) {
      throw new Error('No data returned after update')
    }

    // Check if we need to update alerts
    if (existingProduct.stock_quantity !== input.stock_quantity || 
        existingProduct.reorder_point !== input.reorder_point) {
      // The trigger will handle alert creation/updates
      console.log('Stock or reorder point changed, alerts will be updated automatically')
    }

    return {
      data: data as unknown as ProductWithRelations,
      error: null
    }
  } catch (error) {
    // Improved error logging
    console.error('Error updating product:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return { 
      data: null, 
      error: error instanceof Error 
        ? error 
        : new Error('An unexpected error occurred while updating the product')
    }
  }
}

// Update product stock
export async function updateStock(update: StockUpdate): Promise<ProductResponse> {
  try {
    const supabase = createClient()
    const { product_id, quantity, type } = update

    // Get current stock
    const { data: currentProduct, error: fetchError } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', product_id)
      .single()

    if (fetchError) throw fetchError
    if (!currentProduct) throw new Error('Product not found')

    const currentStock = (currentProduct as Products).stock_quantity
    let newQuantity: number
    switch (type) {
      case 'increment':
        newQuantity = currentStock + quantity
        break
      case 'decrement':
        newQuantity = Math.max(0, currentStock - quantity)
        break
      case 'set':
        newQuantity = Math.max(0, quantity)
        break
      default:
        throw new Error('Invalid update type')
    }

    // Update stock
    const { data, error } = await supabase
      .from('products')
      .update({ stock_quantity: newQuantity })
      .eq('id', product_id)
      .select(`
        *,
        category:product_categories(*)
      `)
      .single()

    if (error) throw error

    return {
      data: data as unknown as ProductWithRelations,
      error: null
    }
  } catch (error) {
    console.error('Error updating stock:', error)
    return { data: null, error: error as Error }
  }
}

// Get all categories
export async function getCategories(): Promise<CategoriesListResponse> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .order('name')

    if (error) throw error

    return {
      data: data as Categories[],
      error: null
    }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return { data: [], error: error as Error }
  }
}

// Create a new category
export async function createCategory(input: CreateCategoryInput): Promise<CategoryResponse> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('product_categories')
      .insert([input as unknown as Record<string, unknown>])
      .select()
      .single()

    if (error) throw error

    return {
      data: data as Categories,
      error: null
    }
  } catch (error) {
    console.error('Error creating category:', error)
    return { data: null, error: error as Error }
  }
}

// Update a category
export async function updateCategory(
  categoryId: string,
  input: UpdateCategoryInput
): Promise<CategoryResponse> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('product_categories')
      .update(input as unknown as Record<string, unknown>)
      .eq('id', categoryId)
      .select()
      .single()

    if (error) throw error

    return {
      data: data as Categories,
      error: null
    }
  } catch (error) {
    console.error('Error updating category:', error)
    return { data: null, error: error as Error }
  }
} 
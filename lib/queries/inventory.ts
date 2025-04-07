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
  StockUpdate,
  InventoryResponse,
  InventoryItem,
  StockHistoryResponse,
  StockAdjustment,
  LowStockAlertsResponse,
  LowStockAlert,
  ProductCategory
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
    if (filters.status) {
      query = query.eq('status', filters.status)
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

// Get inventory items with status and filters
export async function getInventoryItems(
  filters: ProductFilters = {},
  pagination: PaginationParams = { page: 1, limit: 10 }
): Promise<InventoryResponse> {
  try {
    const supabase = createClient();
    const { data, error, count } = await supabase
      .rpc('get_inventory_items', {
        p_category_id: filters.category_id,
        p_status: filters.status,
        p_search: filters.search,
        p_page: pagination.page,
        p_limit: pagination.limit
      });

    if (error) throw error;

    return {
      data: data || [],
      count: count || 0,
      pageCount: Math.ceil((count || 0) / pagination.limit),
      error: null
    };
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    return {
      data: [],
      count: 0,
      pageCount: 0,
      error: error as Error
    };
  }
}

export async function updateStockQuantity(
  productId: string,
  adjustment: number,
  note: string
): Promise<void> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .rpc('update_stock_quantity', {
        p_product_id: productId,
        p_adjustment: adjustment,
        p_note: note
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error updating stock quantity:', error);
    throw error;
  }
}

export async function getStockHistory(
  productId: string,
  page: number = 1,
  limit: number = 10
): Promise<StockHistoryResponse> {
  try {
    const supabase = createClient();
    const { data, error, count } = await supabase
      .rpc('get_stock_history', {
        p_product_id: productId,
        p_page: page,
        p_limit: limit
      });

    if (error) throw error;

    return {
      data: data || [],
      count: count || 0,
      error: null
    };
  } catch (error) {
    console.error('Error fetching stock history:', error);
    return {
      data: [],
      count: 0,
      error: error as Error
    };
  }
}

export async function getLowStockAlerts(): Promise<LowStockAlert[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .rpc('get_low_stock_alerts');

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    throw error;
  }
}

export async function getCategories(): Promise<ProductCategory[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    return data.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      is_active: category.is_active,
      created_at: category.created_at || new Date().toISOString(),
      updated_at: category.updated_at || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
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

    const category: Categories = data as Categories;
    return {
      data: {
        id: category.id,
        name: category.name,
        description: category.description || '',
        is_active: category.is_active,
        created_at: category.created_at || new Date().toISOString(),
        updated_at: category.updated_at || new Date().toISOString()
      },
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

    const category: Categories = data as Categories;
    return {
      data: {
        id: category.id,
        name: category.name,
        description: category.description || '',
        is_active: category.is_active,
        created_at: category.created_at || new Date().toISOString(),
        updated_at: category.updated_at || new Date().toISOString()
      },
      error: null
    }
  } catch (error) {
    console.error('Error updating category:', error)
    return { data: null, error: error as Error }
  }
} 
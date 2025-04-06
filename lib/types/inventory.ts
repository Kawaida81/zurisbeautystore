import { Database } from './database'

// Base Types
export type Product = Database['public']['Tables']['products']['Row']
export type ProductCategory = Database['public']['Tables']['product_categories']['Row']

// Extended Types with Relations
export interface ProductWithRelations extends Product {
  category: ProductCategory | null
}

// Input Types
export interface CreateProductInput {
  name: string
  description?: string | null
  price: number
  stock_quantity: number
  category_id?: string | null
  image_url?: string | null
  is_active?: boolean
  reorder_point?: number
}

export interface UpdateProductInput {
  name?: string
  description?: string | null
  price?: number
  stock_quantity?: number
  category_id?: string | null
  image_url?: string | null
  is_active?: boolean
  reorder_point?: number
}

// Response Types
export interface ProductResponse {
  data: ProductWithRelations | null
  error: Error | null
}

export interface ProductsListResponse {
  data: ProductWithRelations[]
  error: Error | null
}

// Filter and Pagination
export interface ProductFilters {
  category_id?: string;
  status?: StockStatus;
  page?: number;
  pageSize?: number;
  search?: string;
  min_stock?: number;
  max_stock?: number;
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedProductsResponse extends ProductsListResponse {
  count: number
}

// Category Types
export interface CreateCategoryInput {
  name: string
  description?: string | null
  is_active?: boolean
}

export interface UpdateCategoryInput {
  name?: string
  description?: string | null
  is_active?: boolean
}

export interface CategoryResponse {
  data: ProductCategory | null
  error: Error | null
}

export interface CategoriesListResponse {
  data: ProductCategory[]
  error: Error | null
}

// Stock Status
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

export interface StockUpdate {
  product_id: string
  quantity: number
  type: 'add' | 'remove' | 'set'
  notes?: string
}

export interface StockAdjustment {
  id: string
  product_id: string
  product_name: string
  previous_quantity: number
  adjustment_quantity: number
  new_quantity: number
  adjustment_type: 'add' | 'remove' | 'set'
  notes?: string
  created_at: string
}

export interface StockHistoryResponse {
  data: StockAdjustment[]
  count: number
  error: Error | null
}

export interface InventoryItem extends Product {
  category_name: string
  status: StockStatus
}

export interface InventoryResponse {
  data: {
    items: InventoryItem[];
    count: number;
    pageCount: number;
  };
  error: Error | null
}

export interface LowStockAlert {
  id: string
  name: string
  category_id: string
  category_name: string
  stock_quantity: number
  reorder_point: number
  status: StockStatus
}

export interface LowStockAlertsResponse {
  data: LowStockAlert[]
  error: Error | null
} 
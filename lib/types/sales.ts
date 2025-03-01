// Payment method types
export type PaymentMethod = 'cash' | 'card' | 'transfer';

// Payment status types
export type PaymentStatus = 'pending' | 'completed' | 'failed';

// Sale type
export type SaleType = 'product' | 'service' | 'combined';

// Base interfaces
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  category_id: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
  } | null;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  category: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Sale item interface
export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
  product?: Product;
}

// Main sale interface
export interface Sale {
  id: string;
  client_id: string | null;
  worker_id: string;
  services: {
    service_id: string;
    price: number;
  }[];
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  sale_type: SaleType;
  created_at: string;
  updated_at: string;
  // Related data
  client?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  worker?: {
    id: string;
    full_name: string;
    email: string;
  };
  services_data?: Service[];
  items?: SaleItem[];
}

// Input types for creating/updating sales
export interface CreateSaleInput {
  client_id?: string;
  services?: Array<{
    service_id: string;
    price: number;
  }>;
  payment_method: PaymentMethod;
  sale_type: SaleType;
  items?: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
  }>;
}

export interface UpdateSaleInput {
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod;
}

// Response types
export interface SaleResponse {
  data: Sale | null;
  error: Error | null;
}

export interface SalesListResponse {
  data: Sale[];
  error: Error | null;
}

// Statistics types
export interface SaleStats {
  total_sales: number;
  total_revenue: number;
  product_sales_count: number;
  service_sales_count: number;
  average_sale_value: number;
}

// Filter types
export interface SaleFilters {
  worker_id?: string;
  client_id?: string;
  sale_type?: SaleType;
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod;
  search_query?: string;
  start_date?: string;
  end_date?: string;
}

// Pagination types
export interface PaginatedSalesResponse {
  data: Sale[];
  count: number;
  error: Error | null;
}

export interface PaginationParams {
  page: number;
  limit: number;
} 
import { createClient } from '@/lib/supabase/client';
import type {
  Sale,
  SaleResponse,
  SalesListResponse,
  CreateSaleInput,
  UpdateSaleInput,
  SaleFilters,
  PaginatedSalesResponse,
  PaginationParams,
  SaleStats
} from '@/lib/types/sales';
import { Database, DbResultWithRelations } from '@/lib/types/database';

type SaleWithRelations = DbResultWithRelations<'sales'>;

interface StockUpdateResponse {
  success: boolean;
  message: string;
  new_stock_quantity?: number;
  details?: string;
}

interface SearchSalesResult {
  sale_data: Sale;
  total_count: number;
}

export const runtime = "edge";

// Fetch a single sale by ID
export async function getSaleById(saleId: string): Promise<SaleResponse> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        client:client_id(id, full_name, email),
        worker:worker_id(id, full_name, email),
        items:sale_items(
          *,
          product:product_id(
            *,
            category:product_categories(id, name)
          )
        )
      `)
      .eq('id', saleId)
      .single();

    if (error) throw error;

    // Get service details for the services in the sale
    if (data && data.services && Array.isArray(data.services)) {
      const serviceIds = data.services.map((s: { service_id: string }) => s.service_id);
      if (serviceIds.length > 0) {
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .in('id', serviceIds);

        if (!servicesError && servicesData) {
          data.services_data = servicesData;
        }
      }
    }

    return { 
      data: data as unknown as Sale, 
      error: null 
    };
  } catch (error) {
    console.error('Error fetching sale:', error);
    return { data: null, error: error as Error };
  }
}

// Fetch sales list with filters and pagination
export async function getSales(
  filters: SaleFilters = {},
  pagination: PaginationParams = { page: 1, limit: 10 }
): Promise<PaginatedSalesResponse> {
  try {
    const supabase = createClient();
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    console.log('Fetching sales with filters:', JSON.stringify(filters));
    console.log('Pagination:', JSON.stringify(pagination));

    const { data, error } = await supabase
      .rpc('search_sales', {
        search_term: filters.search_query || null,
        p_worker_id: filters.worker_id || null,
        p_sale_type: filters.sale_type || null,
        p_payment_status: filters.payment_status || null,
        p_payment_method: filters.payment_method || null,
        p_client_id: filters.client_id || null,
        p_limit: limit,
        p_offset: offset
      }) as { data: SearchSalesResult[] | null; error: Error | null };

    if (error) {
      console.error('Error from search_sales RPC:', error);
      throw error;
    }

    console.log('Received sales data:', data ? `${data.length} records` : 'no data');

    if (!data || !Array.isArray(data)) {
      console.warn('No data returned from search_sales or invalid data format');
      return {
        data: [],
        count: 0,
        error: null
      };
    }

    const sales = data.map(row => {
      if (!row || typeof row !== 'object' || !('sale_data' in row)) {
        console.warn('Invalid row format:', row);
        return null;
      }
      return row.sale_data;
    }).filter((sale): sale is Sale => sale !== null);

    return {
      data: sales,
      count: data[0]?.total_count || 0,
      error: null
    };
  } catch (error) {
    console.error('Error in getSales:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    return {
      data: [],
      count: 0,
      error: error as Error
    };
  }
}

// Create a new sale
export async function createSale(input: CreateSaleInput): Promise<SaleResponse> {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('Auth error:', authError);
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Verify user is a worker
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error('User verification error:', userError);
      throw new Error('Failed to verify user role');
    }

    if (userData.role !== 'worker' || !userData.is_active) {
      throw new Error('Unauthorized: Only active workers can create sales');
    }

    // Calculate initial amount from services
    let totalAmount = 0;
    if (input.sale_type === 'service' && input.services && input.services.length > 0) {
      totalAmount = input.services.reduce((total, service) => total + service.price, 0);
    }

    // Begin transaction using RPC
    const { data: saleResult, error: saleError } = await supabase
      .rpc('process_sale', {
        p_client_id: input.client_id || null,
        p_worker_id: user.id,
        p_services: input.services || [],
        p_items: input.items || [],
        p_payment_method: input.payment_method,
        p_payment_status: 'completed'
      });

    if (saleError || !saleResult || !saleResult.success) {
      console.error('Sale creation error:', saleError || saleResult?.message);
      throw new Error(saleError?.message || saleResult?.message || 'Failed to create sale');
    }

    // Fetch and return the created sale
    return await getSaleById(saleResult.sale_id);
  } catch (error) {
    console.error('Error creating sale:', error);
    return {
      data: null,
      error: error as Error
    };
  }
}

// Update a sale
export async function updateSale(
  saleId: string, 
  input: UpdateSaleInput
): Promise<SaleResponse> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('sales')
      .update(input as unknown as Record<string, unknown>)
      .eq('id', saleId)
      .select()
      .single();

    if (error) throw error;

    return await getSaleById(saleId);
  } catch (error) {
    console.error('Error updating sale:', error);
    return { data: null, error: error as Error };
  }
}

// Get sales statistics
export async function getSalesStats(
  workerId?: string,
  startDate?: string,
  endDate?: string
): Promise<{ data: SaleStats | null; error: Error | null }> {
  try {
    const supabase = createClient();
    let query = supabase.from('sales').select('*');

    if (workerId) {
      query = query.eq('worker_id', workerId);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const sales = data as Database['public']['Tables']['sales']['Row'][];
    const stats: SaleStats = {
      total_sales: sales.length,
      total_revenue: sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0),
      product_sales_count: sales.filter(sale => sale.sale_type === 'product').length,
      service_sales_count: sales.filter(sale => sale.sale_type === 'service').length,
      average_sale_value: sales.length > 0 
        ? sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) / sales.length 
        : 0
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error fetching sales stats:', error);
    return { data: null, error: error as Error };
  }
} 
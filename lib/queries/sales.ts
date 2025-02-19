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
      const serviceIds = data.services.map(s => s.service_id);
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

    let initialAmount = 0;

    // If it's a service sale, calculate total from all services
    if (input.sale_type === 'service' && input.services && input.services.length > 0) {
      initialAmount = input.services.reduce((total, service) => total + service.price, 0);
    }

    // Create the sale record
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        client_id: input.client_id || null,
        services: input.services || [],
        payment_method: input.payment_method,
        sale_type: input.sale_type,
        payment_status: 'completed',
        worker_id: user.id,
        total_amount: initialAmount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single() as { 
        data: { id: string } | null; 
        error: Error | null 
      };

    if (saleError) {
      console.error('Sale creation error:', saleError);
      throw new Error(`Failed to create sale: ${saleError.message}`);
    }

    if (!sale || !sale.id) {
      throw new Error('No sale data returned after creation');
    }

    const saleId: string = sale.id;
    let totalAmount = initialAmount;

    // If there are items, create sale items and update stock
    if (input.items && input.items.length > 0) {
      for (const item of input.items) {
        // Create sale item
        const { error: itemError } = await supabase
          .from('sale_items')
          .insert({
            sale_id: sale.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.quantity * item.unit_price,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (itemError) {
          // If there's an error, delete the sale and throw
          await supabase.from('sales').delete().eq('id', sale.id);
          throw new Error(`Failed to create sale item: ${itemError.message}`);
        }

        totalAmount += item.quantity * item.unit_price;

        // Update product stock
        const { data: stockResult, error: stockError } = await supabase
          .rpc('decrement_product_stock', {
            p_product_id: item.product_id,
            p_quantity: item.quantity
          }) as { data: StockUpdateResponse | null, error: Error | null };

        if (stockError || (stockResult && !stockResult.success)) {
          // If there's an error, delete the sale and throw
          await supabase.from('sales').delete().eq('id', sale.id);
          throw new Error(stockError?.message || stockResult?.message || 'Failed to update product stock');
        }
      }

      // Only update the total amount if it changed from products
      if (totalAmount !== initialAmount) {
        const { error: updateError } = await supabase
          .from('sales')
          .update({ total_amount: totalAmount })
          .eq('id', sale.id);

        if (updateError) {
          // If there's an error, delete the sale and throw
          await supabase.from('sales').delete().eq('id', sale.id);
          throw new Error(`Failed to update sale total: ${updateError.message}`);
        }
      }
    }

    // Fetch the complete sale data
    return await getSaleById(saleId);
  } catch (error: unknown) {
    console.error('Error creating sale:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('An unexpected error occurred while creating the sale')
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
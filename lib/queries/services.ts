import { createClient } from '@/lib/supabase/client';
import type { 
  Service, 
  CreateServiceInput, 
  UpdateServiceInput,
  ServiceWithStats 
} from '@/lib/types/services';

export async function getServices(): Promise<Service[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function getServiceById(id: string): Promise<Service | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getServiceWithStats(id: string): Promise<ServiceWithStats | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      appointments:appointments(count),
      revenue:sales(sum(amount)),
      reviews:reviews(rating)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;

  if (!data) return null;

  // Calculate average rating
  const ratings = (data.reviews as Array<{ rating: number }> || []).map(r => r.rating);
  const avgRating = ratings.length > 0 
    ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length 
    : 0;

  return {
    ...data,
    total_appointments: data.appointments?.[0]?.count || 0,
    revenue: data.revenue?.[0]?.sum || 0,
    average_rating: avgRating
  };
}

export async function createService(input: CreateServiceInput): Promise<Service> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('services')
    .insert([{
      ...input,
      is_active: input.is_active ?? true
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateService(input: UpdateServiceInput): Promise<Service> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('services')
    .update({
      ...input,
      updated_at: new Date().toISOString()
    })
    .eq('id', input.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteService(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getServiceCategories(): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('services')
    .select('category')
    .order('category');

  if (error) throw error;
  
  // Get unique categories
  return Array.from(new Set(data?.map(s => s.category) || []));
}

export async function toggleServiceStatus(id: string, isActive: boolean): Promise<Service> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('services')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

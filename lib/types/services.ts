export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number; // in minutes
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceInput {
  name: string;
  description: string;
  category: string;
  duration: number;
  price: number;
  is_active?: boolean;
}

export interface UpdateServiceInput extends Partial<CreateServiceInput> {
  id: string;
}

export type ServiceWithStats = Service & {
  total_appointments: number;
  revenue: number;
  average_rating: number;
}

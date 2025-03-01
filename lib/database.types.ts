export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      appointments: {
        Row: {
          id: string
          client_id: string
          worker_id: string | null
          service_id: string
          appointment_date: string
          time: string
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          notes: string | null
          created_at: string
          updated_at: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          status: 'unread' | 'read' | 'archived'
          created_at: string
          updated_at: string
        }
      }
      profiles: {
        Row: {
          id: string
          date_of_birth: string | null
          gender: string | null
          preferred_contact: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          allergies: string[] | null
          medical_conditions: string[] | null
          skin_concerns: string[] | null
          hair_type: string | null
          preferred_worker_id: string | null
          preferences: Json
          last_visit_date: string | null
          total_visits: number
          total_spent: number
          loyalty_points: number
          address: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          category_id: string
          image_url: string | null
          stock_quantity: number
          created_at: string
          updated_at: string
        }
      }
      product_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
      }
      services: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          duration: number
          created_at: string
          updated_at: string
        }
      }
      sales: {
        Row: {
          id: string
          client_id: string | null
          worker_id: string
          sale_type: 'product' | 'service'
          payment_method: 'cash' | 'card' | 'transfer'
          payment_status: 'pending' | 'completed' | 'failed'
          total_amount: number
          services: Json[]
          created_at: string
          updated_at: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'client' | 'worker'
          first_name: string | null
          last_name: string | null
          phone: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
    }
    Functions: {
      get_client_profile: {
        Args: {
          p_client_id: string
        }
        Returns: {
          id: string
          date_of_birth: string | null
          gender: string | null
          preferred_contact: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          allergies: string[] | null
          medical_conditions: string[] | null
          skin_concerns: string[] | null
          hair_type: string | null
          preferred_worker_id: string | null
          preferences: Json
          last_visit_date: string | null
          total_visits: number
          total_spent: number
          loyalty_points: number
          address: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
      }
    }
  }
} 
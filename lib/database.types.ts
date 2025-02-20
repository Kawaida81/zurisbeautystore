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
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          category_id: string
          price: number
          stock_quantity: number
          reorder_point: number
          is_active: boolean
          image_url: string | null
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
          full_name: string
          email: string
          phone: string | null
          role: 'client' | 'worker' | 'admin'
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
    }
  }
} 
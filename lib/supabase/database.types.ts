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
      users: {
        Row: {
          id: string
          created_at: string | null
          email: string
          full_name: string
          is_active: boolean | null
          last_login: string | null
          phone: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          email: string
          full_name: string
          is_active?: boolean | null
          last_login?: string | null
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          email?: string
          full_name?: string
          is_active?: boolean | null
          last_login?: string | null
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          id: string
          created_at: string | null
          client_id: string | null
          worker_id: string | null
          service_id: string | null
          appointment_date: string
          status: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          client_id?: string | null
          worker_id?: string | null
          service_id?: string | null
          appointment_date: string
          status?: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          client_id?: string | null
          worker_id?: string | null
          service_id?: string | null
          appointment_date?: string
          status?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_worker_id_fkey"
            columns: ["worker_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            referencedRelation: "services"
            referencedColumns: ["id"]
          }
        ]
      }
      services: {
        Row: {
          id: string
          created_at: string | null
          name: string
          description: string | null
          price: number
          duration: number
          is_active: boolean
          updated_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          name: string
          description?: string | null
          price: number
          duration: number
          is_active?: boolean
          updated_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          name?: string
          description?: string | null
          price?: number
          duration?: number
          is_active?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

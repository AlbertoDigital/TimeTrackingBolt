import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'user' | 'supervisor' | 'manager'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: 'user' | 'supervisor' | 'manager'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'user' | 'supervisor' | 'manager'
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          client: string
          description: string
          start_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          client: string
          description: string
          start_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          client?: string
          description?: string
          start_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          name: string
          description: string
          metadata: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          description?: string
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          description?: string
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      time_entries: {
        Row: {
          id: string
          user_id: string
          project_id: string
          task_id: string | null
          date: string
          start_time: string
          end_time: string
          hours: number
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          task_id?: string | null
          date: string
          start_time: string
          end_time: string
          hours: number
          description?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          task_id?: string | null
          date?: string
          start_time?: string
          end_time?: string
          hours?: number
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
      authorized_emails: {
        Row: {
          id: string
          email: string
          role: 'user' | 'supervisor' | 'manager'
          added_by: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          role?: 'user' | 'supervisor' | 'manager'
          added_by: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'user' | 'supervisor' | 'manager'
          added_by?: string
          created_at?: string
        }
      }
    }
  }
}
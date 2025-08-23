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
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          role: string
          timezone: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          timezone?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          timezone?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      apartments: {
        Row: {
          id: string
          owner_id: string
          name: string
          address: Json
          capacity: number
          bedrooms: number | null
          bathrooms: number | null
          amenities: string[] | null
          photos: string[] | null
          access_codes: Json | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          address: Json
          capacity: number
          bedrooms?: number | null
          bathrooms?: number | null
          amenities?: string[] | null
          photos?: string[] | null
          access_codes?: Json | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          address?: Json
          capacity?: number
          bedrooms?: number | null
          bathrooms?: number | null
          amenities?: string[] | null
          photos?: string[] | null
          access_codes?: Json | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          apartment_id: string
          owner_id: string
          guest_id: string | null
          platform: string
          platform_reservation_id: string | null
          check_in: string
          check_out: string
          guest_count: number
          total_price: number
          cleaning_fee: number | null
          platform_fee: number | null
          currency: string
          status: string
          notes: string | null
          contact_info: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          apartment_id: string
          owner_id: string
          guest_id?: string | null
          platform: string
          platform_reservation_id?: string | null
          check_in: string
          check_out: string
          guest_count: number
          total_price: number
          cleaning_fee?: number | null
          platform_fee?: number | null
          currency?: string
          status?: string
          notes?: string | null
          contact_info?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          apartment_id?: string
          owner_id?: string
          guest_id?: string | null
          platform?: string
          platform_reservation_id?: string | null
          check_in?: string
          check_out?: string
          guest_count?: number
          total_price?: number
          cleaning_fee?: number | null
          platform_fee?: number | null
          currency?: string
          status?: string
          notes?: string | null
          contact_info?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      guests: {
        Row: {
          id: string
          owner_id: string
          name: string
          email: string | null
          phone: string | null
          id_document: string | null
          address: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          email?: string | null
          phone?: string | null
          id_document?: string | null
          address?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          id_document?: string | null
          address?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      cleanings: {
        Row: {
          id: string
          apartment_id: string
          cleaner_id: string | null
          reservation_id: string | null
          scheduled_date: string
          duration: string | null
          status: string
          instructions: string | null
          supplies: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          apartment_id: string
          cleaner_id?: string | null
          reservation_id?: string | null
          scheduled_date: string
          duration?: string | null
          status?: string
          instructions?: string | null
          supplies?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          apartment_id?: string
          cleaner_id?: string | null
          reservation_id?: string | null
          scheduled_date?: string
          duration?: string | null
          status?: string
          instructions?: string | null
          supplies?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      cleaners: {
        Row: {
          id: string
          owner_id: string
          name: string
          email: string | null
          phone: string | null
          rate: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          email?: string | null
          phone?: string | null
          rate?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          rate?: number | null
          created_at?: string
          updated_at?: string
        }
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
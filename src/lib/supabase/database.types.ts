
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      amenities_reference: {
        Row: {
          category: string | null
          icon: string | null
          id: number
          name: string
        }
        Insert: {
          category?: string | null
          icon?: string | null
          id?: number
          name: string
        }
        Update: {
          category?: string | null
          icon?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      apartments: {
        Row: {
          access_codes: Json | null
          address: Json
          amenities: string[] | null
          bathrooms: number
          bedrooms: number
          capacity: number
          created_at: string | null
          id: string
          main_photo: string | null
          name: string
          notes: string | null
          owner_id: string
          photos: string[] | null
          square_feet: number | null
          status: Database["public"]["Enums"]["apartment_status"] | null
          updated_at: string | null
        }
        Insert: {
          access_codes?: Json | null
          address?: Json
          amenities?: string[] | null
          bathrooms?: number
          bedrooms?: number
          capacity?: number
          created_at?: string | null
          id?: string
          main_photo?: string | null
          name: string
          notes?: string | null
          owner_id: string
          photos?: string[] | null
          square_feet?: number | null
          status?: Database["public"]["Enums"]["apartment_status"] | null
          updated_at?: string | null
        }
        Update: {
          access_codes?: Json | null
          address?: Json
          amenities?: string[] | null
          bathrooms?: number
          bedrooms?: number
          capacity?: number
          created_at?: string | null
          id?: string
          main_photo?: string | null
          name?: string
          notes?: string | null
          owner_id?: string
          photos?: string[] | null
          square_feet?: number | null
          status?: Database["public"]["Enums"]["apartment_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apartments_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaners: {
        Row: {
          active: boolean | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          owner_id: string
          phone: string | null
          rate: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          owner_id: string
          phone?: string | null
          rate?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string
          phone?: string | null
          rate?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaners_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cleanings: {
        Row: {
          apartment_id: string
          cleaner_id: string | null
          created_at: string | null
          duration: unknown | null
          id: string
          instructions: string | null
          notes: string | null
          paid: boolean | null
          payment_amount: number | null
          reservation_id: string | null
          scheduled_date: string
          status: Database["public"]["Enums"]["cleaning_status"] | null
          supplies: Json | null
          updated_at: string | null
        }
        Insert: {
          apartment_id: string
          cleaner_id?: string | null
          created_at?: string | null
          duration?: unknown | null
          id?: string
          instructions?: string | null
          notes?: string | null
          paid?: boolean | null
          payment_amount?: number | null
          reservation_id?: string | null
          scheduled_date: string
          status?: Database["public"]["Enums"]["cleaning_status"] | null
          supplies?: Json | null
          updated_at?: string | null
        }
        Update: {
          apartment_id?: string
          cleaner_id?: string | null
          created_at?: string | null
          duration?: unknown | null
          id?: string
          instructions?: string | null
          notes?: string | null
          paid?: boolean | null
          payment_amount?: number | null
          reservation_id?: string | null
          scheduled_date?: string
          status?: Database["public"]["Enums"]["cleaning_status"] | null
          supplies?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleanings_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartment_stats"
            referencedColumns: ["apartment_id"]
          },
          {
            foreignKeyName: "cleanings_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleanings_cleaner_id_fkey"
            columns: ["cleaner_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleanings_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "calendar_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleanings_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          address: Json | null
          blacklisted: boolean | null
          created_at: string | null
          email: string | null
          id: string
          id_document: string | null
          name: string
          notes: string | null
          owner_id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          blacklisted?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          id_document?: string | null
          name: string
          notes?: string | null
          owner_id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          blacklisted?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          id_document?: string | null
          name?: string
          notes?: string | null
          owner_id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          settings: Json | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"] | null
          settings?: Json | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          settings?: Json | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          apartment_id: string
          check_in: string
          check_out: string
          cleaning_fee: number | null
          contact_info: Json | null
          created_at: string | null
          currency: string | null
          guest_count: number
          guest_id: string | null
          id: string
          notes: string | null
          owner_id: string
          platform: Database["public"]["Enums"]["reservation_platform"]
          platform_fee: number | null
          platform_reservation_id: string | null
          status: Database["public"]["Enums"]["reservation_status"] | null
          total_price: number | null
          updated_at: string | null
        }
        Insert: {
          apartment_id: string
          check_in: string
          check_out: string
          cleaning_fee?: number | null
          contact_info?: Json | null
          created_at?: string | null
          currency?: string | null
          guest_count?: number
          guest_id?: string | null
          id?: string
          notes?: string | null
          owner_id: string
          platform: Database["public"]["Enums"]["reservation_platform"]
          platform_fee?: number | null
          platform_reservation_id?: string | null
          status?: Database["public"]["Enums"]["reservation_status"] | null
          total_price?: number | null
          updated_at?: string | null
        }
        Update: {
          apartment_id?: string
          check_in?: string
          check_out?: string
          cleaning_fee?: number | null
          contact_info?: Json | null
          created_at?: string | null
          currency?: string | null
          guest_count?: number
          guest_id?: string | null
          id?: string
          notes?: string | null
          owner_id?: string
          platform?: Database["public"]["Enums"]["reservation_platform"]
          platform_fee?: number | null
          platform_reservation_id?: string | null
          status?: Database["public"]["Enums"]["reservation_status"] | null
          total_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartment_stats"
            referencedColumns: ["apartment_id"]
          },
          {
            foreignKeyName: "reservations_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      apartment_stats: {
        Row: {
          apartment_id: string | null
          avg_guest_count: number | null
          confirmed_reservations: number | null
          current_reservations: number | null
          name: string | null
          owner_id: string | null
          total_reservations: number | null
          total_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "apartments_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_view: {
        Row: {
          apartment_id: string | null
          apartment_name: string | null
          check_in: string | null
          check_out: string | null
          cleaning_date: string | null
          cleaning_id: string | null
          cleaning_status: Database["public"]["Enums"]["cleaning_status"] | null
          contact_info: Json | null
          guest_count: number | null
          guest_name: string | null
          id: string | null
          nights: number | null
          notes: string | null
          owner_id: string | null
          platform: Database["public"]["Enums"]["reservation_platform"] | null
          status: Database["public"]["Enums"]["reservation_status"] | null
          total_price: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartment_stats"
            referencedColumns: ["apartment_id"]
          },
          {
            foreignKeyName: "reservations_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_apartment_availability: {
        Args: {
          p_apartment_id: string
          p_check_in: string
          p_check_out: string
          p_exclude_reservation_id?: string
        }
        Returns: boolean
      }
      check_availability: {
        Args: {
          p_apartment_id: string
          p_check_in: string
          p_check_out: string
          p_exclude_reservation_id?: string
        }
        Returns: boolean
      }
      decrypt_sensitive_data: {
        Args: { encrypted_data: string }
        Returns: string
      }
      encrypt_sensitive_data: {
        Args: { data: string }
        Returns: string
      }
      get_apartment_stats: {
        Args: { apartment_uuid: string; end_date: string; start_date: string }
        Returns: {
          avg_nightly_rate: number
          occupancy_rate: number
          total_bookings: number
          total_nights: number
          total_revenue: number
        }[]
      }
      get_availability_gaps: {
        Args: {
          p_apartment_id: string
          p_end_date: string
          p_min_gap_days?: number
          p_start_date: string
        }
        Returns: {
          gap_days: number
          gap_end: string
          gap_start: string
        }[]
      }
      get_calendar_data: {
        Args: {
          p_apartment_ids?: string[]
          p_end_date: string
          p_owner_id: string
          p_start_date: string
        }
        Returns: {
          apartment_id: string
          apartment_name: string
          check_in: string
          check_out: string
          cleaning_date: string
          cleaning_id: string
          cleaning_status: string
          contact_info: Json
          guest_count: number
          guest_name: string
          id: string
          notes: string
          platform: string
          status: string
          total_price: number
        }[]
      }
      get_calendar_stats: {
        Args: {
          p_apartment_ids?: string[]
          p_end_date: string
          p_owner_id: string
          p_start_date: string
        }
        Returns: {
          occupancy_rate: number
          occupied_nights: number
          platform_breakdown: Json
          total_nights: number
          total_reservations: number
          total_revenue: number
        }[]
      }
    }
    Enums: {
      apartment_status: "active" | "inactive" | "maintenance"
      cleaning_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      platform_type: "airbnb" | "vrbo" | "direct" | "booking_com"
      reservation_platform: "airbnb" | "vrbo" | "direct" | "rent"
      reservation_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      user_role: "owner" | "cleaner" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      apartment_status: ["active", "inactive", "maintenance"],
      cleaning_status: ["scheduled", "in_progress", "completed", "cancelled"],
      platform_type: ["airbnb", "vrbo", "direct", "booking_com"],
      reservation_platform: ["airbnb", "vrbo", "direct", "rent"],
      reservation_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      user_role: ["owner", "cleaner", "admin"],
    },
  },
} as const

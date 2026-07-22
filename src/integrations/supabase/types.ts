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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          business_id: string
          created_at: string
          customer_name: string
          email: string | null
          ends_at: string | null
          id: string
          job: string | null
          lead_id: string | null
          notes: string | null
          phone: string | null
          source: string
          starts_at: string
          status: string
          updated_at: string
          value_cents: number
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_name: string
          email?: string | null
          ends_at?: string | null
          id?: string
          job?: string | null
          lead_id?: string | null
          notes?: string | null
          phone?: string | null
          source?: string
          starts_at: string
          status?: string
          updated_at?: string
          value_cents?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_name?: string
          email?: string | null
          ends_at?: string | null
          id?: string
          job?: string | null
          lead_id?: string | null
          notes?: string | null
          phone?: string | null
          source?: string
          starts_at?: string
          status?: string
          updated_at?: string
          value_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          after_hours_message: string | null
          availability: Json
          booking_enabled: boolean
          booking_slug: string | null
          buffer_minutes: number
          country: string | null
          created_at: string
          google_review_url: string | null
          id: string
          name: string
          owner_id: string
          phone: string | null
          service_area: string | null
          slot_minutes: number
          timezone: string | null
          trade: string
          updated_at: string
        }
        Insert: {
          after_hours_message?: string | null
          availability?: Json
          booking_enabled?: boolean
          booking_slug?: string | null
          buffer_minutes?: number
          country?: string | null
          created_at?: string
          google_review_url?: string | null
          id?: string
          name: string
          owner_id: string
          phone?: string | null
          service_area?: string | null
          slot_minutes?: number
          timezone?: string | null
          trade: string
          updated_at?: string
        }
        Update: {
          after_hours_message?: string | null
          availability?: Json
          booking_enabled?: boolean
          booking_slug?: string | null
          buffer_minutes?: number
          country?: string | null
          created_at?: string
          google_review_url?: string | null
          id?: string
          name?: string
          owner_id?: string
          phone?: string | null
          service_area?: string | null
          slot_minutes?: number
          timezone?: string | null
          trade?: string
          updated_at?: string
        }
        Relationships: []
      }
      calls: {
        Row: {
          business_id: string
          created_at: string
          from_number: string
          id: string
          note: string | null
          recovered: boolean
        }
        Insert: {
          business_id: string
          created_at?: string
          from_number: string
          id?: string
          note?: string | null
          recovered?: boolean
        }
        Update: {
          business_id?: string
          created_at?: string
          from_number?: string
          id?: string
          note?: string | null
          recovered?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "calls_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          business_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string | null
          customer_name: string
          email: string | null
          id: string
          line_items: Json
          notes: string | null
          phone: string | null
          public_token: string
          status: string
          subtotal_cents: number
          tax_cents: number
          title: string
          total_cents: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id?: string | null
          customer_name: string
          email?: string | null
          id?: string
          line_items?: Json
          notes?: string | null
          phone?: string | null
          public_token?: string
          status?: string
          subtotal_cents?: number
          tax_cents?: number
          title?: string
          total_cents?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          email?: string | null
          id?: string
          line_items?: Json
          notes?: string | null
          phone?: string | null
          public_token?: string
          status?: string
          subtotal_cents?: number
          tax_cents?: number
          title?: string
          total_cents?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid_cents: number
          business_id: string
          created_at: string
          customer_id: string | null
          customer_name: string
          due_date: string | null
          email: string | null
          estimate_id: string | null
          id: string
          line_items: Json
          notes: string | null
          phone: string | null
          public_token: string
          status: string
          subtotal_cents: number
          tax_cents: number
          title: string
          total_cents: number
          updated_at: string
        }
        Insert: {
          amount_paid_cents?: number
          business_id: string
          created_at?: string
          customer_id?: string | null
          customer_name: string
          due_date?: string | null
          email?: string | null
          estimate_id?: string | null
          id?: string
          line_items?: Json
          notes?: string | null
          phone?: string | null
          public_token?: string
          status?: string
          subtotal_cents?: number
          tax_cents?: number
          title?: string
          total_cents?: number
          updated_at?: string
        }
        Update: {
          amount_paid_cents?: number
          business_id?: string
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          due_date?: string | null
          email?: string | null
          estimate_id?: string | null
          id?: string
          line_items?: Json
          notes?: string | null
          phone?: string | null
          public_token?: string
          status?: string
          subtotal_cents?: number
          tax_cents?: number
          title?: string
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          business_id: string
          created_at: string
          estimated_value: number | null
          id: string
          issue: string | null
          name: string
          phone: string | null
          source: string | null
          status: string
          updated_at: string
          urgency: string
        }
        Insert: {
          business_id: string
          created_at?: string
          estimated_value?: number | null
          id?: string
          issue?: string | null
          name: string
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          urgency?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          estimated_value?: number | null
          id?: string
          issue?: string | null
          name?: string
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_drafts: {
        Row: {
          business_id: string
          channel: string | null
          content: string
          created_at: string
          id: string
          kind: string
          owner_id: string
          prompt: string | null
        }
        Insert: {
          business_id: string
          channel?: string | null
          content: string
          created_at?: string
          id?: string
          kind: string
          owner_id: string
          prompt?: string | null
        }
        Update: {
          business_id?: string
          channel?: string | null
          content?: string
          created_at?: string
          id?: string
          kind?: string
          owner_id?: string
          prompt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_drafts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_requests: {
        Row: {
          booking_id: string | null
          business_id: string
          created_at: string
          customer_name: string
          google_review_url: string | null
          id: string
          phone: string | null
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          business_id: string
          created_at?: string
          customer_name: string
          google_review_url?: string | null
          id?: string
          phone?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          business_id?: string
          created_at?: string
          customer_name?: string
          google_review_url?: string | null
          id?: string
          phone?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          business_id: string
          created_at: string
          current_period_end: string | null
          id: string
          plan: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          country: string | null
          created_at: string
          email: string
          id: string
          trade: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          email: string
          id?: string
          trade?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          trade?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "admin"
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
  public: {
    Enums: {
      app_role: ["owner", "admin"],
    },
  },
} as const

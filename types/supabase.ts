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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      catering_inquiries: {
        Row: {
          created_at: string | null
          details: string | null
          email: string
          event_date: string | null
          guest_count: number | null
          id: number
          name: string
          phone: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          email: string
          event_date?: string | null
          guest_count?: number | null
          id?: number
          name: string
          phone?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          details?: string | null
          email?: string
          event_date?: string | null
          guest_count?: number | null
          id?: number
          name?: string
          phone?: string | null
          status?: string
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          price: number
          sort_order: number | null
          spicy_level: number | null
          tag: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          price: number
          sort_order?: number | null
          spicy_level?: number | null
          tag?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          price?: number
          sort_order?: number | null
          spicy_level?: number | null
          tag?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string | null
          name: string
          order_id: string
          price: number
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          name: string
          order_id: string
          price: number
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          name?: string
          order_id?: string
          price?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancellation_deadline: string | null
          created_at: string
          delivery_address: string | null
          delivery_provider: string | null
          delivery_triggered_at: string | null
          doordash_dasher_location: Json | null
          doordash_dasher_name: string | null
          doordash_dasher_phone: string | null
          doordash_delivery_eta: string | null
          doordash_delivery_id: string | null
          doordash_delivery_status: string | null
          doordash_proof_of_delivery: Json | null
          doordash_tracking_url: string | null
          full_name: string | null
          id: string
          order_number: number
          payment_id: string | null
          payment_status: string | null
          pickup_notes: string | null
          points_earned: number
          read: boolean | null
          read_at: string | null
          status: string
          total: number
          uber_courier_location: Json | null
          uber_courier_name: string | null
          uber_courier_phone: string | null
          uber_delivery_eta: string | null
          uber_delivery_id: string | null
          uber_delivery_status: string | null
          uber_proof_of_delivery: Json | null
          uber_tracking_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancellation_deadline?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_provider?: string | null
          delivery_triggered_at?: string | null
          doordash_dasher_location?: Json | null
          doordash_dasher_name?: string | null
          doordash_dasher_phone?: string | null
          doordash_delivery_eta?: string | null
          doordash_delivery_id?: string | null
          doordash_delivery_status?: string | null
          doordash_proof_of_delivery?: Json | null
          doordash_tracking_url?: string | null
          full_name?: string | null
          id?: string
          order_number?: number
          payment_id?: string | null
          payment_status?: string | null
          pickup_notes?: string | null
          points_earned?: number
          read?: boolean | null
          read_at?: string | null
          status?: string
          total: number
          uber_courier_location?: Json | null
          uber_courier_name?: string | null
          uber_courier_phone?: string | null
          uber_delivery_eta?: string | null
          uber_delivery_id?: string | null
          uber_delivery_status?: string | null
          uber_proof_of_delivery?: Json | null
          uber_tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancellation_deadline?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_provider?: string | null
          delivery_triggered_at?: string | null
          doordash_dasher_location?: Json | null
          doordash_dasher_name?: string | null
          doordash_dasher_phone?: string | null
          doordash_delivery_eta?: string | null
          doordash_delivery_id?: string | null
          doordash_delivery_status?: string | null
          doordash_proof_of_delivery?: Json | null
          doordash_tracking_url?: string | null
          full_name?: string | null
          id?: string
          order_number?: number
          payment_id?: string | null
          payment_status?: string | null
          pickup_notes?: string | null
          points_earned?: number
          read?: boolean | null
          read_at?: string | null
          status?: string
          total?: number
          uber_courier_location?: Json | null
          uber_courier_name?: string | null
          uber_courier_phone?: string | null
          uber_delivery_eta?: string | null
          uber_delivery_id?: string | null
          uber_delivery_status?: string | null
          uber_proof_of_delivery?: Json | null
          uber_tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          brand: string | null
          card_number: string | null
          cardholder_name: string
          created_at: string
          exp_month: number | null
          exp_year: number | null
          expiry_date: string
          id: string
          is_default: boolean | null
          last4: string | null
          stripe_customer_id: string | null
          stripe_payment_method_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          card_number?: string | null
          cardholder_name: string
          created_at?: string
          exp_month?: number | null
          exp_year?: number | null
          expiry_date: string
          id?: string
          is_default?: boolean | null
          last4?: string | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          card_number?: string | null
          cardholder_name?: string
          created_at?: string
          exp_month?: number | null
          exp_year?: number | null
          expiry_date?: string
          id?: string
          is_default?: boolean | null
          last4?: string | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          first_order_at: string | null
          first_order_bonus_awarded: boolean | null
          first_order_bonus_points: number | null
          id: string
          referral_code: string
          referred_email: string | null
          referred_user_id: string | null
          referrer_user_id: string
          signed_up_at: string | null
          signup_bonus_awarded: boolean | null
          signup_bonus_points: number | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          first_order_at?: string | null
          first_order_bonus_awarded?: boolean | null
          first_order_bonus_points?: number | null
          id?: string
          referral_code: string
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_user_id: string
          signed_up_at?: string | null
          signup_bonus_awarded?: boolean | null
          signup_bonus_points?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          first_order_at?: string | null
          first_order_bonus_awarded?: boolean | null
          first_order_bonus_points?: number | null
          id?: string
          referral_code?: string
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_user_id?: string
          signed_up_at?: string | null
          signup_bonus_awarded?: boolean | null
          signup_bonus_points?: number | null
          status?: string | null
        }
        Relationships: []
      }
      stripe_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          error_message: string | null
          id: string
          metadata: Json | null
          order_id: string | null
          payment_gateway: string | null
          payment_id: string
          payment_method: string | null
          receipt_url: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payment_gateway?: string | null
          payment_id: string
          payment_method?: string | null
          receipt_url?: string | null
          status: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payment_gateway?: string | null
          payment_id?: string
          payment_method?: string | null
          receipt_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          address: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          points: number
          profile_image: string | null
          stripe_customer_id: string | null
          updated_at: string
          user_id: string | null
          user_role: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          points?: number
          profile_image?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string | null
          user_role?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          points?: number
          profile_image?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string | null
          user_role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_admin_user: {
        Args: {
          admin_email: string
          admin_name?: string
          admin_password: string
        }
        Returns: string
      }
      generate_referral_code: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

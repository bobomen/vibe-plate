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
      ad_performance_stats: {
        Row: {
          avg_traffic_multiplier: number | null
          click_through_rate: number | null
          coupons_claimed: number
          coupons_redeemed: number
          created_at: string
          id: string
          new_favorites: number
          redemption_rate: number | null
          restaurant_id: string
          stats_date: string
          subscription_id: string
          total_clicks: number
          total_impressions: number
          unique_viewers: number
        }
        Insert: {
          avg_traffic_multiplier?: number | null
          click_through_rate?: number | null
          coupons_claimed?: number
          coupons_redeemed?: number
          created_at?: string
          id?: string
          new_favorites?: number
          redemption_rate?: number | null
          restaurant_id: string
          stats_date: string
          subscription_id: string
          total_clicks?: number
          total_impressions?: number
          unique_viewers?: number
        }
        Update: {
          avg_traffic_multiplier?: number | null
          click_through_rate?: number | null
          coupons_claimed?: number
          coupons_redeemed?: number
          created_at?: string
          id?: string
          new_favorites?: number
          redemption_rate?: number | null
          restaurant_id?: string
          stats_date?: string
          subscription_id?: string
          total_clicks?: number
          total_impressions?: number
          unique_viewers?: number
        }
        Relationships: [
          {
            foreignKeyName: "ad_performance_stats_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "popular_restaurants_7d"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_performance_stats_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_performance_stats_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "restaurant_ad_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      algorithm_scores: {
        Row: {
          algorithm_score: number
          card_position: number
          created_at: string
          group_id: string | null
          id: string
          restaurant_id: string
          user_action: string | null
          user_id: string
        }
        Insert: {
          algorithm_score: number
          card_position: number
          created_at?: string
          group_id?: string | null
          id?: string
          restaurant_id: string
          user_action?: string | null
          user_id: string
        }
        Update: {
          algorithm_score?: number
          card_position?: number
          created_at?: string
          group_id?: string | null
          id?: string
          restaurant_id?: string
          user_action?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "algorithm_scores_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "algorithm_scores_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "popular_restaurants_7d"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "algorithm_scores_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          current_uses: number | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_spend: number | null
          restaurant_id: string
          title: string
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_spend?: number | null
          restaurant_id: string
          title: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_spend?: number | null
          restaurant_id?: string
          title?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "popular_restaurants_7d"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      favorite_category_items: {
        Row: {
          category_id: string
          created_at: string
          favorite_id: string
          id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          favorite_id: string
          id?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          favorite_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_favorite_category_items_category_id"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "favorite_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_favorite_category_items_favorite_id"
            columns: ["favorite_id"]
            isOneToOne: false
            referencedRelation: "favorites"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          restaurant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "popular_restaurants_7d"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      group_invites: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          group_id: string
          id: string
          invite_code: string
          invite_link: string | null
          invited_user_id: string | null
          inviter_id: string
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          group_id: string
          id?: string
          invite_code: string
          invite_link?: string | null
          invited_user_id?: string | null
          inviter_id: string
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          group_id?: string
          id?: string
          invite_code?: string
          invite_link?: string | null
          invited_user_id?: string | null
          inviter_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_invites_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          code: string
          created_at: string
          created_by: string
          current_region: Json | null
          id: string
          name: string | null
          target_regions: Json | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          current_region?: Json | null
          id?: string
          name?: string | null
          target_regions?: Json | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          current_region?: Json | null
          id?: string
          name?: string | null
          target_regions?: Json | null
        }
        Relationships: []
      }
      hypothesis_tracking: {
        Row: {
          created_at: string | null
          current_value: number | null
          hypothesis_id: string
          hypothesis_name: string
          id: string
          status: string | null
          target_metric: string
          target_value: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          hypothesis_id: string
          hypothesis_name: string
          id?: string
          status?: string | null
          target_metric: string
          target_value: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          hypothesis_id?: string
          hypothesis_name?: string
          id?: string
          status?: string | null
          target_metric?: string
          target_value?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      monthly_reviews: {
        Row: {
          created_at: string | null
          generated_at: string | null
          graphic_url: string | null
          id: string
          like_percentage: number | null
          most_visited_district: string | null
          review_month: string
          shared_at: string | null
          shared_to_platform: string | null
          top_cuisine_type: string | null
          total_favorites: number | null
          total_likes: number | null
          total_swipes: number | null
          updated_at: string | null
          user_id: string
          user_ranked_restaurants: Json
        }
        Insert: {
          created_at?: string | null
          generated_at?: string | null
          graphic_url?: string | null
          id?: string
          like_percentage?: number | null
          most_visited_district?: string | null
          review_month: string
          shared_at?: string | null
          shared_to_platform?: string | null
          top_cuisine_type?: string | null
          total_favorites?: number | null
          total_likes?: number | null
          total_swipes?: number | null
          updated_at?: string | null
          user_id: string
          user_ranked_restaurants?: Json
        }
        Update: {
          created_at?: string | null
          generated_at?: string | null
          graphic_url?: string | null
          id?: string
          like_percentage?: number | null
          most_visited_district?: string | null
          review_month?: string
          shared_at?: string | null
          shared_to_platform?: string | null
          top_cuisine_type?: string | null
          total_favorites?: number | null
          total_likes?: number | null
          total_swipes?: number | null
          updated_at?: string | null
          user_id?: string
          user_ranked_restaurants?: Json
        }
        Relationships: []
      }
      payment_history: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          payment_date: string
          payment_method: string | null
          payment_status: string
          stripe_payment_id: string | null
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          payment_date?: string
          payment_method?: string | null
          payment_status: string
          stripe_payment_id?: string | null
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          payment_date?: string
          payment_method?: string | null
          payment_status?: string
          stripe_payment_id?: string | null
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          dietary_preferences: Json | null
          display_name: string | null
          favorite_cuisines: Json | null
          id: string
          is_premium: boolean | null
          last_nag_at: string | null
          location_lat: number | null
          location_lng: number | null
          min_rating: number | null
          nag_variant: string | null
          preferences: Json | null
          preferred_price_max: number | null
          preferred_price_min: number | null
          should_nag: boolean | null
          successful_invites: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          dietary_preferences?: Json | null
          display_name?: string | null
          favorite_cuisines?: Json | null
          id?: string
          is_premium?: boolean | null
          last_nag_at?: string | null
          location_lat?: number | null
          location_lng?: number | null
          min_rating?: number | null
          nag_variant?: string | null
          preferences?: Json | null
          preferred_price_max?: number | null
          preferred_price_min?: number | null
          should_nag?: boolean | null
          successful_invites?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          dietary_preferences?: Json | null
          display_name?: string | null
          favorite_cuisines?: Json | null
          id?: string
          is_premium?: boolean | null
          last_nag_at?: string | null
          location_lat?: number | null
          location_lng?: number | null
          min_rating?: number | null
          nag_variant?: string | null
          preferences?: Json | null
          preferred_price_max?: number | null
          preferred_price_min?: number | null
          should_nag?: boolean | null
          successful_invites?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      restaurant_ad_coupons: {
        Row: {
          claimed_at: string | null
          code_expires_at: string | null
          code_generated_at: string | null
          created_at: string
          discount_applied: number | null
          discount_type: string
          discount_value: number
          expires_at: string
          id: string
          max_discount: number | null
          min_spend: number | null
          radius_km: number | null
          redeemed_amount: number | null
          redeemed_at: string | null
          restaurant_id: string
          status: string
          subscription_id: string
          user_id: string | null
          verification_code: string | null
        }
        Insert: {
          claimed_at?: string | null
          code_expires_at?: string | null
          code_generated_at?: string | null
          created_at?: string
          discount_applied?: number | null
          discount_type: string
          discount_value: number
          expires_at: string
          id?: string
          max_discount?: number | null
          min_spend?: number | null
          radius_km?: number | null
          redeemed_amount?: number | null
          redeemed_at?: string | null
          restaurant_id: string
          status?: string
          subscription_id: string
          user_id?: string | null
          verification_code?: string | null
        }
        Update: {
          claimed_at?: string | null
          code_expires_at?: string | null
          code_generated_at?: string | null
          created_at?: string
          discount_applied?: number | null
          discount_type?: string
          discount_value?: number
          expires_at?: string
          id?: string
          max_discount?: number | null
          min_spend?: number | null
          radius_km?: number | null
          redeemed_amount?: number | null
          redeemed_at?: string | null
          restaurant_id?: string
          status?: string
          subscription_id?: string
          user_id?: string | null
          verification_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_ad_coupons_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "popular_restaurants_7d"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_ad_coupons_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_ad_coupons_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "restaurant_ad_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_ad_subscriptions: {
        Row: {
          cancelled_at: string | null
          cash_paid: number
          coupon_budget: number
          coupon_config: Json | null
          coupon_ratio: number
          created_at: string
          expires_at: string
          id: string
          last_modified_at: string | null
          modification_count: number | null
          plan_amount: number
          restaurant_id: string
          started_at: string
          status: string
          stripe_payment_id: string | null
          stripe_subscription_id: string | null
          subscription_type: string
          total_redeemed_amount: number
          traffic_multiplier: number
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          cash_paid: number
          coupon_budget: number
          coupon_config?: Json | null
          coupon_ratio: number
          created_at?: string
          expires_at: string
          id?: string
          last_modified_at?: string | null
          modification_count?: number | null
          plan_amount: number
          restaurant_id: string
          started_at?: string
          status?: string
          stripe_payment_id?: string | null
          stripe_subscription_id?: string | null
          subscription_type?: string
          total_redeemed_amount?: number
          traffic_multiplier?: number
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          cash_paid?: number
          coupon_budget?: number
          coupon_config?: Json | null
          coupon_ratio?: number
          created_at?: string
          expires_at?: string
          id?: string
          last_modified_at?: string | null
          modification_count?: number | null
          plan_amount?: number
          restaurant_id?: string
          started_at?: string
          status?: string
          stripe_payment_id?: string | null
          stripe_subscription_id?: string | null
          subscription_type?: string
          total_redeemed_amount?: number
          traffic_multiplier?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_ad_subscriptions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "popular_restaurants_7d"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_ad_subscriptions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_claims: {
        Row: {
          cancelled_at: string | null
          cancelled_reason: string | null
          claim_type: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          data_completeness_score: number | null
          id: string
          rejected_at: string | null
          rejection_reason: string | null
          restaurant_id: string | null
          status: string
          submitted_data: Json | null
          updated_at: string
          user_id: string
          verification_attempt_id: string | null
          verified_at: string | null
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_reason?: string | null
          claim_type: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          data_completeness_score?: number | null
          id?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          restaurant_id?: string | null
          status?: string
          submitted_data?: Json | null
          updated_at?: string
          user_id: string
          verification_attempt_id?: string | null
          verified_at?: string | null
        }
        Update: {
          cancelled_at?: string | null
          cancelled_reason?: string | null
          claim_type?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          data_completeness_score?: number | null
          id?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          restaurant_id?: string | null
          status?: string
          submitted_data?: Json | null
          updated_at?: string
          user_id?: string
          verification_attempt_id?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_claims_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "popular_restaurants_7d"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_claims_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_claims_verification_attempt_id_fkey"
            columns: ["verification_attempt_id"]
            isOneToOne: false
            referencedRelation: "verification_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_data_changes: {
        Row: {
          changed_by: string
          created_at: string | null
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          restaurant_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string | null
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          restaurant_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string | null
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_data_changes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "popular_restaurants_7d"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_data_changes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_owners: {
        Row: {
          created_at: string
          id: string
          restaurant_id: string
          user_id: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_id: string
          user_id: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_id?: string
          user_id?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_owners_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "popular_restaurants_7d"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_owners_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_photos: {
        Row: {
          approved_at: string | null
          file_format: string | null
          file_size_bytes: number | null
          id: string
          photo_url: string
          rejection_reason: string | null
          restaurant_id: string
          status: string | null
          uploaded_at: string | null
          uploaded_by: string
        }
        Insert: {
          approved_at?: string | null
          file_format?: string | null
          file_size_bytes?: number | null
          id?: string
          photo_url: string
          rejection_reason?: string | null
          restaurant_id: string
          status?: string | null
          uploaded_at?: string | null
          uploaded_by: string
        }
        Update: {
          approved_at?: string | null
          file_format?: string | null
          file_size_bytes?: number | null
          id?: string
          photo_url?: string
          rejection_reason?: string | null
          restaurant_id?: string
          status?: string | null
          uploaded_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_photos_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "popular_restaurants_7d"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_photos_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_trust_score: {
        Row: {
          created_at: string | null
          data_completeness_score: number | null
          id: string
          last_data_update_at: string | null
          last_login_at: string | null
          login_frequency_score: number | null
          menu_last_updated_at: string | null
          photo_count: number | null
          photo_quality_score: number | null
          restaurant_id: string
          total_logins: number | null
          trust_score: number | null
          update_recency_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data_completeness_score?: number | null
          id?: string
          last_data_update_at?: string | null
          last_login_at?: string | null
          login_frequency_score?: number | null
          menu_last_updated_at?: string | null
          photo_count?: number | null
          photo_quality_score?: number | null
          restaurant_id: string
          total_logins?: number | null
          trust_score?: number | null
          update_recency_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data_completeness_score?: number | null
          id?: string
          last_data_update_at?: string | null
          last_login_at?: string | null
          login_frequency_score?: number | null
          menu_last_updated_at?: string | null
          photo_count?: number | null
          photo_quality_score?: number | null
          restaurant_id?: string
          total_logins?: number | null
          trust_score?: number | null
          update_recency_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_trust_score_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "popular_restaurants_7d"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_trust_score_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_verification_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          restaurant_id: string | null
          used: boolean
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          restaurant_id?: string | null
          used?: boolean
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          restaurant_id?: string | null
          used?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_verification_codes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "popular_restaurants_7d"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_verification_codes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_views: {
        Row: {
          click_type: string | null
          created_at: string | null
          did_favorite: boolean | null
          did_share: boolean | null
          distance_km: number | null
          filter_context: Json | null
          group_id: string | null
          id: string
          restaurant_id: string
          user_id: string
          user_lat: number | null
          user_lng: number | null
          view_duration_ms: number | null
          view_source: string
        }
        Insert: {
          click_type?: string | null
          created_at?: string | null
          did_favorite?: boolean | null
          did_share?: boolean | null
          distance_km?: number | null
          filter_context?: Json | null
          group_id?: string | null
          id?: string
          restaurant_id: string
          user_id: string
          user_lat?: number | null
          user_lng?: number | null
          view_duration_ms?: number | null
          view_source: string
        }
        Update: {
          click_type?: string | null
          created_at?: string | null
          did_favorite?: boolean | null
          did_share?: boolean | null
          distance_km?: number | null
          filter_context?: Json | null
          group_id?: string | null
          id?: string
          restaurant_id?: string
          user_id?: string
          user_lat?: number | null
          user_lng?: number | null
          view_duration_ms?: number | null
          view_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_views_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_views_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "popular_restaurants_7d"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_views_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          ai_classified_at: string | null
          ai_confidence: number | null
          bib_gourmand: boolean | null
          business_hours: Json | null
          city: string | null
          created_at: string
          cuisine_type: string | null
          deleted_at: string | null
          dietary_options: Json | null
          district: string | null
          exposure_multiplier: number | null
          google_maps_url: string | null
          google_rating: number | null
          google_reviews_count: number | null
          has_500_dishes: boolean | null
          id: string
          klook_url: string | null
          last_owner_login_at: string | null
          last_viewed_at: string | null
          lat: number
          lng: number
          menu_url: string | null
          michelin_stars: number | null
          name: string
          phone: string | null
          photos: string[] | null
          price_range: number | null
          status: string | null
          subscription_tier: string | null
          trust_score: number | null
          verified_at: string | null
          view_count: number | null
          website: string | null
        }
        Insert: {
          address?: string | null
          ai_classified_at?: string | null
          ai_confidence?: number | null
          bib_gourmand?: boolean | null
          business_hours?: Json | null
          city?: string | null
          created_at?: string
          cuisine_type?: string | null
          deleted_at?: string | null
          dietary_options?: Json | null
          district?: string | null
          exposure_multiplier?: number | null
          google_maps_url?: string | null
          google_rating?: number | null
          google_reviews_count?: number | null
          has_500_dishes?: boolean | null
          id?: string
          klook_url?: string | null
          last_owner_login_at?: string | null
          last_viewed_at?: string | null
          lat: number
          lng: number
          menu_url?: string | null
          michelin_stars?: number | null
          name: string
          phone?: string | null
          photos?: string[] | null
          price_range?: number | null
          status?: string | null
          subscription_tier?: string | null
          trust_score?: number | null
          verified_at?: string | null
          view_count?: number | null
          website?: string | null
        }
        Update: {
          address?: string | null
          ai_classified_at?: string | null
          ai_confidence?: number | null
          bib_gourmand?: boolean | null
          business_hours?: Json | null
          city?: string | null
          created_at?: string
          cuisine_type?: string | null
          deleted_at?: string | null
          dietary_options?: Json | null
          district?: string | null
          exposure_multiplier?: number | null
          google_maps_url?: string | null
          google_rating?: number | null
          google_reviews_count?: number | null
          has_500_dishes?: boolean | null
          id?: string
          klook_url?: string | null
          last_owner_login_at?: string | null
          last_viewed_at?: string | null
          lat?: number
          lng?: number
          menu_url?: string | null
          michelin_stars?: number | null
          name?: string
          phone?: string | null
          photos?: string[] | null
          price_range?: number | null
          status?: string | null
          subscription_tier?: string | null
          trust_score?: number | null
          verified_at?: string | null
          view_count?: number | null
          website?: string | null
        }
        Relationships: []
      }
      subscription_change_history: {
        Row: {
          change_type: string
          changed_by: string
          created_at: string | null
          id: string
          new_values: Json
          notes: string | null
          payment_amount: number | null
          previous_values: Json
          subscription_id: string
        }
        Insert: {
          change_type: string
          changed_by: string
          created_at?: string | null
          id?: string
          new_values: Json
          notes?: string | null
          payment_amount?: number | null
          previous_values: Json
          subscription_id: string
        }
        Update: {
          change_type?: string
          changed_by?: string
          created_at?: string | null
          id?: string
          new_values?: Json
          notes?: string | null
          payment_amount?: number | null
          previous_values?: Json
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_change_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "restaurant_ad_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          auto_renew: boolean
          cancelled_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          started_at: string
          status: string
          subscription_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          started_at?: string
          status?: string
          subscription_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          started_at?: string
          status?: string
          subscription_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      traffic_multiplier_history: {
        Row: {
          calculated_at: string
          id: string
          new_multiplier: number
          previous_multiplier: number
          redeemed_amount_at_change: number
          subscription_id: string
          trigger_reason: string | null
        }
        Insert: {
          calculated_at?: string
          id?: string
          new_multiplier: number
          previous_multiplier: number
          redeemed_amount_at_change: number
          subscription_id: string
          trigger_reason?: string | null
        }
        Update: {
          calculated_at?: string
          id?: string
          new_multiplier?: number
          previous_multiplier?: number
          redeemed_amount_at_change?: number
          subscription_id?: string
          trigger_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "traffic_multiplier_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "restaurant_ad_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_coupons: {
        Row: {
          claimed_at: string | null
          coupon_id: string
          created_at: string | null
          id: string
          status: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          coupon_id: string
          created_at?: string | null
          id?: string
          status?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          coupon_id?: string
          created_at?: string | null
          id?: string
          status?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_coupons_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
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
      user_swipes: {
        Row: {
          created_at: string
          filter_context: Json | null
          group_id: string | null
          id: string
          interaction_metadata: Json | null
          liked: boolean
          restaurant_id: string
          swipe_distance_km: number | null
          swipe_duration_ms: number | null
          swipe_lat: number | null
          swipe_lng: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          filter_context?: Json | null
          group_id?: string | null
          id?: string
          interaction_metadata?: Json | null
          liked: boolean
          restaurant_id: string
          swipe_distance_km?: number | null
          swipe_duration_ms?: number | null
          swipe_lat?: number | null
          swipe_lng?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          filter_context?: Json | null
          group_id?: string | null
          id?: string
          interaction_metadata?: Json | null
          liked?: boolean
          restaurant_id?: string
          swipe_distance_km?: number | null
          swipe_duration_ms?: number | null
          swipe_lat?: number | null
          swipe_lng?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_swipes_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_swipes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "popular_restaurants_7d"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_swipes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_attempts: {
        Row: {
          code_expires_at: string | null
          created_at: string | null
          email_code: string | null
          email_sent_to: string | null
          failed_reason: string | null
          google_match_score: number | null
          id: string
          restaurant_id: string
          status: string | null
          submitted_address: string | null
          submitted_phone: string | null
          updated_at: string | null
          user_id: string
          verification_method: string
          verified_at: string | null
        }
        Insert: {
          code_expires_at?: string | null
          created_at?: string | null
          email_code?: string | null
          email_sent_to?: string | null
          failed_reason?: string | null
          google_match_score?: number | null
          id?: string
          restaurant_id: string
          status?: string | null
          submitted_address?: string | null
          submitted_phone?: string | null
          updated_at?: string | null
          user_id: string
          verification_method: string
          verified_at?: string | null
        }
        Update: {
          code_expires_at?: string | null
          created_at?: string | null
          email_code?: string | null
          email_sent_to?: string | null
          failed_reason?: string | null
          google_match_score?: number | null
          id?: string
          restaurant_id?: string
          status?: string | null
          submitted_address?: string | null
          submitted_phone?: string | null
          updated_at?: string | null
          user_id?: string
          verification_method?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_attempts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "popular_restaurants_7d"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_attempts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      daily_active_users: {
        Row: {
          activity_date: string | null
          dau: number | null
        }
        Relationships: []
      }
      funnel_stats: {
        Row: {
          favorite_conversion_rate: number | null
          group_adoption_rate: number | null
          review_creation_rate: number | null
          total_swipers: number | null
          users_in_groups: number | null
          users_with_favorites: number | null
          users_with_reviews: number | null
        }
        Relationships: []
      }
      popular_restaurants_7d: {
        Row: {
          cuisine_type: string | null
          district: string | null
          favorite_rate: number | null
          id: string | null
          last_viewed_at: string | null
          name: string | null
          price_range: number | null
          total_views: number | null
          unique_viewers: number | null
        }
        Relationships: []
      }
      retention_cohorts: {
        Row: {
          cohort_date: string | null
          d7_retention_rate: number | null
          day_0_users: number | null
          day_1_users: number | null
          day_30_users: number | null
          day_7_users: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      auto_approve_pending_photos: { Args: never; Returns: undefined }
      calculate_restaurant_data_completeness: {
        Args: { p_restaurant_id: string }
        Returns: number
      }
      calculate_traffic_multiplier: {
        Args: { p_subscription_id: string }
        Returns: number
      }
      cleanup_old_interaction_data: { Args: never; Returns: undefined }
      create_default_categories: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      generate_group_code: { Args: never; Returns: string }
      get_restaurant_exposure_metrics: {
        Args: { days_back?: number; target_restaurant_id: string }
        Returns: Json
      }
      get_restaurant_stats: {
        Args: { days_back?: number; target_restaurant_id: string }
        Returns: Json
      }
      get_restaurant_trend: {
        Args: { days_back?: number; target_restaurant_id: string }
        Returns: {
          date: string
          detail_views: number
          favorites: number
          impressions: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_restaurant_view_count: {
        Args: { target_restaurant_id: string }
        Returns: undefined
      }
      update_hypothesis_value: {
        Args: { hypothesis_id_param: string; new_value: number }
        Returns: undefined
      }
      update_nag_seen: { Args: { user_uuid: string }; Returns: undefined }
      update_restaurant_exposure_multiplier: {
        Args: { p_restaurant_id: string }
        Returns: undefined
      }
      update_traffic_multiplier: {
        Args: { p_subscription_id: string; p_trigger_reason?: string }
        Returns: undefined
      }
      user_is_in_group: {
        Args: { target_group_id: string; target_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "restaurant_owner"
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
      app_role: ["admin", "moderator", "user", "restaurant_owner"],
    },
  },
} as const

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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      advertisements: {
        Row: {
          created_at: string | null
          description: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          link_text: string | null
          link_url: string | null
          media_type: string | null
          media_url: string | null
          priority: number | null
          starts_at: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          media_type?: string | null
          media_url?: string | null
          priority?: number | null
          starts_at?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          media_type?: string | null
          media_url?: string | null
          priority?: number | null
          starts_at?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      article_comments: {
        Row: {
          article_id: string
          content: string
          created_at: string | null
          id: string
          is_approved: boolean | null
          user_id: string
        }
        Insert: {
          article_id: string
          content: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          user_id: string
        }
        Update: {
          article_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_likes: {
        Row: {
          article_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          article_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_likes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_premium_content: {
        Row: {
          article_id: string
          content_de: string | null
          content_en: string | null
          content_es: string | null
          content_fr: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          article_id: string
          content_de?: string | null
          content_en?: string | null
          content_es?: string | null
          content_fr?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          article_id?: string
          content_de?: string | null
          content_en?: string | null
          content_es?: string | null
          content_fr?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_premium_content_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: true
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_purchases: {
        Row: {
          amount: number
          article_id: string
          created_at: string | null
          id: string
          payment_id: string | null
          purchased_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          article_id: string
          created_at?: string | null
          id?: string
          payment_id?: string | null
          purchased_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          article_id?: string
          created_at?: string | null
          id?: string
          payment_id?: string | null
          purchased_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_purchases_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_purchases_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      article_reactions: {
        Row: {
          article_id: string
          created_at: string | null
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string | null
          id?: string
          reaction_type: string
          user_id: string
        }
        Update: {
          article_id?: string
          created_at?: string | null
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_reactions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_share_counts: {
        Row: {
          article_id: string
          facebook: number | null
          linkedin: number | null
          telegram: number | null
          total: number | null
          twitter: number | null
          updated_at: string | null
          whatsapp: number | null
        }
        Insert: {
          article_id: string
          facebook?: number | null
          linkedin?: number | null
          telegram?: number | null
          total?: number | null
          twitter?: number | null
          updated_at?: string | null
          whatsapp?: number | null
        }
        Update: {
          article_id?: string
          facebook?: number | null
          linkedin?: number | null
          telegram?: number | null
          total?: number | null
          twitter?: number | null
          updated_at?: string | null
          whatsapp?: number | null
        }
        Relationships: []
      }
      articles: {
        Row: {
          author_id: string
          category: string | null
          content_de: string | null
          content_en: string | null
          content_es: string | null
          content_fr: string | null
          cover_image: string | null
          created_at: string | null
          excerpt_de: string | null
          excerpt_en: string | null
          excerpt_es: string | null
          excerpt_fr: string | null
          id: string
          is_premium: boolean | null
          likes: number | null
          media: Json | null
          price: number | null
          published_at: string | null
          rejection_reason: string | null
          status: string | null
          title_de: string
          title_en: string
          title_es: string
          title_fr: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          author_id: string
          category?: string | null
          content_de?: string | null
          content_en?: string | null
          content_es?: string | null
          content_fr?: string | null
          cover_image?: string | null
          created_at?: string | null
          excerpt_de?: string | null
          excerpt_en?: string | null
          excerpt_es?: string | null
          excerpt_fr?: string | null
          id?: string
          is_premium?: boolean | null
          likes?: number | null
          media?: Json | null
          price?: number | null
          published_at?: string | null
          rejection_reason?: string | null
          status?: string | null
          title_de: string
          title_en: string
          title_es: string
          title_fr: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          author_id?: string
          category?: string | null
          content_de?: string | null
          content_en?: string | null
          content_es?: string | null
          content_fr?: string | null
          cover_image?: string | null
          created_at?: string | null
          excerpt_de?: string | null
          excerpt_en?: string | null
          excerpt_es?: string | null
          excerpt_fr?: string | null
          id?: string
          is_premium?: boolean | null
          likes?: number | null
          media?: Json | null
          price?: number | null
          published_at?: string | null
          rejection_reason?: string | null
          status?: string | null
          title_de?: string
          title_en?: string
          title_es?: string
          title_fr?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          clicks: number | null
          content: Json | null
          created_at: string | null
          end_date: string | null
          id: string
          impressions: number | null
          is_active: boolean | null
          name: string
          start_date: string | null
          target_audience: string | null
          type: string | null
        }
        Insert: {
          clicks?: number | null
          content?: Json | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          impressions?: number | null
          is_active?: boolean | null
          name: string
          start_date?: string | null
          target_audience?: string | null
          type?: string | null
        }
        Update: {
          clicks?: number | null
          content?: Json | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          impressions?: number | null
          is_active?: boolean | null
          name?: string
          start_date?: string | null
          target_audience?: string | null
          type?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          quantity: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          quantity?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          quantity?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          name_de: string
          name_en: string
          name_es: string
          name_fr: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          name_de: string
          name_en: string
          name_es: string
          name_fr: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          name_de?: string
          name_en?: string
          name_es?: string
          name_fr?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_availability: {
        Row: {
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          notes: string | null
          reason: string
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          reason: string
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          reason?: string
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      commercial_zones: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          user_id: string
          zone_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          user_id: string
          zone_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          user_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_zones_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          commission_amount: number
          commission_rate: number | null
          created_at: string | null
          id: string
          order_id: string | null
          order_item_id: string | null
          paid_at: string | null
          sale_amount: number
          status: string | null
          vendor_id: string
        }
        Insert: {
          commission_amount: number
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          order_item_id?: string | null
          paid_at?: string | null
          sale_amount: number
          status?: string | null
          vendor_id: string
        }
        Update: {
          commission_amount?: number
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          order_item_id?: string | null
          paid_at?: string | null
          sale_amount?: number
          status?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          created_at: string | null
          discount_amount: number | null
          id: string
          order_id: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          order_id?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          order_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          discount_amount: number | null
          discount_percent: number | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_amount: number | null
          used_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      delivery_proofs: {
        Row: {
          created_at: string | null
          delivery_user_id: string
          id: string
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          notes: string | null
          order_id: string
          proof_type: string
          recipient_cni_photo_url: string | null
          recipient_name: string | null
          recipient_photo_url: string | null
          signature_url: string | null
          timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_user_id: string
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          order_id: string
          proof_type: string
          recipient_cni_photo_url?: string | null
          recipient_name?: string | null
          recipient_photo_url?: string | null
          signature_url?: string | null
          timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_user_id?: string
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          order_id?: string
          proof_type?: string
          recipient_cni_photo_url?: string | null
          recipient_name?: string | null
          recipient_photo_url?: string | null
          signature_url?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_proofs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      educational_content: {
        Row: {
          author_id: string
          content_type: string
          created_at: string | null
          description: string | null
          downloads: number | null
          file_url: string | null
          grade_level: string | null
          id: string
          is_approved: boolean | null
          is_free: boolean | null
          preview_url: string | null
          price: number | null
          rating_avg: number | null
          rating_count: number | null
          subject: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content_type?: string
          created_at?: string | null
          description?: string | null
          downloads?: number | null
          file_url?: string | null
          grade_level?: string | null
          id?: string
          is_approved?: boolean | null
          is_free?: boolean | null
          preview_url?: string | null
          price?: number | null
          rating_avg?: number | null
          rating_count?: number | null
          subject?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content_type?: string
          created_at?: string | null
          description?: string | null
          downloads?: number | null
          file_url?: string | null
          grade_level?: string | null
          id?: string
          is_approved?: boolean | null
          is_free?: boolean | null
          preview_url?: string | null
          price?: number | null
          rating_avg?: number | null
          rating_count?: number | null
          subject?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      educational_content_files: {
        Row: {
          content_id: string
          created_at: string
          file_url: string
          updated_at: string
        }
        Insert: {
          content_id: string
          created_at?: string
          file_url: string
          updated_at?: string
        }
        Update: {
          content_id?: string
          created_at?: string
          file_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "educational_content_files_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: true
            referencedRelation: "educational_content"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaign_logs: {
        Row: {
          attempt_count: number
          bounced_at: string | null
          campaign_id: string | null
          clicked_at: string | null
          complained_at: string | null
          created_at: string
          dedupe_key: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          last_error_code: string | null
          metadata: Json
          next_retry_at: string | null
          opened_at: string | null
          provider: string | null
          provider_message_id: string | null
          recipient_email: string
          resend_id: string | null
          retryable: boolean
          sent_at: string
          status: string
        }
        Insert: {
          attempt_count?: number
          bounced_at?: string | null
          campaign_id?: string | null
          clicked_at?: string | null
          complained_at?: string | null
          created_at?: string
          dedupe_key?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          last_error_code?: string | null
          metadata?: Json
          next_retry_at?: string | null
          opened_at?: string | null
          provider?: string | null
          provider_message_id?: string | null
          recipient_email: string
          resend_id?: string | null
          retryable?: boolean
          sent_at?: string
          status: string
        }
        Update: {
          attempt_count?: number
          bounced_at?: string | null
          campaign_id?: string | null
          clicked_at?: string | null
          complained_at?: string | null
          created_at?: string
          dedupe_key?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          last_error_code?: string | null
          metadata?: Json
          next_retry_at?: string | null
          opened_at?: string | null
          provider?: string | null
          provider_message_id?: string | null
          recipient_email?: string
          resend_id?: string | null
          retryable?: boolean
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          bounced_count: number
          clicked_count: number
          complained_count: number
          created_at: string
          created_by: string | null
          delivered_count: number
          failed_count: number | null
          from_email: string | null
          from_name: string | null
          html_content: string
          id: string
          image_url: string | null
          name: string
          opened_count: number
          preheader: string | null
          recipients_count: number | null
          scheduled_at: string | null
          segment_filters: Json
          segment_type: string
          sent_at: string | null
          sent_count: number | null
          status: string
          subject: string
          template_type: string | null
          updated_at: string
        }
        Insert: {
          bounced_count?: number
          clicked_count?: number
          complained_count?: number
          created_at?: string
          created_by?: string | null
          delivered_count?: number
          failed_count?: number | null
          from_email?: string | null
          from_name?: string | null
          html_content: string
          id?: string
          image_url?: string | null
          name: string
          opened_count?: number
          preheader?: string | null
          recipients_count?: number | null
          scheduled_at?: string | null
          segment_filters?: Json
          segment_type?: string
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          subject: string
          template_type?: string | null
          updated_at?: string
        }
        Update: {
          bounced_count?: number
          clicked_count?: number
          complained_count?: number
          created_at?: string
          created_by?: string | null
          delivered_count?: number
          failed_count?: number | null
          from_email?: string | null
          from_name?: string | null
          html_content?: string
          id?: string
          image_url?: string | null
          name?: string
          opened_count?: number
          preheader?: string | null
          recipients_count?: number | null
          scheduled_at?: string | null
          segment_filters?: Json
          segment_type?: string
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          subject?: string
          template_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          attempt_count: number
          created_at: string
          dedupe_key: string | null
          delivered_at: string | null
          email_category: string | null
          email_type: string
          error_message: string | null
          id: string
          last_attempt_at: string | null
          last_error_code: string | null
          metadata: Json
          next_retry_at: string | null
          order_id: string | null
          provider: string | null
          provider_message_id: string | null
          recipient_email: string
          retryable: boolean
          sent_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          dedupe_key?: string | null
          delivered_at?: string | null
          email_category?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          last_error_code?: string | null
          metadata?: Json
          next_retry_at?: string | null
          order_id?: string | null
          provider?: string | null
          provider_message_id?: string | null
          recipient_email: string
          retryable?: boolean
          sent_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          dedupe_key?: string | null
          delivered_at?: string | null
          email_category?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          last_error_code?: string | null
          metadata?: Json
          next_retry_at?: string | null
          order_id?: string | null
          provider?: string | null
          provider_message_id?: string | null
          recipient_email?: string
          retryable?: boolean
          sent_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      email_provider_daily_stats: {
        Row: {
          failed_count: number
          provider: string
          sent_count: number
          stat_date: string
          updated_at: string
        }
        Insert: {
          failed_count?: number
          provider: string
          sent_count?: number
          stat_date: string
          updated_at?: string
        }
        Update: {
          failed_count?: number
          provider?: string
          sent_count?: number
          stat_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      faq: {
        Row: {
          answer_en: string | null
          answer_fr: string
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          question_en: string | null
          question_fr: string
          sort_order: number | null
        }
        Insert: {
          answer_en?: string | null
          answer_fr: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question_en?: string | null
          question_fr: string
          sort_order?: number | null
        }
        Update: {
          answer_en?: string | null
          answer_fr?: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question_en?: string | null
          question_fr?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      internal_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          parent_id: string | null
          recipient_id: string
          sender_id: string
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          parent_id?: string | null
          recipient_id: string
          sender_id: string
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          parent_id?: string | null
          recipient_id?: string
          sender_id?: string
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "internal_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "internal_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      login_sessions: {
        Row: {
          confirmed_at: string | null
          created_at: string | null
          device_info: string | null
          expires_at: string | null
          id: string
          ip_address: string | null
          is_blocked: boolean | null
          is_confirmed: boolean | null
          user_id: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string | null
          device_info?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_blocked?: boolean | null
          is_confirmed?: boolean | null
          user_id: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string | null
          device_info?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_blocked?: boolean | null
          is_confirmed?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      loyalty_rewards: {
        Row: {
          coupon_code: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_used: boolean | null
          points_spent: number
          reward_type: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          points_spent: number
          reward_type: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          coupon_code?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          points_spent?: number
          reward_type?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      moderator_notes: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          is_resolved: boolean | null
          moderator_id: string
          note: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_resolved?: boolean | null
          moderator_id: string
          note: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_resolved?: boolean | null
          moderator_id?: string
          note?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          confirmation_sent_at: string | null
          confirmation_token_hash: string | null
          confirmed: boolean
          confirmed_at: string | null
          email: string
          first_name: string | null
          id: string
          is_active: boolean
          source: string | null
          subscribed_at: string
          unsubscribe_token_hash: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          confirmation_sent_at?: string | null
          confirmation_token_hash?: string | null
          confirmed?: boolean
          confirmed_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          source?: string | null
          subscribed_at?: string
          unsubscribe_token_hash?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          confirmation_sent_at?: string | null
          confirmation_token_hash?: string | null
          confirmed?: boolean
          confirmed_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          source?: string | null
          subscribed_at?: string
          unsubscribe_token_hash?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          kit_id: string | null
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          id?: string
          kit_id?: string | null
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          id?: string
          kit_id?: string | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "smart_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_reassignments: {
        Row: {
          created_at: string
          from_user_id: string | null
          id: string
          order_id: string
          reason: string | null
          reassigned_by: string | null
          to_user_id: string | null
        }
        Insert: {
          created_at?: string
          from_user_id?: string | null
          id?: string
          order_id: string
          reason?: string | null
          reassigned_by?: string | null
          to_user_id?: string | null
        }
        Update: {
          created_at?: string
          from_user_id?: string | null
          id?: string
          order_id?: string
          reason?: string | null
          reassigned_by?: string | null
          to_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_reassignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          assigned_at: string | null
          coupon_code: string | null
          created_at: string | null
          customer_confirmed_at: string | null
          delivery_delivered_at: string | null
          delivery_notes: string | null
          delivery_received_at: string | null
          delivery_user_id: string | null
          discount_amount: number | null
          id: string
          notes: string | null
          payment_method: string | null
          payment_reference: string | null
          phone: string | null
          reassignment_count: number
          shipping_address: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
          zone_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          coupon_code?: string | null
          created_at?: string | null
          customer_confirmed_at?: string | null
          delivery_delivered_at?: string | null
          delivery_notes?: string | null
          delivery_received_at?: string | null
          delivery_user_id?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          phone?: string | null
          reassignment_count?: number
          shipping_address?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
          zone_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          coupon_code?: string | null
          created_at?: string | null
          customer_confirmed_at?: string | null
          delivery_delivered_at?: string | null
          delivery_notes?: string | null
          delivery_received_at?: string | null
          delivery_user_id?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          phone?: string | null
          reassignment_count?: number
          shipping_address?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          order_id: string | null
          payment_method: string
          payment_reference: string | null
          phone_number: string | null
          status: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payment_method: string
          payment_reference?: string | null
          phone_number?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payment_method?: string
          payment_reference?: string | null
          phone_number?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          author_details: string | null
          author_name: string | null
          brand: string | null
          category_id: string
          color: string | null
          created_at: string | null
          description_de: string | null
          description_en: string | null
          description_es: string | null
          description_fr: string | null
          dimensions: string | null
          discount_percent: number | null
          education_level: string | null
          education_series: string | null
          flash_deal_ends_at: string | null
          free_shipping: boolean | null
          id: string
          image_url: string | null
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          is_office_supply: boolean | null
          material: string | null
          metadata: Json
          model: string | null
          name_de: string
          name_en: string
          name_es: string
          name_fr: string
          original_price: number | null
          price: number
          product_genre: string | null
          product_type: string | null
          stock: number | null
          subject: string | null
          updated_at: string | null
          vendor_id: string | null
          views: number
        }
        Insert: {
          author_details?: string | null
          author_name?: string | null
          brand?: string | null
          category_id: string
          color?: string | null
          created_at?: string | null
          description_de?: string | null
          description_en?: string | null
          description_es?: string | null
          description_fr?: string | null
          dimensions?: string | null
          discount_percent?: number | null
          education_level?: string | null
          education_series?: string | null
          flash_deal_ends_at?: string | null
          free_shipping?: boolean | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_office_supply?: boolean | null
          material?: string | null
          metadata?: Json
          model?: string | null
          name_de: string
          name_en: string
          name_es: string
          name_fr: string
          original_price?: number | null
          price: number
          product_genre?: string | null
          product_type?: string | null
          stock?: number | null
          subject?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          views?: number
        }
        Update: {
          author_details?: string | null
          author_name?: string | null
          brand?: string | null
          category_id?: string
          color?: string | null
          created_at?: string | null
          description_de?: string | null
          description_en?: string | null
          description_es?: string | null
          description_fr?: string | null
          dimensions?: string | null
          discount_percent?: number | null
          education_level?: string | null
          education_series?: string | null
          flash_deal_ends_at?: string | null
          free_shipping?: boolean | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_office_supply?: boolean | null
          material?: string | null
          metadata?: Json
          model?: string | null
          name_de?: string
          name_en?: string
          name_es?: string
          name_fr?: string
          original_price?: number | null
          price?: number
          product_genre?: string | null
          product_type?: string | null
          stock?: number | null
          subject?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          is_available: boolean
          last_name: string | null
          phone: string | null
          preferred_language: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          is_available?: boolean
          last_name?: string | null
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_available?: boolean
          last_name?: string | null
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          applies_to: string | null
          created_at: string | null
          current_uses: number | null
          description: string | null
          discount_type: string | null
          discount_value: number
          end_date: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_amount: number | null
          name: string
          start_date: string | null
        }
        Insert: {
          applies_to?: string | null
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string | null
          discount_value: number
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_amount?: number | null
          name: string
          start_date?: string | null
        }
        Update: {
          applies_to?: string | null
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_amount?: number | null
          name?: string
          start_date?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action_type: string
          attempts: number | null
          blocked_until: string | null
          first_attempt_at: string | null
          id: string
          identifier: string
          last_attempt_at: string | null
        }
        Insert: {
          action_type: string
          attempts?: number | null
          blocked_until?: string | null
          first_attempt_at?: string | null
          id?: string
          identifier: string
          last_attempt_at?: string | null
        }
        Update: {
          action_type?: string
          attempts?: number | null
          blocked_until?: string | null
          first_attempt_at?: string | null
          id?: string
          identifier?: string
          last_attempt_at?: string | null
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          amount: number
          claimed_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_claimed: boolean | null
          referral_id: string
          reward_type: string
          user_id: string
        }
        Insert: {
          amount?: number
          claimed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_claimed?: boolean | null
          referral_id: string
          reward_type?: string
          user_id: string
        }
        Update: {
          amount?: number
          claimed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_claimed?: boolean | null
          referral_id?: string
          reward_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          referral_code: string
          referred_id: string | null
          referrer_id: string
          reward_given: boolean | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          referral_code: string
          referred_id?: string | null
          referrer_id: string
          reward_given?: boolean | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          referral_code?: string
          referred_id?: string | null
          referrer_id?: string
          reward_given?: boolean | null
          status?: string | null
        }
        Relationships: []
      }
      resources: {
        Row: {
          author_id: string | null
          category: Database["public"]["Enums"]["resource_category"]
          created_at: string | null
          description_de: string | null
          description_en: string | null
          description_es: string | null
          description_fr: string | null
          downloads: number | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          grade_level: string | null
          id: string
          is_free: boolean | null
          price: number | null
          subject: string | null
          title_de: string
          title_en: string
          title_es: string
          title_fr: string
        }
        Insert: {
          author_id?: string | null
          category: Database["public"]["Enums"]["resource_category"]
          created_at?: string | null
          description_de?: string | null
          description_en?: string | null
          description_es?: string | null
          description_fr?: string | null
          downloads?: number | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          grade_level?: string | null
          id?: string
          is_free?: boolean | null
          price?: number | null
          subject?: string | null
          title_de: string
          title_en: string
          title_es: string
          title_fr: string
        }
        Update: {
          author_id?: string | null
          category?: Database["public"]["Enums"]["resource_category"]
          created_at?: string | null
          description_de?: string | null
          description_en?: string | null
          description_es?: string | null
          description_fr?: string | null
          downloads?: number | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          grade_level?: string | null
          id?: string
          is_free?: boolean | null
          price?: number | null
          subject?: string | null
          title_de?: string
          title_en?: string
          title_es?: string
          title_fr?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          product_id: string
          rating: number | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          product_id: string
          rating?: number | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          product_id?: string
          rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          action: string
          created_at: string
          id: string
          module: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          action?: string
          created_at?: string
          id?: string
          module: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          module?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      school_loyalty: {
        Row: {
          created_at: string | null
          id: string
          school_id: string
          tier: string | null
          total_orders: number | null
          total_points: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          school_id: string
          tier?: string | null
          total_orders?: number | null
          total_points?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          school_id?: string
          tier?: string | null
          total_orders?: number | null
          total_points?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_loyalty_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "public_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_loyalty_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_loyalty_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools_public"
            referencedColumns: ["id"]
          },
        ]
      }
      school_supply_items: {
        Row: {
          id: string
          is_required: boolean | null
          item_name: string
          list_id: string
          notes: string | null
          product_id: string | null
          quantity: number
          sort_order: number | null
        }
        Insert: {
          id?: string
          is_required?: boolean | null
          item_name: string
          list_id: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          sort_order?: number | null
        }
        Update: {
          id?: string
          is_required?: boolean | null
          item_name?: string
          list_id?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "school_supply_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "school_supply_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_supply_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      school_supply_lists: {
        Row: {
          created_at: string | null
          created_by: string
          grade_level: string
          id: string
          is_published: boolean | null
          name: string
          school_id: string
          school_year: string
          series: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          grade_level: string
          id?: string
          is_published?: boolean | null
          name: string
          school_id: string
          school_year?: string
          series?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          grade_level?: string
          id?: string
          is_published?: boolean | null
          name?: string
          school_id?: string
          school_year?: string
          series?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_supply_lists_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "public_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_supply_lists_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_supply_lists_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_public"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          admin_user_id: string | null
          city: string | null
          code: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          name: string
          phone: string | null
          region: string | null
          student_count: number | null
          type: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          admin_user_id?: string | null
          city?: string | null
          code?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          name: string
          phone?: string | null
          region?: string | null
          student_count?: number | null
          type?: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          admin_user_id?: string | null
          city?: string | null
          code?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          region?: string | null
          student_count?: number | null
          type?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      security_access_log: {
        Row: {
          action: string
          actor_id: string | null
          allowed: boolean
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          reason: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          allowed?: boolean
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          reason?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          allowed?: boolean
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          reason?: string | null
        }
        Relationships: []
      }
      smart_kit_items: {
        Row: {
          category_hint: string | null
          estimated_price: number
          id: string
          is_optional: boolean
          is_required: boolean | null
          item_name: string
          kit_id: string
          product_id: string | null
          quantity: number
          sort_order: number | null
        }
        Insert: {
          category_hint?: string | null
          estimated_price?: number
          id?: string
          is_optional?: boolean
          is_required?: boolean | null
          item_name: string
          kit_id: string
          product_id?: string | null
          quantity?: number
          sort_order?: number | null
        }
        Update: {
          category_hint?: string | null
          estimated_price?: number
          id?: string
          is_optional?: boolean
          is_required?: boolean | null
          item_name?: string
          kit_id?: string
          product_id?: string | null
          quantity?: number
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_kit_items_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "smart_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_kit_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_kits: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          discount_price: number | null
          grade_level: string
          id: string
          image_url: string | null
          is_active: boolean | null
          kind: string
          name: string
          options: string | null
          product_id: string | null
          published_at: string | null
          school_id: string | null
          school_type: string | null
          series: string | null
          status: string
          total_price: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_price?: number | null
          grade_level: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          kind?: string
          name: string
          options?: string | null
          product_id?: string | null
          published_at?: string | null
          school_id?: string | null
          school_type?: string | null
          series?: string | null
          status?: string
          total_price?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_price?: number | null
          grade_level?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          kind?: string
          name?: string
          options?: string | null
          product_id?: string | null
          published_at?: string | null
          school_id?: string | null
          school_type?: string | null
          series?: string | null
          status?: string
          total_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_kits_created_by_profiles_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_kits_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_kits_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "public_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_kits_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_kits_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_public"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          is_active: boolean
          key: string
          label: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          label: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      user_addresses: {
        Row: {
          address: string
          city: string
          created_at: string | null
          id: string
          is_default: boolean
          name: string
          phone: string | null
          region: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string | null
          id?: string
          is_default?: boolean
          name: string
          phone?: string | null
          region: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string | null
          id?: string
          is_default?: boolean
          name?: string
          phone?: string | null
          region?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_settings: {
        Row: {
          address: string | null
          banner_url: string | null
          city: string | null
          commission_rate: number | null
          created_at: string | null
          id: string
          is_verified: boolean | null
          logo_url: string | null
          pending_payout: number | null
          phone: string | null
          store_description: string | null
          store_name: string
          total_earnings: number | null
          total_sales: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          banner_url?: string | null
          city?: string | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          pending_payout?: number | null
          phone?: string | null
          store_description?: string | null
          store_name: string
          total_earnings?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          banner_url?: string | null
          city?: string | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          pending_payout?: number | null
          phone?: string | null
          store_description?: string | null
          store_name?: string
          total_earnings?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      view_tracking: {
        Row: {
          entity_id: string
          entity_type: string
          id: string
          session_fingerprint: string
          viewed_at: string
        }
        Insert: {
          entity_id: string
          entity_type: string
          id?: string
          session_fingerprint: string
          viewed_at?: string
        }
        Update: {
          entity_id?: string
          entity_type?: string
          id?: string
          session_fingerprint?: string
          viewed_at?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_details: Json | null
          payment_method: string | null
          processed_at: string | null
          processed_by: string | null
          rejection_reason: string | null
          status: string
          updated_at: string
          user_id: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: []
      }
      zones: {
        Row: {
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          level: string
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          level: string
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          level?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "zones_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      promotions_public: {
        Row: {
          applies_to: string | null
          description: string | null
          discount_type: string | null
          discount_value: number | null
          end_date: string | null
          id: string | null
          is_active: boolean | null
          min_amount: number | null
          name: string | null
          start_date: string | null
        }
        Insert: {
          applies_to?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          end_date?: string | null
          id?: string | null
          is_active?: boolean | null
          min_amount?: number | null
          name?: string | null
          start_date?: string | null
        }
        Update: {
          applies_to?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          end_date?: string | null
          id?: string | null
          is_active?: boolean | null
          min_amount?: number | null
          name?: string | null
          start_date?: string | null
        }
        Relationships: []
      }
      public_schools: {
        Row: {
          city: string | null
          code: string | null
          id: string | null
          logo_url: string | null
          name: string | null
          region: string | null
          type: string | null
        }
        Insert: {
          city?: string | null
          code?: string | null
          id?: string | null
          logo_url?: string | null
          name?: string | null
          region?: string | null
          type?: string | null
        }
        Update: {
          city?: string | null
          code?: string | null
          id?: string | null
          logo_url?: string | null
          name?: string | null
          region?: string | null
          type?: string | null
        }
        Relationships: []
      }
      schools_public: {
        Row: {
          address: string | null
          city: string | null
          code: string | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          name: string | null
          region: string | null
          student_count: number | null
          type: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string | null
          region?: string | null
          student_count?: number | null
          type?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string | null
          region?: string | null
          student_count?: number | null
          type?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      vendor_public_info: {
        Row: {
          banner_url: string | null
          city: string | null
          id: string | null
          is_verified: boolean | null
          logo_url: string | null
          store_description: string | null
          store_name: string | null
          user_id: string | null
        }
        Insert: {
          banner_url?: string | null
          city?: string | null
          id?: string | null
          is_verified?: boolean | null
          logo_url?: string | null
          store_description?: string | null
          store_name?: string | null
          user_id?: string | null
        }
        Update: {
          banner_url?: string | null
          city?: string | null
          id?: string | null
          is_verified?: boolean | null
          logo_url?: string | null
          store_description?: string | null
          store_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      auto_confirm_newsletter_subscriber: {
        Args: { _subscriber_id: string }
        Returns: {
          confirmation_sent_at: string | null
          confirmation_token_hash: string | null
          confirmed: boolean
          confirmed_at: string | null
          email: string
          first_name: string | null
          id: string
          is_active: boolean
          source: string | null
          subscribed_at: string
          unsubscribe_token_hash: string | null
          unsubscribed_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "newsletter_subscribers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      can_manage_module: {
        Args: { _action?: string; _module: string; _user_id: string }
        Returns: boolean
      }
      check_password_strength: { Args: { _password: string }; Returns: boolean }
      check_rate_limit: {
        Args: {
          _action_type: string
          _block_seconds?: number
          _identifier: string
          _max_attempts?: number
          _window_seconds?: number
        }
        Returns: {
          allowed: boolean
          blocked_until: string
          remaining_attempts: number
        }[]
      }
      cleanup_expired_data: { Args: never; Returns: undefined }
      cleanup_old_login_sessions: { Args: never; Returns: undefined }
      cleanup_old_view_tracking: { Args: never; Returns: undefined }
      confirm_newsletter_subscription: {
        Args: { _token: string }
        Returns: {
          email: string
          success: boolean
        }[]
      }
      confirm_order_receipt: { Args: { _order_id: string }; Returns: boolean }
      delivery_mark_picked_up: { Args: { _order_id: string }; Returns: boolean }
      delivery_submit_handoff: { Args: { _order_id: string }; Returns: boolean }
      finalize_campaign_email_log: {
        Args: {
          _attempt_count?: number
          _campaign_id: string
          _dedupe_key: string
          _error_message?: string
          _metadata?: Json
          _provider: string
          _provider_message_id?: string
          _recipient_email: string
          _retryable?: boolean
          _status: string
        }
        Returns: {
          attempt_count: number
          bounced_at: string | null
          campaign_id: string | null
          clicked_at: string | null
          complained_at: string | null
          created_at: string
          dedupe_key: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          last_error_code: string | null
          metadata: Json
          next_retry_at: string | null
          opened_at: string | null
          provider: string | null
          provider_message_id: string | null
          recipient_email: string
          resend_id: string | null
          retryable: boolean
          sent_at: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "email_campaign_logs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      finalize_email_log: {
        Args: {
          _attempt_increment?: number
          _error_message?: string
          _log_id: string
          _metadata_patch?: Json
          _provider: string
          _provider_message_id?: string
          _retryable?: boolean
          _status: string
        }
        Returns: {
          attempt_count: number
          created_at: string
          dedupe_key: string | null
          delivered_at: string | null
          email_category: string | null
          email_type: string
          error_message: string | null
          id: string
          last_attempt_at: string | null
          last_error_code: string | null
          metadata: Json
          next_retry_at: string | null
          order_id: string | null
          provider: string | null
          provider_message_id: string | null
          recipient_email: string
          retryable: boolean
          sent_at: string | null
          status: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "email_logs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      generate_referral_code: { Args: never; Returns: string }
      get_admin_stats: {
        Args: never
        Returns: {
          monthly_revenue: number
          pending_orders: number
          total_articles: number
          total_orders: number
          total_products: number
          total_revenue: number
          total_users: number
        }[]
      }
      get_article_content: {
        Args: { _article_id: string }
        Returns: {
          content_de: string
          content_en: string
          content_es: string
          content_fr: string
        }[]
      }
      get_article_premium_content: {
        Args: { _article_id: string }
        Returns: {
          content_de: string
          content_en: string
          content_es: string
          content_fr: string
        }[]
      }
      get_campaign_analytics: {
        Args: never
        Returns: {
          bounce_rate: number
          bounced_count: number
          campaign_id: string
          click_rate: number
          clicked_count: number
          complained_count: number
          delivered_count: number
          delivery_rate: number
          failed_count: number
          name: string
          open_rate: number
          opened_count: number
          recipients_count: number
          sent_at: string
          sent_count: number
          status: string
          subject: string
        }[]
      }
      get_delivery_orders: {
        Args: { _delivery_user_id: string }
        Returns: {
          assigned_at: string | null
          coupon_code: string | null
          created_at: string | null
          customer_confirmed_at: string | null
          delivery_delivered_at: string | null
          delivery_notes: string | null
          delivery_received_at: string | null
          delivery_user_id: string | null
          discount_amount: number | null
          id: string
          notes: string | null
          payment_method: string | null
          payment_reference: string | null
          phone: string | null
          reassignment_count: number
          shipping_address: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
          zone_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_delivery_stats: {
        Args: { _delivery_user_id: string }
        Returns: {
          delivered: number
          in_transit: number
          pending_pickup: number
          total_assigned: number
        }[]
      }
      get_educational_content_file_url: {
        Args: { _content_id: string }
        Returns: string
      }
      get_email_provider_daily_stats: {
        Args: never
        Returns: {
          failed_count: number
          provider: string
          sent_count: number
          stat_date: string
          updated_at: string
        }[]
      }
      get_email_segment_recipients: {
        Args: { _filters?: Json; _segment_type: string }
        Returns: {
          first_name: string
          metadata: Json
          recipient_email: string
          source_id: string
          source_table: string
        }[]
      }
      get_failed_emails_for_retry: {
        Args: { _limit?: number }
        Returns: {
          attempt_count: number
          campaign_id: string
          dedupe_key: string
          email_category: string
          email_type: string
          log_id: string
          metadata: Json
          recipient_email: string
          source: string
        }[]
      }
      get_provider_quota_status: {
        Args: never
        Returns: {
          daily_limit: number
          failed_today: number
          provider: string
          remaining: number
          sent_today: number
          usage_pct: number
        }[]
      }
      get_public_runtime_settings: {
        Args: never
        Returns: {
          key: string
          value: string
        }[]
      }
      get_referral_balance: {
        Args: { _user_id: string }
        Returns: {
          available: number
          total_earned: number
          total_withdrawn: number
        }[]
      }
      get_resource_file_url: { Args: { _resource_id: string }; Returns: string }
      get_school_contact: {
        Args: { _school_id: string }
        Returns: {
          address: string
          email: string
          phone: string
        }[]
      }
      get_share_stats: {
        Args: { _end_date?: string; _start_date?: string }
        Returns: {
          article_id: string
          facebook: number
          linkedin: number
          telegram: number
          title_fr: string
          total: number
          twitter: number
          whatsapp: number
        }[]
      }
      get_user_loyalty_points: {
        Args: never
        Returns: {
          available: number
          total_earned: number
          total_spent: number
        }[]
      }
      has_permission: {
        Args: { _action?: string; _module: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_article_share: {
        Args: { _article_id: string; _platform: string }
        Returns: {
          article_id: string
          facebook: number | null
          linkedin: number | null
          telegram: number | null
          total: number | null
          twitter: number | null
          updated_at: string | null
          whatsapp: number | null
        }
        SetofOptions: {
          from: "*"
          to: "article_share_counts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      increment_article_views: {
        Args: { _article_id: string }
        Returns: undefined
      }
      increment_email_provider_stat: {
        Args: { _provider: string; _success: boolean }
        Returns: undefined
      }
      increment_product_views: {
        Args: { _product_id: string }
        Returns: undefined
      }
      log_sensitive_access: {
        Args: {
          _action: string
          _allowed?: boolean
          _entity_id?: string
          _entity_type: string
          _metadata?: Json
          _reason?: string
        }
        Returns: undefined
      }
      pick_available_commercial: { Args: { _zone_id: string }; Returns: string }
      redeem_loyalty_points: {
        Args: { _points_required: number; _reward_type: string }
        Returns: {
          coupon_code: string
          message: string
          reward_id: string
          success: boolean
        }[]
      }
      reserve_email_log: {
        Args: {
          _dedupe_key: string
          _email_category?: string
          _email_type: string
          _metadata?: Json
          _order_id?: string
          _recipient_email: string
        }
        Returns: {
          attempt_count: number
          created_at: string
          dedupe_key: string | null
          delivered_at: string | null
          email_category: string | null
          email_type: string
          error_message: string | null
          id: string
          last_attempt_at: string | null
          last_error_code: string | null
          metadata: Json
          next_retry_at: string | null
          order_id: string | null
          provider: string | null
          provider_message_id: string | null
          recipient_email: string
          retryable: boolean
          sent_at: string | null
          status: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "email_logs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      revoke_blocked_session: {
        Args: { _session_id: string }
        Returns: boolean
      }
      schedule_email_retry: {
        Args: {
          _attempt: number
          _error?: string
          _log_id: string
          _source: string
        }
        Returns: undefined
      }
      scoly_suggest_category_id: {
        Args: {
          p_description?: string
          p_education_level?: string
          p_name: string
          p_product_type?: string
          p_subject?: string
        }
        Returns: string
      }
      unaccent_immutable: { Args: { txt: string }; Returns: string }
      unsubscribe_newsletter: { Args: { _token: string }; Returns: boolean }
      update_campaign_event_counts: {
        Args: { _event: string; _provider_message_id: string }
        Returns: undefined
      }
      validate_coupon: {
        Args: { _code: string; _order_total: number }
        Returns: {
          coupon_id: string
          discount_amount: number
          discount_percent: number
          discount_value: number
        }[]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "vendor"
        | "delivery"
        | "super_admin"
        | "commercial"
        | "comptable"
        | "referent"
      order_status:
        | "pending"
        | "confirmed"
        | "shipped"
        | "delivered"
        | "cancelled"
      resource_category: "secondary" | "university"
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
      app_role: [
        "admin",
        "moderator",
        "user",
        "vendor",
        "delivery",
        "super_admin",
        "commercial",
        "comptable",
        "referent",
      ],
      order_status: [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
      ],
      resource_category: ["secondary", "university"],
    },
  },
} as const

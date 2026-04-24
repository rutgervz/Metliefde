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
      categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          entity_id: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          entity_id?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          entity_id?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "v_workload_by_entity"
            referencedColumns: ["entity_id"]
          },
        ]
      }
      entities: {
        Row: {
          active: boolean
          color: string
          created_at: string
          default_requires_dual_approval: boolean
          drive_folder_id: string | null
          id: string
          is_vat_deductible: boolean
          kvk_number: string | null
          legal_name: string | null
          name: string
          notes: string | null
          owner_sphere: Database["public"]["Enums"]["owner_sphere"]
          sort_order: number
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          default_requires_dual_approval?: boolean
          drive_folder_id?: string | null
          id?: string
          is_vat_deductible?: boolean
          kvk_number?: string | null
          legal_name?: string | null
          name: string
          notes?: string | null
          owner_sphere: Database["public"]["Enums"]["owner_sphere"]
          sort_order?: number
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          default_requires_dual_approval?: boolean
          drive_folder_id?: string | null
          id?: string
          is_vat_deductible?: boolean
          kvk_number?: string | null
          legal_name?: string | null
          name?: string
          notes?: string | null
          owner_sphere?: Database["public"]["Enums"]["owner_sphere"]
          sort_order?: number
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          action: string
          actor_id: string | null
          actor_label: string
          created_at: string
          id: string
          invoice_id: string | null
          note: string | null
          payload: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_label: string
          created_at?: string
          id?: string
          invoice_id?: string | null
          note?: string | null
          payload?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_label?: string
          created_at?: string
          id?: string
          invoice_id?: string | null
          note?: string | null
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_bookkeeper_pending"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_samples: {
        Row: {
          attachment_text: string | null
          corrected_json: Json | null
          created_at: string
          email_body: string | null
          email_subject: string | null
          id: string
          vendor_id: string | null
        }
        Insert: {
          attachment_text?: string | null
          corrected_json?: Json | null
          created_at?: string
          email_body?: string | null
          email_subject?: string | null
          id?: string
          vendor_id?: string | null
        }
        Update: {
          attachment_text?: string | null
          corrected_json?: Json | null
          created_at?: string
          email_body?: string | null
          email_subject?: string | null
          id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extraction_samples_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          invoice_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          invoice_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          invoice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_notes_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_notes_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_bookkeeper_pending"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_splits: {
        Row: {
          amount_gross: number
          amount_vat: number
          category_id: string | null
          created_at: string
          entity_id: string
          id: string
          invoice_id: string
          note: string | null
          percentage: number
          project_id: string | null
        }
        Insert: {
          amount_gross: number
          amount_vat: number
          category_id?: string | null
          created_at?: string
          entity_id: string
          id?: string
          invoice_id: string
          note?: string | null
          percentage: number
          project_id?: string | null
        }
        Update: {
          amount_gross?: number
          amount_vat?: number
          category_id?: string | null
          created_at?: string
          entity_id?: string
          id?: string
          invoice_id?: string
          note?: string | null
          percentage?: number
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_splits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_splits_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_splits_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "v_workload_by_entity"
            referencedColumns: ["entity_id"]
          },
          {
            foreignKeyName: "invoice_splits_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_splits_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_bookkeeper_pending"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_splits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_tags: {
        Row: {
          created_at: string
          invoice_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          invoice_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          invoice_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_tags_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_tags_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_bookkeeper_pending"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_gross: number | null
          amount_net: number | null
          amount_vat: number | null
          approved_at: string | null
          approved_by: string | null
          bookkeeper_notes: string | null
          bookkeeper_verified_at: string | null
          bookkeeper_verified_by: string | null
          category_id: string | null
          content_hash: string
          created_at: string
          currency: string
          dispute_expected_resolution_at: string | null
          document_kind: Database["public"]["Enums"]["document_kind"]
          drive_file_id: string | null
          drive_folder_id: string | null
          due_date: string | null
          entity_id: string | null
          expense_reason: string | null
          extracted_by: Database["public"]["Enums"]["extraction_source"]
          extraction_confidence: number | null
          gmail_message_id: string | null
          hold_until: string | null
          hold_waiting_for: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          mail_account_id: string | null
          needs_review: boolean
          original_filename: string | null
          paid_at: string | null
          payment_batch_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_reference: string | null
          previous_status: Database["public"]["Enums"]["invoice_status"] | null
          project_id: string | null
          raw_text: string | null
          recipient_iban: string | null
          requires_approval: boolean
          status: Database["public"]["Enums"]["invoice_status"]
          status_note: string | null
          status_reason:
            | Database["public"]["Enums"]["invoice_status_reason"]
            | null
          subscription_id: string | null
          updated_at: string
          vat_rate: number | null
          vendor_id: string | null
        }
        Insert: {
          amount_gross?: number | null
          amount_net?: number | null
          amount_vat?: number | null
          approved_at?: string | null
          approved_by?: string | null
          bookkeeper_notes?: string | null
          bookkeeper_verified_at?: string | null
          bookkeeper_verified_by?: string | null
          category_id?: string | null
          content_hash: string
          created_at?: string
          currency?: string
          dispute_expected_resolution_at?: string | null
          document_kind?: Database["public"]["Enums"]["document_kind"]
          drive_file_id?: string | null
          drive_folder_id?: string | null
          due_date?: string | null
          entity_id?: string | null
          expense_reason?: string | null
          extracted_by?: Database["public"]["Enums"]["extraction_source"]
          extraction_confidence?: number | null
          gmail_message_id?: string | null
          hold_until?: string | null
          hold_waiting_for?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          mail_account_id?: string | null
          needs_review?: boolean
          original_filename?: string | null
          paid_at?: string | null
          payment_batch_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          previous_status?: Database["public"]["Enums"]["invoice_status"] | null
          project_id?: string | null
          raw_text?: string | null
          recipient_iban?: string | null
          requires_approval?: boolean
          status?: Database["public"]["Enums"]["invoice_status"]
          status_note?: string | null
          status_reason?:
            | Database["public"]["Enums"]["invoice_status_reason"]
            | null
          subscription_id?: string | null
          updated_at?: string
          vat_rate?: number | null
          vendor_id?: string | null
        }
        Update: {
          amount_gross?: number | null
          amount_net?: number | null
          amount_vat?: number | null
          approved_at?: string | null
          approved_by?: string | null
          bookkeeper_notes?: string | null
          bookkeeper_verified_at?: string | null
          bookkeeper_verified_by?: string | null
          category_id?: string | null
          content_hash?: string
          created_at?: string
          currency?: string
          dispute_expected_resolution_at?: string | null
          document_kind?: Database["public"]["Enums"]["document_kind"]
          drive_file_id?: string | null
          drive_folder_id?: string | null
          due_date?: string | null
          entity_id?: string | null
          expense_reason?: string | null
          extracted_by?: Database["public"]["Enums"]["extraction_source"]
          extraction_confidence?: number | null
          gmail_message_id?: string | null
          hold_until?: string | null
          hold_waiting_for?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          mail_account_id?: string | null
          needs_review?: boolean
          original_filename?: string | null
          paid_at?: string | null
          payment_batch_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          previous_status?: Database["public"]["Enums"]["invoice_status"] | null
          project_id?: string | null
          raw_text?: string | null
          recipient_iban?: string | null
          requires_approval?: boolean
          status?: Database["public"]["Enums"]["invoice_status"]
          status_note?: string | null
          status_reason?:
            | Database["public"]["Enums"]["invoice_status_reason"]
            | null
          subscription_id?: string | null
          updated_at?: string
          vat_rate?: number | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_bookkeeper_verified_by_fkey"
            columns: ["bookkeeper_verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "v_workload_by_entity"
            referencedColumns: ["entity_id"]
          },
          {
            foreignKeyName: "invoices_mail_account_id_fkey"
            columns: ["mail_account_id"]
            isOneToOne: false
            referencedRelation: "mail_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_payment_batch_id_fkey"
            columns: ["payment_batch_id"]
            isOneToOne: false
            referencedRelation: "payment_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "v_subscription_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          attempts: number
          created_at: string
          finished_at: string | null
          id: string
          kind: string
          last_error: string | null
          max_attempts: number
          payload: Json
          scheduled_for: string
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
        }
        Insert: {
          attempts?: number
          created_at?: string
          finished_at?: string | null
          id?: string
          kind: string
          last_error?: string | null
          max_attempts?: number
          payload?: Json
          scheduled_for?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
        }
        Update: {
          attempts?: number
          created_at?: string
          finished_at?: string | null
          id?: string
          kind?: string
          last_error?: string | null
          max_attempts?: number
          payload?: Json
          scheduled_for?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
        }
        Relationships: []
      }
      mail_accounts: {
        Row: {
          access_token: string | null
          connected_by: string | null
          created_at: string
          default_entity_id: string | null
          display_name: string | null
          email: string
          gmail_history_id: string | null
          gmail_label: string
          id: string
          last_error: string | null
          last_synced_at: string | null
          notes: string | null
          provider: Database["public"]["Enums"]["mail_provider"]
          refresh_token: string | null
          scopes: string[] | null
          status: Database["public"]["Enums"]["mail_account_status"]
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          connected_by?: string | null
          created_at?: string
          default_entity_id?: string | null
          display_name?: string | null
          email: string
          gmail_history_id?: string | null
          gmail_label?: string
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          notes?: string | null
          provider?: Database["public"]["Enums"]["mail_provider"]
          refresh_token?: string | null
          scopes?: string[] | null
          status?: Database["public"]["Enums"]["mail_account_status"]
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          connected_by?: string | null
          created_at?: string
          default_entity_id?: string | null
          display_name?: string | null
          email?: string
          gmail_history_id?: string | null
          gmail_label?: string
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          notes?: string | null
          provider?: Database["public"]["Enums"]["mail_provider"]
          refresh_token?: string | null
          scopes?: string[] | null
          status?: Database["public"]["Enums"]["mail_account_status"]
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mail_accounts_connected_by_fkey"
            columns: ["connected_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mail_accounts_default_entity_id_fkey"
            columns: ["default_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mail_accounts_default_entity_id_fkey"
            columns: ["default_entity_id"]
            isOneToOne: false
            referencedRelation: "v_workload_by_entity"
            referencedColumns: ["entity_id"]
          },
        ]
      }
      payment_batches: {
        Row: {
          closed_at: string | null
          created_at: string
          created_by: string
          id: string
          invoice_count: number
          note: string | null
          total_amount: number
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          invoice_count?: number
          note?: string | null
          total_amount?: number
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          invoice_count?: number
          note?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          created_at: string
          description: string | null
          end_date: string | null
          entity_id: string
          id: string
          name: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          entity_id: string
          id?: string
          name: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          entity_id?: string
          id?: string
          name?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "v_workload_by_entity"
            referencedColumns: ["entity_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancellation_notice_days: number | null
          cancellation_url: string | null
          created_at: string
          description: string | null
          entity_id: string
          expected_amount: number
          expected_day: number | null
          frequency: Database["public"]["Enums"]["subscription_frequency"]
          id: string
          last_invoice_id: string | null
          last_used_at: string | null
          name: string
          next_expected_date: string | null
          notes: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          vendor_id: string
        }
        Insert: {
          cancellation_notice_days?: number | null
          cancellation_url?: string | null
          created_at?: string
          description?: string | null
          entity_id: string
          expected_amount: number
          expected_day?: number | null
          frequency: Database["public"]["Enums"]["subscription_frequency"]
          id?: string
          last_invoice_id?: string | null
          last_used_at?: string | null
          name: string
          next_expected_date?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          vendor_id: string
        }
        Update: {
          cancellation_notice_days?: number | null
          cancellation_url?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string
          expected_amount?: number
          expected_day?: number | null
          frequency?: Database["public"]["Enums"]["subscription_frequency"]
          id?: string
          last_invoice_id?: string | null
          last_used_at?: string | null
          name?: string
          next_expected_date?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "v_workload_by_entity"
            referencedColumns: ["entity_id"]
          },
          {
            foreignKeyName: "subscriptions_last_invoice_fk"
            columns: ["last_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_last_invoice_fk"
            columns: ["last_invoice_id"]
            isOneToOne: false
            referencedRelation: "v_bookkeeper_pending"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_entity_access: {
        Row: {
          entity_id: string
          granted_at: string
          granted_by: string | null
          user_id: string
        }
        Insert: {
          entity_id: string
          granted_at?: string
          granted_by?: string | null
          user_id: string
        }
        Update: {
          entity_id?: string
          granted_at?: string
          granted_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_entity_access_entity_fk"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_entity_access_entity_fk"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "v_workload_by_entity"
            referencedColumns: ["entity_id"]
          },
          {
            foreignKeyName: "user_entity_access_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_entity_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          active: boolean
          created_at: string
          display_name: string
          email: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_name: string
          email: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          created_at: string
          default_category_id: string | null
          default_entity_id: string | null
          default_project_id: string | null
          email_domain: string | null
          extraction_rule_key: string | null
          id: string
          invoice_count: number
          kvk_number: string | null
          last_seen_at: string | null
          name: string
          notes: string | null
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          created_at?: string
          default_category_id?: string | null
          default_entity_id?: string | null
          default_project_id?: string | null
          email_domain?: string | null
          extraction_rule_key?: string | null
          id?: string
          invoice_count?: number
          kvk_number?: string | null
          last_seen_at?: string | null
          name: string
          notes?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          created_at?: string
          default_category_id?: string | null
          default_entity_id?: string | null
          default_project_id?: string | null
          email_domain?: string | null
          extraction_rule_key?: string | null
          id?: string
          invoice_count?: number
          kvk_number?: string | null
          last_seen_at?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_default_category_id_fkey"
            columns: ["default_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_default_entity_id_fkey"
            columns: ["default_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_default_entity_id_fkey"
            columns: ["default_entity_id"]
            isOneToOne: false
            referencedRelation: "v_workload_by_entity"
            referencedColumns: ["entity_id"]
          },
          {
            foreignKeyName: "vendors_default_project_id_fkey"
            columns: ["default_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_bookkeeper_pending: {
        Row: {
          amount_gross: number | null
          amount_vat: number | null
          category_name: string | null
          entity_id: string | null
          entity_name: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          vat_rate: number | null
          vendor_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "v_workload_by_entity"
            referencedColumns: ["entity_id"]
          },
        ]
      }
      v_subscription_alerts: {
        Row: {
          alert_kind: string | null
          cancellation_notice_days: number | null
          cancellation_url: string | null
          created_at: string | null
          description: string | null
          entity_id: string | null
          expected_amount: number | null
          expected_day: number | null
          frequency:
            | Database["public"]["Enums"]["subscription_frequency"]
            | null
          id: string | null
          last_invoice_id: string | null
          last_used_at: string | null
          name: string | null
          next_expected_date: string | null
          notes: string | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          alert_kind?: never
          cancellation_notice_days?: number | null
          cancellation_url?: string | null
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          expected_amount?: number | null
          expected_day?: number | null
          frequency?:
            | Database["public"]["Enums"]["subscription_frequency"]
            | null
          id?: string | null
          last_invoice_id?: string | null
          last_used_at?: string | null
          name?: string | null
          next_expected_date?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          alert_kind?: never
          cancellation_notice_days?: number | null
          cancellation_url?: string | null
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          expected_amount?: number | null
          expected_day?: number | null
          frequency?:
            | Database["public"]["Enums"]["subscription_frequency"]
            | null
          id?: string | null
          last_invoice_id?: string | null
          last_used_at?: string | null
          name?: string | null
          next_expected_date?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "v_workload_by_entity"
            referencedColumns: ["entity_id"]
          },
          {
            foreignKeyName: "subscriptions_last_invoice_fk"
            columns: ["last_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_last_invoice_fk"
            columns: ["last_invoice_id"]
            isOneToOne: false
            referencedRelation: "v_bookkeeper_pending"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      v_workload_by_entity: {
        Row: {
          approved_pending: number | null
          entity_id: string | null
          entity_name: string | null
          open_count: number | null
          owner_sphere: Database["public"]["Enums"]["owner_sphere"] | null
          ready_to_pay: number | null
        }
        Relationships: []
      }
      v_workload_by_sphere: {
        Row: {
          approved_pending: number | null
          incoming: number | null
          open_count: number | null
          owner_sphere: Database["public"]["Enums"]["owner_sphere"] | null
          ready_to_pay: number | null
        }
        Relationships: []
      }
      v_workload_by_status: {
        Row: {
          invoice_count: number | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          total_amount: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_mutate: { Args: never; Returns: boolean }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_entity_access: {
        Args: { target_entity_id: string }
        Returns: boolean
      }
      is_owner: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      document_kind:
        | "factuur"
        | "creditnota"
        | "bon"
        | "orderbevestiging"
        | "onbekend"
      extraction_source: "regel" | "llm_haiku" | "llm_sonnet" | "handmatig"
      invoice_status:
        | "binnengekomen"
        | "te_beoordelen"
        | "goedgekeurd"
        | "klaar_voor_betaling"
        | "voldaan"
        | "afgewezen"
        | "betwist"
        | "on_hold"
        | "gearchiveerd"
      invoice_status_reason:
        | "dubbele_factuur"
        | "bedrag_klopt_niet"
        | "dienst_niet_geleverd"
        | "kwaliteit_onder_maat"
        | "verkeerde_adressering"
        | "onverwachte_verhoging"
        | "geen_overeenkomst"
        | "wachten_op_creditnota"
        | "contract_opgezegd"
        | "overig"
      job_status: "wachtend" | "bezig" | "gereed" | "mislukt"
      mail_account_status:
        | "verbonden"
        | "herauth_nodig"
        | "gepauzeerd"
        | "ontkoppeld"
      mail_provider: "gmail"
      owner_sphere: "rutger" | "annelie" | "gezamenlijk"
      payment_method:
        | "sepa"
        | "creditcard"
        | "ideal"
        | "incasso"
        | "handmatig"
        | "onbekend"
      project_status: "actief" | "afgerond" | "gearchiveerd"
      subscription_frequency:
        | "wekelijks"
        | "maandelijks"
        | "kwartaal"
        | "halfjaarlijks"
        | "jaarlijks"
      subscription_status: "actief" | "gepauzeerd" | "opgezegd" | "vergeten"
      user_role: "eigenaar" | "boekhouder" | "kijker"
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
      document_kind: [
        "factuur",
        "creditnota",
        "bon",
        "orderbevestiging",
        "onbekend",
      ],
      extraction_source: ["regel", "llm_haiku", "llm_sonnet", "handmatig"],
      invoice_status: [
        "binnengekomen",
        "te_beoordelen",
        "goedgekeurd",
        "klaar_voor_betaling",
        "voldaan",
        "afgewezen",
        "betwist",
        "on_hold",
        "gearchiveerd",
      ],
      invoice_status_reason: [
        "dubbele_factuur",
        "bedrag_klopt_niet",
        "dienst_niet_geleverd",
        "kwaliteit_onder_maat",
        "verkeerde_adressering",
        "onverwachte_verhoging",
        "geen_overeenkomst",
        "wachten_op_creditnota",
        "contract_opgezegd",
        "overig",
      ],
      job_status: ["wachtend", "bezig", "gereed", "mislukt"],
      mail_account_status: [
        "verbonden",
        "herauth_nodig",
        "gepauzeerd",
        "ontkoppeld",
      ],
      mail_provider: ["gmail"],
      owner_sphere: ["rutger", "annelie", "gezamenlijk"],
      payment_method: [
        "sepa",
        "creditcard",
        "ideal",
        "incasso",
        "handmatig",
        "onbekend",
      ],
      project_status: ["actief", "afgerond", "gearchiveerd"],
      subscription_frequency: [
        "wekelijks",
        "maandelijks",
        "kwartaal",
        "halfjaarlijks",
        "jaarlijks",
      ],
      subscription_status: ["actief", "gepauzeerd", "opgezegd", "vergeten"],
      user_role: ["eigenaar", "boekhouder", "kijker"],
    },
  },
} as const

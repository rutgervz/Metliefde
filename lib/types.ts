import type { Database, Tables, TablesInsert, TablesUpdate, Enums } from "@/lib/database.types";

/**
 * Korte aliassen op de gegenereerde Supabase-types zodat queries en
 * componenten compact blijven. Pas hier nieuwe aliassen toe naarmate
 * we tabellen aanspreken; hoeft niet voor alles in een keer.
 */

export type UserRow = Tables<"users">;
export type UserInsert = TablesInsert<"users">;
export type UserUpdate = TablesUpdate<"users">;
export type UserRole = Enums<"user_role">;

export type EntityRow = Tables<"entities">;
export type EntityInsert = TablesInsert<"entities">;
export type EntityUpdate = TablesUpdate<"entities">;

export type ProjectRow = Tables<"projects">;
export type CategoryRow = Tables<"categories">;
export type VendorRow = Tables<"vendors">;
export type SubscriptionRow = Tables<"subscriptions">;

export type InvoiceRow = Tables<"invoices">;
export type InvoiceInsert = TablesInsert<"invoices">;
export type InvoiceUpdate = TablesUpdate<"invoices">;

export type InvoiceNoteRow = Tables<"invoice_notes">;
export type InvoiceSplitRow = Tables<"invoice_splits">;
export type EventRow = Tables<"events">;
export type JobRow = Tables<"jobs">;

export type MailAccountRow = Tables<"mail_accounts">;
export type MailAccountInsert = TablesInsert<"mail_accounts">;
export type MailAccountUpdate = TablesUpdate<"mail_accounts">;

export type OwnerSphere = Enums<"owner_sphere">;
export type InvoiceStatus = Enums<"invoice_status">;
export type InvoiceStatusReason = Enums<"invoice_status_reason">;
export type DocumentKind = Enums<"document_kind">;
export type PaymentMethod = Enums<"payment_method">;
export type SubscriptionFrequency = Enums<"subscription_frequency">;
export type SubscriptionStatus = Enums<"subscription_status">;
export type ProjectStatus = Enums<"project_status">;
export type ExtractionSource = Enums<"extraction_source">;
export type JobStatus = Enums<"job_status">;
export type MailProvider = Enums<"mail_provider">;
export type MailAccountStatus = Enums<"mail_account_status">;

export type { Database };

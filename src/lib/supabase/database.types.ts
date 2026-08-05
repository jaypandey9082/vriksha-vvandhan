// Schema type snapshot for the Section 2 migrations.
// Run `npm run db:types` against the migrated local stack before release. The
// current environment has no Docker runtime, so CLI generation is not available.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamp = string;

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          after_data: Json | null;
          before_data: Json | null;
          created_at: Timestamp;
          entity_id: string | null;
          entity_type: string;
          id: number;
          reason: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          after_data?: Json | null;
          before_data?: Json | null;
          created_at?: Timestamp;
          entity_id?: string | null;
          entity_type: string;
          id?: never;
          reason?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [];
      };
      campaign_settings: {
        Row: {
          created_at: Timestamp;
          id: number;
          metric_label: string;
          submissions_open: boolean;
          target_count: number;
          updated_at: Timestamp;
        };
        Insert: {
          created_at?: Timestamp;
          id?: number;
          metric_label?: string;
          submissions_open?: boolean;
          target_count?: number;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["campaign_settings"]["Insert"]>;
        Relationships: [];
      };
      certificates: {
        Row: {
          attempt_count: number;
          bucket: string | null;
          created_at: Timestamp;
          format: string | null;
          generated_at: Timestamp | null;
          id: string;
          last_error_code: string | null;
          object_path: string | null;
          queued_at: Timestamp | null;
          status: Database["public"]["Enums"]["certificate_status"];
          submission_id: string;
          updated_at: Timestamp;
        };
        Insert: {
          attempt_count?: number;
          bucket?: string | null;
          created_at?: Timestamp;
          format?: string | null;
          generated_at?: Timestamp | null;
          id?: string;
          last_error_code?: string | null;
          object_path?: string | null;
          queued_at?: Timestamp | null;
          status?: Database["public"]["Enums"]["certificate_status"];
          submission_id: string;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["certificates"]["Insert"]>;
        Relationships: [];
      };
      email_deliveries: {
        Row: {
          attempt_count: number;
          created_at: Timestamp;
          id: string;
          idempotency_key: string;
          kind: Database["public"]["Enums"]["email_delivery_kind"];
          last_attempt_at: Timestamp | null;
          last_error_code: string | null;
          provider_message_id: string | null;
          queued_at: Timestamp | null;
          sent_at: Timestamp | null;
          status: Database["public"]["Enums"]["email_delivery_status"];
          submission_id: string;
          template_version: string | null;
          updated_at: Timestamp;
        };
        Insert: {
          attempt_count?: number;
          created_at?: Timestamp;
          id?: string;
          idempotency_key: string;
          kind: Database["public"]["Enums"]["email_delivery_kind"];
          last_attempt_at?: Timestamp | null;
          last_error_code?: string | null;
          provider_message_id?: string | null;
          queued_at?: Timestamp | null;
          sent_at?: Timestamp | null;
          status?: Database["public"]["Enums"]["email_delivery_status"];
          submission_id: string;
          template_version?: string | null;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["email_deliveries"]["Insert"]>;
        Relationships: [];
      };
      staff_profiles: {
        Row: {
          active: boolean;
          created_at: Timestamp;
          display_name: string;
          id: string;
          role: Database["public"]["Enums"]["staff_role"];
          updated_at: Timestamp;
        };
        Insert: {
          active?: boolean;
          created_at?: Timestamp;
          display_name: string;
          id: string;
          role: Database["public"]["Enums"]["staff_role"];
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["staff_profiles"]["Insert"]>;
        Relationships: [];
      };
      submission_consents: {
        Row: {
          accepted_at: Timestamp;
          consent_version: string;
          created_at: Timestamp;
          publication_consent: boolean;
          submission_id: string;
          terms_accepted: boolean;
          updated_at: Timestamp;
        };
        Insert: {
          accepted_at: Timestamp;
          consent_version: string;
          created_at?: Timestamp;
          publication_consent: boolean;
          submission_id: string;
          terms_accepted: boolean;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["submission_consents"]["Insert"]>;
        Relationships: [];
      };
      submission_contacts: {
        Row: {
          created_at: Timestamp;
          email: string;
          submission_id: string;
          updated_at: Timestamp;
        };
        Insert: {
          created_at?: Timestamp;
          email: string;
          submission_id: string;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["submission_contacts"]["Insert"]>;
        Relationships: [];
      };
      submission_media: {
        Row: {
          alt_text: string | null;
          created_at: Timestamp;
          focal_x: number | null;
          focal_y: number | null;
          id: string;
          original_bucket: string;
          original_bytes: number | null;
          original_checksum_sha256: string | null;
          original_extension: string;
          original_height: number | null;
          original_mime_type: string | null;
          original_path: string;
          original_width: number | null;
          published_at: Timestamp | null;
          published_bucket: string | null;
          published_card_path: string | null;
          published_full_path: string | null;
          removed_at: Timestamp | null;
          status: Database["public"]["Enums"]["media_status"];
          submission_id: string;
          updated_at: Timestamp;
          uploaded_at: Timestamp | null;
        };
        Insert: {
          alt_text?: string | null;
          created_at?: Timestamp;
          focal_x?: number | null;
          focal_y?: number | null;
          id?: string;
          original_bucket?: string;
          original_bytes?: number | null;
          original_checksum_sha256?: string | null;
          original_extension: string;
          original_height?: number | null;
          original_mime_type?: string | null;
          original_path: string;
          original_width?: number | null;
          published_at?: Timestamp | null;
          published_bucket?: string | null;
          published_card_path?: string | null;
          published_full_path?: string | null;
          removed_at?: Timestamp | null;
          status?: Database["public"]["Enums"]["media_status"];
          submission_id: string;
          updated_at?: Timestamp;
          uploaded_at?: Timestamp | null;
        };
        Update: Partial<Database["public"]["Tables"]["submission_media"]["Insert"]>;
        Relationships: [];
      };
      submissions: {
        Row: {
          approved_at: Timestamp | null;
          approved_by: string | null;
          counts_toward_goal: boolean;
          created_at: Timestamp;
          created_by_staff_id: string | null;
          display_name: string | null;
          draft_expires_at: Timestamp | null;
          guardian_number: number | null;
          id: string;
          is_test: boolean;
          published_at: Timestamp | null;
          rejected_at: Timestamp | null;
          rejection_comment: string | null;
          rejection_confirmed_at: Timestamp | null;
          rejection_confirmed_by: string | null;
          rejection_recommended_at: Timestamp | null;
          rejection_recommended_by: string | null;
          source: Database["public"]["Enums"]["submission_source"];
          status: Database["public"]["Enums"]["submission_status"];
          submitted_at: Timestamp | null;
          trashed_at: Timestamp | null;
          trashed_by: string | null;
          updated_at: Timestamp;
        };
        Insert: {
          approved_at?: Timestamp | null;
          approved_by?: string | null;
          counts_toward_goal?: boolean;
          created_at?: Timestamp;
          created_by_staff_id?: string | null;
          display_name?: string | null;
          draft_expires_at?: Timestamp | null;
          guardian_number?: number | null;
          id?: string;
          is_test?: boolean;
          published_at?: Timestamp | null;
          rejected_at?: Timestamp | null;
          rejection_comment?: string | null;
          rejection_confirmed_at?: Timestamp | null;
          rejection_confirmed_by?: string | null;
          rejection_recommended_at?: Timestamp | null;
          rejection_recommended_by?: string | null;
          source?: Database["public"]["Enums"]["submission_source"];
          status?: Database["public"]["Enums"]["submission_status"];
          submitted_at?: Timestamp | null;
          trashed_at?: Timestamp | null;
          trashed_by?: string | null;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["submissions"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      certificate_status: "not_started" | "queued" | "generated" | "failed";
      email_delivery_kind:
        | "submission_received"
        | "approval_certificate"
        | "rejection";
      email_delivery_status: "not_started" | "queued" | "sent" | "failed";
      media_status: "reserved" | "uploaded" | "published" | "removed";
      staff_role: "admin" | "reviewer";
      submission_source: "website" | "internal_test";
      submission_status:
        | "draft"
        | "pending_review"
        | "rejection_pending_admin"
        | "published"
        | "rejected";
    };
    CompositeTypes: Record<string, never>;
  };
  private: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: {
      current_published_count: { Args: Record<PropertyKey, never>; Returns: number };
      current_staff_role: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["staff_role"] | null;
      };
      is_active_staff: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_reviewer_or_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

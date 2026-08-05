import type { Database } from "@/lib/supabase/database.types";

type Public = Database["public"];

export type StaffRole = Public["Enums"]["staff_role"];
export type SubmissionStatus = Public["Enums"]["submission_status"];
export type StaffProfileRow = Public["Tables"]["staff_profiles"]["Row"];
export type SubmissionRow = Public["Tables"]["submissions"]["Row"];
export type SubmissionInsert = Public["Tables"]["submissions"]["Insert"];
export type SubmissionContactRow = Public["Tables"]["submission_contacts"]["Row"];
export type SubmissionConsentRow = Public["Tables"]["submission_consents"]["Row"];
export type SubmissionMediaRow = Public["Tables"]["submission_media"]["Row"];
export type CertificateRow = Public["Tables"]["certificates"]["Row"];
export type EmailDeliveryRow = Public["Tables"]["email_deliveries"]["Row"];
export type CampaignSettingsRow = Public["Tables"]["campaign_settings"]["Row"];

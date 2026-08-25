import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type VenueInsert = {
  title: string;
  slug: string;
  tagline: string;
  description: string;
  city: string;
  address: string;
  location: { lat: number; lng: number };
  venue_code: string;
  min_capacity: number;
  max_capacity: number;
  event_categories: string[];
  venue_types: string[];
  services: string[];
  spaces: Array<{ id: string; name: string; capacity: number; squareMeters?: number; description: string; imageUrl?: string }>;
  access_details: string[];
  useful_information: string[];
  pricing_text: string;
  cover_image: string;
  gallery: string[];
  video_url?: string | null;
  video_start_seconds?: number;
  video_end_seconds?: number | null;
  tiktok_url?: string | null;
  google_review_url: string;
  seo_title: string;
  meta_description: string;
  price_tier: "€" | "€€" | "€€€" | "€€€€";
  closing_time: string;
  ambiance_types: string[];
  external_options: string[];
  privatization_types: string[];
  guest_dispositions: string[];
  space_types: string[];
  option_features: string[];
  metro_access?: string | null;
  featured: boolean;
  active: boolean;
  contact_email: string;
  rating: number;
  review_count: number;
};

export type BlogPostInsert = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  content: string;
  read_time: string;
  image: string;
  secondary_keywords: string[];
  seo_title: string;
  meta_description: string;
  published: boolean;
  published_at?: string | null;
};

export type SeoMetadataInsert = {
  page_path: string;
  title: string;
  description: string;
  active: boolean;
};

export type BookingRequestInsert = {
  id: string;
  venue_id?: string | null;
  venue_code: string;
  venue_title: string;
  venue_city: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  desired_date: string | null;
  start_time: string;
  end_time: string;
  guest_count: number;
  event_type: string;
  requested_spaces: string[];
  message?: string | null;
  status: string;
};

type Database = {
  public: {
    Tables: {
      venues: {
        Insert: VenueInsert;
        Row: VenueInsert & { id: string; created_at: string; updated_at: string };
        Update: Partial<VenueInsert>;
      };
      blog_posts: {
        Insert: BlogPostInsert;
        Row: BlogPostInsert & { id: string; created_at: string; updated_at: string };
        Update: Partial<BlogPostInsert>;
      };
      seo_metadata: {
        Insert: SeoMetadataInsert;
        Row: SeoMetadataInsert & { id: string; created_at: string; updated_at: string };
        Update: Partial<SeoMetadataInsert>;
      };
      booking_requests: {
        Insert: BookingRequestInsert;
        Row: BookingRequestInsert & { created_at: string; updated_at: string };
        Update: Partial<BookingRequestInsert>;
      };
    };
  };
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishable = import.meta.env.VITE_SUPABASE_PUBLISHABLE || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishable);

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabasePublishable)
  : null;

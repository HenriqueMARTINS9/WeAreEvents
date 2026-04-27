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
  services: string[];
  spaces: Array<{ id: string; name: string; capacity: number; description: string }>;
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
  price_tier: "€" | "€€" | "€€€";
  closing_time: string;
  ambiance_types: string[];
  external_options: string[];
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
  published: boolean;
  published_at?: string | null;
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
    };
  };
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishable = import.meta.env.VITE_SUPABASE_PUBLISHABLE;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishable);

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabasePublishable)
  : null;

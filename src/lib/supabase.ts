import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  preferred_language: string;
  city: string | null;
  created_at: string;
  updated_at: string;
};

export type Plant = {
  id: string;
  name_zh: string;
  name_en: string;
  description_zh: string | null;
  description_en: string | null;
  meaning_zh: string | null;
  meaning_en: string | null;
  care_guide_zh: string | null;
  care_guide_en: string | null;
  image_url: string | null;
  optimal_temp_min: number | null;
  optimal_temp_max: number | null;
  optimal_humidity_min: number | null;
  optimal_humidity_max: number | null;
  is_daily_featured: boolean;
  featured_date: string | null;
  created_at: string;
};

export type UserPlant = {
  id: string;
  user_id: string;
  plant_id: string;
  custom_name: string | null;
  plant_image_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type IoTDevice = {
  id: string;
  user_id: string;
  device_name: string;
  device_type: string;
  location: string | null;
  is_online: boolean;
  temperature: number | null;
  humidity: number | null;
  last_update: string;
  created_at: string;
};

export type ForumPost = {
  id: string;
  user_id: string;
  category: string;
  title: string;
  content: string | null;
  image_url: string | null;
  temperature: number | null;
  humidity: number | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
};


import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL = "https://ytnbgtkwjrxrsykfcchf.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0bmJndGt3anJ4cnN5a2ZjY2hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzYwNTcsImV4cCI6MjA4MDExMjA1N30.7BSK92Cesh5VYyiVwhiC_Bw5ZhAb7AryeiG8MRUV4tc";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase: SupabaseClient<Database> = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

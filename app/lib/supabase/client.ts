/**
 * Supabase Client Configuration
 * 
 * Creates a singleton Supabase client for browser-side database operations.
 * Uses environment variables for configuration.
 * 
 * @module supabase/client
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

/**
 * Supabase client instance.
 * Use this for all database operations from client components.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We use localStorage for session management
  },
});

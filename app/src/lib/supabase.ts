import { createClient } from '@supabase/supabase-js';
import type { Database } from '../shared/types/db';
import { env } from '../config/env';

export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

import { supabase } from '../../lib/supabase';
import type { Database } from '../../shared/types/db';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export const profilesService = {
  async getCurrentProfile(userId: string): Promise<ProfileRow | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    return data;
  },
};

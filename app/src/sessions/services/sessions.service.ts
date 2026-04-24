import { supabase } from '../../lib/supabase';
import type { Database } from '../../shared/types/db';

type GameSessionRow = Database['public']['Tables']['game_sessions']['Row'];

export const sessionsService = {
  async createSession(coupleId: string): Promise<string> {
    const { data, error } = await supabase.rpc('fn_create_session', { p_couple_id: coupleId });
    if (error) throw new Error(error.message);
    return data;
  },

  async getSession(sessionId: string): Promise<GameSessionRow | null> {
    const { data, error } = await supabase.from('game_sessions').select('*').eq('id', sessionId).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },

  async listActiveSessions(): Promise<GameSessionRow[]> {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .neq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  },
};

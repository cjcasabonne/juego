import { supabase } from '../../lib/supabase';
import type { Database } from '../../shared/types/db';

type UserSessionStateRow = Database['public']['Tables']['user_session_state']['Row'];

export const userSessionStateService = {
  async getMyState(sessionId: string, userId: string): Promise<UserSessionStateRow | null> {
    const { data, error } = await supabase
      .from('user_session_state')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  },

  async markPhase1Completed(stateId: string): Promise<void> {
    const { error } = await supabase.from('user_session_state').update({ phase1_completed: true }).eq('id', stateId);
    if (error) throw new Error(error.message);
  },

  async markPhase2Completed(stateId: string): Promise<void> {
    const { error } = await supabase.from('user_session_state').update({ phase2_completed: true }).eq('id', stateId);
    if (error) throw new Error(error.message);
  },

  async updateRevealPosition(stateId: string, revealPosition: number): Promise<void> {
    const { error } = await supabase
      .from('user_session_state')
      .update({ reveal_position: revealPosition })
      .eq('id', stateId);
    if (error) throw new Error(error.message);
  },
};

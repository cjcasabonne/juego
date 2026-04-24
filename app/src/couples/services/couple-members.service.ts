import { supabase } from '../../lib/supabase';

export const coupleMembersService = {
  async joinCouple(inviteCode: string) {
    const { data, error } = await supabase.rpc('fn_join_couple', { p_invite_code: inviteCode.trim().toUpperCase() });
    if (error) throw new Error(error.message);
    return data;
  },
};

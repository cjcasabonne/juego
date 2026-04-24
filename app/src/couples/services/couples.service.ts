import { supabase } from '../../lib/supabase';
import { generateInviteCode } from '../../shared/utils/ids';
import type { Database } from '../../shared/types/db';

type CoupleInsert = Database['public']['Tables']['couples']['Insert'];
type CoupleRow = Database['public']['Tables']['couples']['Row'];
type CoupleMemberRow = Database['public']['Tables']['couple_members']['Row'];

export const couplesService = {
  async listCouples(): Promise<CoupleRow[]> {
    const { data, error } = await supabase
      .from('couples')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  },

  async listMembers(coupleIds: string[]): Promise<CoupleMemberRow[]> {
    if (coupleIds.length === 0) return [];

    const { data, error } = await supabase
      .from('couple_members')
      .select('*')
      .in('couple_id', coupleIds)
      .order('joined_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  },

  async createCouple(input: { userId: string; name?: string }) {
    let inviteCode = generateInviteCode();
    let createdPayload: CoupleInsert | null = null;

    for (let i = 0; i < 3; i += 1) {
      const payload: CoupleInsert = {
        created_by: input.userId,
        invite_code: inviteCode,
        name: input.name?.trim() || null,
      };

      const { error } = await supabase.from('couples').insert(payload);
      if (!error) {
        createdPayload = payload;
        break;
      }

      const message = error.message.toLowerCase();
      if (!message.includes('duplicate') && !message.includes('unique')) {
        throw new Error(error.message);
      }

      inviteCode = generateInviteCode();
    }

    if (!createdPayload) {
      throw new Error('No se pudo generar un invite_code unico');
    }

    const { error: joinError } = await supabase.rpc('fn_join_couple', {
      p_invite_code: createdPayload.invite_code,
    });
    if (joinError) throw new Error(joinError.message);

    const { data, error } = await supabase
      .from('couples')
      .select('*')
      .eq('invite_code', createdPayload.invite_code)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};

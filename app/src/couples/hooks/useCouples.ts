import { useCallback, useEffect, useState } from 'react';
import { couplesService } from '../services/couples.service';
import type { Database } from '../../shared/types/db';

type CoupleRow = Database['public']['Tables']['couples']['Row'];
type CoupleMemberRow = Database['public']['Tables']['couple_members']['Row'];

export interface CoupleWithMembers extends CoupleRow {
  members: CoupleMemberRow[];
}

export function useCouples() {
  const [couples, setCouples] = useState<CoupleWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const base = await couplesService.listCouples();
      const members = await couplesService.listMembers(base.map((item) => item.id));

      const grouped = members.reduce<Record<string, CoupleMemberRow[]>>((acc, member) => {
        acc[member.couple_id] ??= [];
        acc[member.couple_id].push(member);
        return acc;
      }, {});

      setCouples(base.map((item) => ({ ...item, members: grouped[item.id] ?? [] })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las parejas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!active) return;
      await reload();
    };

    void load();

    return () => {
      active = false;
    };
  }, [reload]);

  return { couples, loading, error, reload };
}

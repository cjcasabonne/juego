import { useState } from 'react';
import { coupleMembersService } from '../services/couple-members.service';

export function useJoinCouple() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinCouple = async (inviteCode: string) => {
    setLoading(true);
    setError(null);

    try {
      return await coupleMembersService.joinCouple(inviteCode);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo unir a la pareja';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { joinCouple, loading, error };
}

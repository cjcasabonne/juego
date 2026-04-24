import { useState } from 'react';
import { useAuthSession } from '../../auth/hooks/useAuthSession';
import { couplesService } from '../services/couples.service';

export function useCreateCouple() {
  const { user } = useAuthSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCouple = async (name?: string) => {
    if (!user) throw new Error('Debes iniciar sesión');

    setLoading(true);
    setError(null);

    try {
      return await couplesService.createCouple({ userId: user.id, name });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear la pareja';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createCouple, loading, error };
}

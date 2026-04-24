import { useState } from 'react';
import { sessionsService } from '../services/sessions.service';

export function useCreateSession() {
  const [loadingCoupleId, setLoadingCoupleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createSession = async (coupleId: string) => {
    setLoadingCoupleId(coupleId);
    setError(null);

    try {
      return await sessionsService.createSession(coupleId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear la sesión';
      setError(message);
      throw err;
    } finally {
      setLoadingCoupleId(null);
    }
  };

  return { createSession, loadingCoupleId, error };
}

import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { authService } from '../services/auth.service';

interface AuthSessionState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

export function useAuthSession(): AuthSessionState {
  const [state, setState] = useState<AuthSessionState>({
    session: null,
    user: null,
    loading: true,
  });

  useEffect(() => {
    let active = true;

    authService
      .getSession()
      .then((session) => {
        if (!active) return;
        setState({ session, user: session?.user ?? null, loading: false });
      })
      .catch(() => {
        if (!active) return;
        setState({ session: null, user: null, loading: false });
      });

    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      setState({ session, user: session?.user ?? null, loading: false });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import LoadingState from '../../shared/components/LoadingState';

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const finish = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      navigate(session ? '/couples' : '/login', { replace: true });
    };

    void finish();
  }, [navigate]);

  return <LoadingState message="Completando autenticación..." />;
}

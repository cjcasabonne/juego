import { useCallback } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import PageShell from '../../shared/components/PageShell';
import LoadingState from '../../shared/components/LoadingState';
import ErrorState from '../../shared/components/ErrorState';
import { useSession } from '../hooks/useSession';
import { useSessionRealtime } from '../hooks/useSessionRealtime';
import type { GameSessionStatus } from '../../shared/types/db';

export default function SessionRouterPage() {
  const { sessionId } = useParams();
  const { session, loading, error, setSession } = useSession(sessionId);

  const onStatusChange = useCallback(
    (status: GameSessionStatus) => {
      setSession((current) => (current ? { ...current, status } : current));
    },
    [setSession],
  );

  useSessionRealtime(sessionId, onStatusChange);

  if (loading) return <LoadingState message="Cargando sesión..." />;
  if (error || !session) {
    return (
      <PageShell title="Sesión" backTo="/couples">
        <ErrorState message={error ?? 'Sesión no encontrada'} />
      </PageShell>
    );
  }

  if (session.status === 'completed') {
    return <Navigate to={`/session/${session.id}/summary`} replace />;
  }

  return <Navigate to={`/session/${session.id}/${session.status}`} replace />;
}

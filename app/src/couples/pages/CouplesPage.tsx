import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../../shared/components/PageShell';
import Button from '../../shared/components/Button';
import LoadingState from '../../shared/components/LoadingState';
import ErrorState from '../../shared/components/ErrorState';
import EmptyState from '../../shared/components/EmptyState';
import CoupleCard from '../components/CoupleCard';
import { useCouples } from '../hooks/useCouples';
import { useProfile } from '../../profiles/hooks/useProfile';
import { authService } from '../../auth/services/auth.service';
import { useCreateSession } from '../../sessions/hooks/useCreateSession';
import { useActiveSessions } from '../../sessions/hooks/useActiveSessions';
import ActiveSessionCard from '../../sessions/components/ActiveSessionCard';

export default function CouplesPage() {
  const navigate = useNavigate();
  const { couples, loading, error, reload } = useCouples();
  const { profile } = useProfile();
  const { createSession, loadingCoupleId, error: sessionError } = useCreateSession();
  const {
    sessions: activeSessions,
    loading: sessionsLoading,
    error: activeSessionsError,
    reload: reloadSessions,
  } = useActiveSessions();

  const onCreateSession = async (coupleId: string) => {
    const sessionId = await createSession(coupleId);
    void reloadSessions();
    navigate(`/session/${sessionId}/phase1`, { replace: true });
  };

  const sessionNumberMap = new Map(
    [...activeSessions]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((session, index) => [session.id, index + 1]),
  );

  return (
    <PageShell
      title="Parejas"
      actions={
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#6f5a84' }}>{profile?.display_name ?? 'Usuario'}</span>
          <Button variant="secondary" onClick={() => void authService.signOut()}>
            Salir
          </Button>
        </div>
      }
    >
      <section
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 13, color: '#8b6da8', textTransform: 'uppercase', letterSpacing: 1.2 }}>
            Hub
          </p>
          <h2 style={{ margin: '8px 0 0', fontSize: 30 }}>Tus parejas y accesos</h2>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/couples/join" style={{ textDecoration: 'none' }}>
            <Button variant="secondary">Unirse</Button>
          </Link>
          <Link to="/couples/new" style={{ textDecoration: 'none' }}>
            <Button>Nueva pareja</Button>
          </Link>
        </div>
      </section>

      {(error || sessionError || activeSessionsError) && (
        <ErrorState message={error ?? sessionError ?? activeSessionsError ?? 'Error'} onRetry={() => void reload()} />
      )}

      {sessionsLoading && <LoadingState message="Cargando sesiones activas..." />}

      {!sessionsLoading && activeSessions.length > 0 && (
        <section style={{ display: 'grid', gap: 14, marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 24 }}>Sesiones activas</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {activeSessions.map((session) => (
              <ActiveSessionCard
                key={session.id}
                session={session}
                sessionNumber={sessionNumberMap.get(session.id)}
              />
            ))}
          </div>
        </section>
      )}

      {loading && <LoadingState message="Cargando parejas..." />}
      {!loading && !error && couples.length === 0 && (
        <EmptyState
          title="Todavía no tienes parejas"
          description="Crea una nueva o únete con un invite code."
          action={
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/couples/new" style={{ textDecoration: 'none' }}>
                <Button>Nueva pareja</Button>
              </Link>
              <Link to="/couples/join" style={{ textDecoration: 'none' }}>
                <Button variant="secondary">Unirse</Button>
              </Link>
            </div>
          }
        />
      )}

      <div style={{ display: 'grid', gap: 18 }}>
        {couples.map((couple) => (
          <CoupleCard
            key={couple.id}
            couple={couple}
            onCreateSession={onCreateSession}
            sessionLoadingId={loadingCoupleId}
          />
        ))}
      </div>
    </PageShell>
  );
}

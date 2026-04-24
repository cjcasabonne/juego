import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import PageShell from '../../shared/components/PageShell';
import LoadingState from '../../shared/components/LoadingState';
import ErrorState from '../../shared/components/ErrorState';
import { useSessionScore } from '../hooks/useSessionScore';
import { useActiveSessions } from '../hooks/useActiveSessions';

export default function SessionSummaryPage() {
  const { sessionId } = useParams();
  const { score, loading, error, reload } = useSessionScore(sessionId);
  const { sessions } = useActiveSessions();

  const sessionNumber = useMemo(() => {
    if (!sessionId) return null;
    const ordered = [...sessions].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const index = ordered.findIndex((session) => session.id === sessionId);
    return index >= 0 ? index + 1 : null;
  }, [sessionId, sessions]);

  return (
    <PageShell title="Resumen final" backTo="/couples">
      {loading && <LoadingState message="Calculando score..." />}
      {error && <ErrorState message={error} onRetry={() => void reload()} />}

      {!loading && !error && (
        <div style={{ display: 'grid', gap: 18 }}>
          <section
            style={{
              background: '#fff',
              border: '1px solid #eadff5',
              borderRadius: 22,
              padding: 22,
            }}
          >
            <p style={{ margin: 0, color: '#6f5a84' }}>Sesion: {sessionNumber ?? '-'}</p>
            <h2 style={{ margin: '10px 0 0', fontSize: 28 }}>Score consolidado</h2>
          </section>

          {score.map((item) => (
            <article
              key={item.predictorId}
              style={{
                background: '#fff',
                border: '1px solid #eadff5',
                borderRadius: 22,
                padding: 22,
                display: 'grid',
                gap: 10,
              }}
            >
              <strong style={{ fontSize: 20 }}>{item.displayName}</strong>
              <p style={{ margin: 0, color: '#1f1527' }}>
                Aciertos: {item.correct}/{item.scoredTotal}
              </p>
              <p style={{ margin: 0, color: '#6f5a84' }}>Pendientes de validar: {item.pending}</p>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}

import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useCouples } from '../../couples/hooks/useCouples';
import ErrorState from '../../shared/components/ErrorState';
import LoadingState from '../../shared/components/LoadingState';
import PageShell from '../../shared/components/PageShell';
import { useActiveSessions } from '../hooks/useActiveSessions';
import { useSession } from '../hooks/useSession';
import { useSessionScore } from '../hooks/useSessionScore';

export default function SessionSummaryPage() {
  const { sessionId } = useParams();
  const { score, loading, error, reload } = useSessionScore(sessionId);
  const { session } = useSession(sessionId);
  const { sessions } = useActiveSessions(true);
  const { couples } = useCouples();

  const sessionNumber = useMemo(() => {
    if (!sessionId) return null;
    const ordered = [...sessions].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const index = ordered.findIndex((item) => item.id === sessionId);
    return index >= 0 ? index + 1 : null;
  }, [sessionId, sessions]);

  const coupleName = useMemo(
    () => couples.find((couple) => couple.id === session?.couple_id)?.name?.trim() || 'Pareja sin nombre',
    [couples, session?.couple_id],
  );

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
            <p style={{ margin: 0, color: '#6f5a84' }}>Sesion: {sessionNumber ?? '-'} - {coupleName}</p>
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

              {item.details.length > 0 && (
                <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
                  {item.details.map((detail) => (
                    <section
                      key={detail.predictionId}
                      style={{
                        border: '1px solid #f0e8f7',
                        borderRadius: 16,
                        padding: 14,
                        background: '#fcfaff',
                        display: 'grid',
                        gap: 6,
                      }}
                    >
                      <strong style={{ fontSize: 15 }}>#{detail.position} {detail.questionText}</strong>
                      <p style={{ margin: 0, color: '#1f1527' }}>Prediccion: {detail.predictedText}</p>
                      <p style={{ margin: 0, color: '#1f1527' }}>Respuesta real: {detail.actualText}</p>
                      <p style={{ margin: 0, color: '#6f5a84' }}>
                        Estado:{' '}
                        {detail.result === 'correct'
                          ? 'Acerto'
                          : detail.result === 'incorrect'
                            ? 'Fallo'
                            : 'Pendiente'}
                      </p>
                    </section>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}

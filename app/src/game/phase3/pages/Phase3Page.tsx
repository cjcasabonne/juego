import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import PageShell from '../../../shared/components/PageShell';
import LoadingState from '../../../shared/components/LoadingState';
import ErrorState from '../../../shared/components/ErrorState';
import Button from '../../../shared/components/Button';
import { useAuthSession } from '../../../auth/hooks/useAuthSession';
import { useSession } from '../../../sessions/hooks/useSession';
import { useSessionScore } from '../../../sessions/hooks/useSessionScore';
import { useSessionRealtime } from '../../../sessions/hooks/useSessionRealtime';
import { userSessionStateService } from '../../../sessions/services/user-session-state.service';
import { useRevealFeed } from '../hooks/useRevealFeed';
import RevealCard from '../components/RevealCard';
import { freeTextValidationsService } from '../services/free-text-validations.service';

export default function Phase3Page() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { user, loading: authLoading } = useAuthSession();
  const { session, loading: sessionLoading, error: sessionError, setSession } = useSession(sessionId);
  const { score, loading: scoreLoading, error: scoreError } = useSessionScore(sessionId);
  const { items, loading: feedLoading, error: feedError, reload } = useRevealFeed(sessionId, user?.id);
  const [myState, setMyState] = useState<Awaited<ReturnType<typeof userSessionStateService.getMyState>>>(null);
  const [stateLoading, setStateLoading] = useState(true);
  const [stateError, setStateError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    let active = true;

    const loadMyState = async () => {
      if (!sessionId || !user?.id) {
        if (!active) return;
        setMyState(null);
        setStateLoading(false);
        return;
      }

      if (!active) return;
      setStateLoading(true);
      setStateError(null);

      try {
        const state = await userSessionStateService.getMyState(sessionId, user.id);
        if (!active) return;
        setMyState(state);
      } catch (err) {
        if (!active) return;
        setStateError(err instanceof Error ? err.message : 'No se pudo cargar el resumen');
      } finally {
        if (active) {
          setStateLoading(false);
        }
      }
    };

    void loadMyState();

    return () => {
      active = false;
    };
  }, [sessionId, user]);

  useSessionRealtime(sessionId, (status) => {
    setSession((current) => (current ? { ...current, status } : current));
  });

  useEffect(() => {
    if (session?.status && session.status !== 'phase3') {
      navigate(`/session/${session.id}`, { replace: true });
    }
  }, [navigate, session]);

  if (authLoading || sessionLoading || scoreLoading || feedLoading || stateLoading) {
    return <LoadingState message="Preparando resumen..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (sessionError || scoreError || feedError || stateError || !session || !myState) {
    return (
      <PageShell title="Fase 3" backTo="/couples">
        <ErrorState message={sessionError ?? scoreError ?? feedError ?? stateError ?? 'No se pudo cargar la fase 3'} />
      </PageShell>
    );
  }

  if (session.status !== 'phase3') {
    return <LoadingState message="Redirigiendo a la fase correcta..." />;
  }

  const pendingValidations = items.filter(
    (item) =>
      item.partnerPrediction &&
      item.partnerPrediction.predicted_free_text &&
      item.myAnswer?.user_id === user.id &&
      !item.partnerPredictionValidation,
  ).length;

  const completedItems = Math.min(myState.reveal_position, items.length);
  const progressPercent = items.length === 0 ? 0 : Math.round((completedItems / items.length) * 100);
  const isFinished = myState.reveal_position >= items.length;

  const finishSummary = async () => {
    setFinishing(true);
    try {
      await userSessionStateService.updateRevealPosition(myState.id, items.length);
      setMyState({ ...myState, reveal_position: items.length });
    } finally {
      setFinishing(false);
    }
  };

  const validatePrediction = async (predictionId: string, isCorrect: boolean) => {
    setValidating(true);
    try {
      await freeTextValidationsService.createValidation({
        predictionId,
        validatorId: user.id,
        isCorrect,
      });
      await reload();
    } finally {
      setValidating(false);
    }
  };

  return (
    <PageShell title="Fase 3" backTo="/couples">
      <div style={{ display: 'grid', gap: 18 }}>
        <section
          style={{
            background: '#fff',
            border: '1px solid #eadff5',
            borderRadius: 20,
            padding: 18,
            display: 'grid',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <strong>Resumen general</strong>
            <span style={{ color: '#6f5a84', fontSize: 14 }}>
              {completedItems}/{items.length}
            </span>
          </div>
          <div style={{ height: 10, borderRadius: 999, background: '#f1ebf8', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #ff9558 0%, #a13ef0 100%)',
              }}
            />
          </div>
          <p style={{ margin: 0, color: '#6f5a84', fontSize: 14 }}>
            Revisa todas las respuestas y valida las predicciones de texto libre pendientes.
          </p>
          {pendingValidations > 0 && (
            <p style={{ margin: 0, color: '#8a5b00', fontSize: 14 }}>
              Validaciones pendientes: {pendingValidations}
            </p>
          )}
        </section>

        <section style={{ display: 'grid', gap: 12 }}>
          {score.map((item) => (
            <article
              key={item.predictorId}
              style={{
                background: '#fff',
                border: '1px solid #eadff5',
                borderRadius: 18,
                padding: 18,
                display: 'grid',
                gap: 6,
              }}
            >
              <strong>{item.displayName}</strong>
              <p style={{ margin: 0, color: '#1f1527', fontSize: 22, fontWeight: 800 }}>
                {item.correct}/10
              </p>
              <p style={{ margin: 0, color: '#6f5a84', fontSize: 14 }}>
                Puntuables: {item.scoredTotal} | Pendientes: {item.pending}
              </p>
            </article>
          ))}
        </section>

        {items.length === 0 ? (
          <section
            style={{
              background: '#fff',
              border: '1px solid #eadff5',
              borderRadius: 22,
              padding: 22,
            }}
          >
            <p style={{ margin: 0, color: '#6f5a84' }}>No hay datos para mostrar en el resumen de esta sesion.</p>
          </section>
        ) : (
          items.map((item) => (
            <RevealCard
              key={item.id}
              item={item}
              currentUserId={user.id}
              onValidate={validatePrediction}
              validating={validating}
            />
          ))
        )}

        <section
          style={{
            background: '#fff',
            border: '1px solid #eadff5',
            borderRadius: 22,
            padding: 22,
            display: 'grid',
            gap: 12,
          }}
        >
          {!isFinished ? (
            <>
              <p style={{ margin: 0, color: '#6f5a84' }}>
                Cuando termines de revisar el resumen, marca esta fase como completada.
              </p>
              <Button onClick={() => void finishSummary()} loading={finishing}>
                Finalizar resumen
              </Button>
            </>
          ) : (
            <p style={{ margin: 0, color: '#6f5a84' }}>
              Resumen completo. Esperando que el partner termine para cerrar la sesion en `completed`.
            </p>
          )}
        </section>
      </div>
    </PageShell>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import PageShell from '../../../shared/components/PageShell';
import LoadingState from '../../../shared/components/LoadingState';
import ErrorState from '../../../shared/components/ErrorState';
import { useAuthSession } from '../../../auth/hooks/useAuthSession';
import { useSession } from '../../../sessions/hooks/useSession';
import { useSessionRealtime } from '../../../sessions/hooks/useSessionRealtime';
import { useSessionQuestions } from '../../../sessions/hooks/useSessionQuestions';
import { userSessionStateService } from '../../../sessions/services/user-session-state.service';
import { usePhase2Predictions } from '../hooks/usePhase2Predictions';
import { usePhase2Progress } from '../hooks/usePhase2Progress';
import PhaseProgress from '../components/PhaseProgress';
import PredictionQuestionCard from '../components/PredictionQuestionCard';
import SessionStatusNotice from '../../../sessions/components/SessionStatusNotice';

export default function Phase2Page() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { user, loading: authLoading } = useAuthSession();
  const { session, loading: sessionLoading, error: sessionError, setSession } = useSession(sessionId);
  const { items, loading: questionsLoading, error: questionsError } = useSessionQuestions(sessionId);
  const [lastFeedback, setLastFeedback] = useState<{
    tone: 'success' | 'error' | 'pending';
    message: string;
  } | null>(null);
  const [transitionNotice, setTransitionNotice] = useState<string | null>(null);
  const redirectTimeoutRef = useRef<number | null>(null);
  const {
    predictions,
    predictedQuestionIds,
    loading: predictionsLoading,
    saving,
    error: predictionsError,
    submitPrediction,
  } = usePhase2Predictions(sessionId, user?.id);

  useSessionRealtime(sessionId, (status) => {
    setSession((current) => (current ? { ...current, status } : current));

    if (status !== 'phase2' && sessionId && redirectTimeoutRef.current === null) {
      setTransitionNotice(status === 'phase3' ? 'Tu pareja completo la fase 2. Pasando a fase 3...' : 'Actualizando sesion...');
      redirectTimeoutRef.current = window.setTimeout(() => {
        navigate(`/session/${sessionId}`, { replace: true });
      }, 1400);
    }
  });

  const progress = usePhase2Progress(items.length, predictions.length);
  const currentItem = items.find((item) => !predictedQuestionIds.has(item.question_id)) ?? null;

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (session?.status && session.status !== 'phase2' && !transitionNotice) {
      navigate(`/session/${session.id}`, { replace: true });
    }
  }, [navigate, session, transitionNotice]);

  useEffect(() => {
    if (!sessionId || !user?.id || !progress.isComplete || !session || session.status !== 'phase2') return;

    let cancelled = false;

    const complete = async () => {
      const myState = await userSessionStateService.getMyState(sessionId, user.id);
      if (!myState || myState.phase2_completed || cancelled) return;
      await userSessionStateService.markPhase2Completed(myState.id);
    };

    void complete();

    return () => {
      cancelled = true;
    };
  }, [progress.isComplete, session, sessionId, user?.id]);

  if (authLoading || sessionLoading || questionsLoading || predictionsLoading) {
    return <LoadingState message="Preparando fase 2..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (sessionError || questionsError || predictionsError || !session) {
    return (
      <PageShell title="Fase 2" backTo="/couples">
        <ErrorState
          message={sessionError ?? questionsError ?? predictionsError ?? 'No se pudo cargar la fase 2'}
        />
      </PageShell>
    );
  }

  if (session.status !== 'phase2') {
    return (
      <PageShell title="Fase 2" backTo="/couples">
        <div style={{ display: 'grid', gap: 18 }}>
          {transitionNotice && <SessionStatusNotice message={transitionNotice} />}
          <LoadingState message="Redirigiendo a la fase correcta..." />
        </div>
      </PageShell>
    );
  }

  if (progress.isComplete || !currentItem) {
    return (
      <PageShell title="Fase 2" backTo="/couples">
        <div style={{ display: 'grid', gap: 18 }}>
          {transitionNotice && <SessionStatusNotice message={transitionNotice} />}
          <PhaseProgress current={progress.predictedQuestions} total={progress.totalQuestions} percent={progress.percent} />
          <div
            style={{
              background: '#fff',
              border: '1px solid #eadff5',
              borderRadius: 22,
              padding: 22,
            }}
          >
            <p style={{ margin: 0, color: '#6f5a84' }}>
              Predicciones completas. Esperando que el partner termine para pasar a `phase3`.
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Fase 2" backTo="/couples">
      <div style={{ display: 'grid', gap: 18 }}>
        {transitionNotice && <SessionStatusNotice message={transitionNotice} />}
        <PhaseProgress
          current={progress.predictedQuestions}
          total={progress.totalQuestions}
          percent={progress.percent}
        />
        {lastFeedback && (
          <section
            style={{
              background:
                lastFeedback.tone === 'success'
                  ? '#e3f8e9'
                  : lastFeedback.tone === 'error'
                    ? '#ffe7ea'
                    : '#fff6df',
              border:
                lastFeedback.tone === 'success'
                  ? '1px solid #b9e8c7'
                  : lastFeedback.tone === 'error'
                    ? '1px solid #f2bcc6'
                    : '1px solid #f0dfac',
              color:
                lastFeedback.tone === 'success'
                  ? '#1e6d37'
                  : lastFeedback.tone === 'error'
                    ? '#8c2334'
                    : '#8a5b00',
              borderRadius: 16,
              padding: 14,
              fontWeight: 700,
            }}
          >
            {lastFeedback.message}
          </section>
        )}
        <PredictionQuestionCard
          key={currentItem.question_id}
          question={currentItem.question}
          position={currentItem.position}
          total={items.length}
          saving={saving}
          onSubmit={async (payload) => {
            const prediction = await submitPrediction({
              questionId: currentItem.question_id,
              predictedOptionId: payload.predictedOptionId,
              predictedFreeText: payload.predictedFreeText,
            });

            if (prediction.is_correct === true) {
              setLastFeedback({ tone: 'success', message: 'Correcto' });
            } else if (prediction.is_correct === false) {
              setLastFeedback({ tone: 'error', message: 'Incorrecto' });
            } else {
              setLastFeedback({ tone: 'pending', message: 'Pendiente de validacion manual' });
            }
          }}
        />
      </div>
    </PageShell>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import PageShell from '../../../shared/components/PageShell';
import LoadingState from '../../../shared/components/LoadingState';
import ErrorState from '../../../shared/components/ErrorState';
import { useAuthSession } from '../../../auth/hooks/useAuthSession';
import { useSession } from '../../../sessions/hooks/useSession';
import { useSessionRealtime } from '../../../sessions/hooks/useSessionRealtime';
import { useSessionQuestions } from '../../../sessions/hooks/useSessionQuestions';
import { usePhase1Answers } from '../hooks/usePhase1Answers';
import { usePhase1Progress } from '../hooks/usePhase1Progress';
import PhaseProgress from '../components/PhaseProgress';
import AnswerQuestionCard from '../components/AnswerQuestionCard';
import { userSessionStateService } from '../../../sessions/services/user-session-state.service';
import SessionStatusNotice from '../../../sessions/components/SessionStatusNotice';

export default function Phase1Page() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { user, loading: authLoading } = useAuthSession();
  const { session, loading: sessionLoading, error: sessionError, setSession } = useSession(sessionId);
  const { items, loading: questionsLoading, error: questionsError } = useSessionQuestions(sessionId);
  const {
    answers,
    answeredQuestionIds,
    loading: answersLoading,
    saving,
    error: answersError,
    submitAnswer,
  } = usePhase1Answers(sessionId, user?.id);
  const [transitionNotice, setTransitionNotice] = useState<string | null>(null);
  const redirectTimeoutRef = useRef<number | null>(null);

  useSessionRealtime(sessionId, (status) => {
    setSession((current) => (current ? { ...current, status } : current));

    if (status !== 'phase1' && sessionId && redirectTimeoutRef.current === null) {
      setTransitionNotice(status === 'phase2' ? 'Tu pareja completo la fase 1. Pasando a fase 2...' : 'Actualizando sesion...');
      redirectTimeoutRef.current = window.setTimeout(() => {
        navigate(`/session/${sessionId}`, { replace: true });
      }, 1400);
    }
  });

  const progress = usePhase1Progress(items.length, answers.length);
  const currentItem = items.find((item) => !answeredQuestionIds.has(item.question_id)) ?? null;

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (session?.status && session.status !== 'phase1' && !transitionNotice) {
      navigate(`/session/${session.id}`, { replace: true });
    }
  }, [navigate, session, transitionNotice]);

  useEffect(() => {
    if (!sessionId || !user?.id || !progress.isComplete || !session || session.status !== 'phase1') return;

    let cancelled = false;

    const complete = async () => {
      const myState = await userSessionStateService.getMyState(sessionId, user.id);
      if (!myState || myState.phase1_completed || cancelled) return;
      await userSessionStateService.markPhase1Completed(myState.id);
    };

    void complete();

    return () => {
      cancelled = true;
    };
  }, [progress.isComplete, session, sessionId, user?.id]);

  if (authLoading || sessionLoading || questionsLoading || answersLoading) {
    return <LoadingState message="Preparando fase 1..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (sessionError || questionsError || answersError || !session) {
    return (
      <PageShell title="Fase 1" backTo="/couples">
        <ErrorState message={sessionError ?? questionsError ?? answersError ?? 'No se pudo cargar la fase 1'} />
      </PageShell>
    );
  }

  if (session.status !== 'phase1') {
    return (
      <PageShell title="Fase 1" backTo="/couples">
        <div style={{ display: 'grid', gap: 18 }}>
          {transitionNotice && <SessionStatusNotice message={transitionNotice} />}
          <LoadingState message="Redirigiendo a la fase correcta..." />
        </div>
      </PageShell>
    );
  }

  if (items.length === 0) {
    return (
      <PageShell title="Fase 1" backTo="/couples">
        <ErrorState message="La sesion no tiene preguntas asignadas o no son visibles para este usuario." />
      </PageShell>
    );
  }

  if (progress.isComplete || !currentItem) {
    return (
      <PageShell title="Fase 1" backTo="/couples">
        <div style={{ display: 'grid', gap: 18 }}>
          {transitionNotice && <SessionStatusNotice message={transitionNotice} />}
          <PhaseProgress current={progress.answeredQuestions} total={progress.totalQuestions} percent={progress.percent} />
          <div
            style={{
              background: '#fff',
              border: '1px solid #eadff5',
              borderRadius: 22,
              padding: 22,
            }}
          >
            <p style={{ margin: 0, color: '#6f5a84' }}>
              Respuestas completas. Esperando que el partner termine para pasar a `phase2`.
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Fase 1" backTo="/couples">
      <div style={{ display: 'grid', gap: 18 }}>
        {transitionNotice && <SessionStatusNotice message={transitionNotice} />}
        <PhaseProgress
          current={progress.answeredQuestions}
          total={progress.totalQuestions}
          percent={progress.percent}
        />
        <AnswerQuestionCard
          key={currentItem.question_id}
          question={currentItem.question}
          position={currentItem.position}
          total={items.length}
          saving={saving}
          onSubmit={async (payload) => {
            await submitAnswer({
              questionId: currentItem.question_id,
              selectedOptionId: payload.selectedOptionId,
              freeText: payload.freeText,
            });
          }}
        />
      </div>
    </PageShell>
  );
}

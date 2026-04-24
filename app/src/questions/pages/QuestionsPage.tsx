import { Link, useLocation } from 'react-router-dom';
import PageShell from '../../shared/components/PageShell';
import LoadingState from '../../shared/components/LoadingState';
import ErrorState from '../../shared/components/ErrorState';
import EmptyState from '../../shared/components/EmptyState';
import Button from '../../shared/components/Button';
import { useCouples } from '../../couples/hooks/useCouples';
import { useQuestions } from '../hooks/useQuestions';
import { useDisableQuestion } from '../hooks/useDisableQuestion';
import QuestionsTable from '../components/QuestionsTable';

export default function QuestionsPage() {
  const location = useLocation();
  const state = location.state as { coupleId?: string } | null;
  const { couples, loading: couplesLoading } = useCouples();
  const coupleId = state?.coupleId ?? couples[0]?.id ?? null;
  const { globalQuestions, coupleQuestions, loading, error, reload } = useQuestions(coupleId);
  const { disableQuestion, loadingId, error: disableError } = useDisableQuestion();

  if (couplesLoading && !coupleId) {
    return <LoadingState message="Cargando pareja..." />;
  }

  if (!coupleId) {
    return (
      <PageShell title="Preguntas" backTo="/couples">
        <EmptyState title="No tienes pareja seleccionada" description="Crea o únete a una pareja primero." />
      </PageShell>
    );
  }

  const onDisable = async (questionId: string) => {
    await disableQuestion(questionId);
    await reload();
  };

  return (
    <PageShell
      title="Preguntas"
      backTo="/couples"
      actions={
        <Link to="/questions/new" state={{ coupleId }} style={{ textDecoration: 'none' }}>
          <Button>Nueva pregunta</Button>
        </Link>
      }
    >
      {(error || disableError) && <ErrorState message={error ?? disableError ?? 'Error'} onRetry={() => void reload()} />}
      {loading && <LoadingState message="Cargando preguntas..." />}
      {!loading && !error && (
        <div style={{ display: 'grid', gap: 18 }}>
          <QuestionsTable title="Globales visibles" items={globalQuestions} />
          {coupleQuestions.length === 0 ? (
            <EmptyState
              title="Todavía no hay preguntas de pareja"
              description="Crea la primera pregunta manual o importa un Excel."
              action={
                <Link to="/questions/new" state={{ coupleId }} style={{ textDecoration: 'none' }}>
                  <Button>Nueva pregunta</Button>
                </Link>
              }
            />
          ) : (
            <QuestionsTable
              title="Preguntas de esta pareja"
              items={coupleQuestions}
              onDisable={onDisable}
              loadingId={loadingId}
            />
          )}
        </div>
      )}
    </PageShell>
  );
}

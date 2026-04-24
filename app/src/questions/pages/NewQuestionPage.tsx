import { useNavigate, useLocation } from 'react-router-dom';
import PageShell from '../../shared/components/PageShell';
import ErrorState from '../../shared/components/ErrorState';
import { useAuthSession } from '../../auth/hooks/useAuthSession';
import { useCouples } from '../../couples/hooks/useCouples';
import { useCreateQuestion } from '../hooks/useCreateQuestion';
import QuestionForm from '../components/QuestionForm';

export default function NewQuestionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { coupleId?: string } | null;
  const { user } = useAuthSession();
  const { couples } = useCouples();
  const { createQuestion, loading, error } = useCreateQuestion();
  const coupleId = state?.coupleId ?? couples[0]?.id ?? null;

  if (!user || !coupleId) {
    return (
      <PageShell title="Nueva pregunta" backTo="/questions">
        <ErrorState message="No hay pareja seleccionada para crear la pregunta." />
      </PageShell>
    );
  }

  return (
    <PageShell title="Nueva pregunta" backTo="/questions">
      {error && <ErrorState message={error} />}
      <QuestionForm
        loading={loading}
        onSubmit={async (payload) => {
          await createQuestion({
            coupleId,
            createdBy: user.id,
            type: payload.type,
            category: payload.category,
            subcategory: payload.subcategory,
            intensity: payload.intensity,
            text: payload.text,
            options: payload.options,
          });
          navigate('/questions', { replace: true, state: { coupleId } });
        }}
      />
    </PageShell>
  );
}

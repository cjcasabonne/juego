import { useState } from 'react';
import Button from '../../../shared/components/Button';
import { resolveOptionText } from '../../../shared/utils/questions';
import type { RevealItem } from '../services/reveal.service';

interface Props {
  item: RevealItem;
  currentUserId: string;
  onValidate: (predictionId: string, isCorrect: boolean) => Promise<void>;
  validating?: boolean;
}

function renderAnswer(question: RevealItem['question'], item: RevealItem['myAnswer']) {
  if (!item) return 'Sin respuesta';
  return item.free_text ?? resolveOptionText(question.options, item.selected_option_id);
}

function renderPrediction(question: RevealItem['question'], item: RevealItem['myPrediction']) {
  if (!item) return 'Sin prediccion';
  return item.predicted_free_text ?? resolveOptionText(question.options, item.predicted_option_id, 'Sin prediccion');
}

export default function RevealCard({ item, currentUserId, onValidate, validating = false }: Props) {
  const [error, setError] = useState<string | null>(null);

  const pendingValidation =
    item.partnerPrediction &&
    item.partnerPrediction.predicted_free_text &&
    item.myAnswer?.user_id === currentUserId &&
    !item.partnerPredictionValidation;

  const validatedResult = item.partnerPredictionValidation?.is_correct;

  const submitValidation = async (isCorrect: boolean) => {
    if (!item.partnerPrediction) return;
    setError(null);
    try {
      await onValidate(item.partnerPrediction.id, isCorrect);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la validacion');
    }
  };

  return (
    <article
      style={{
        background: '#fff',
        border: '1px solid #eadff5',
        borderRadius: 22,
        padding: 22,
        display: 'grid',
        gap: 18,
      }}
    >
      <div style={{ display: 'grid', gap: 8 }}>
        <span style={{ fontSize: 13, color: '#8b6da8', textTransform: 'uppercase', letterSpacing: 1.2 }}>
          Resumen {item.position}
        </span>
        <h2 style={{ margin: 0, fontSize: 28, lineHeight: 1.15 }}>{item.question.text}</h2>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        <section style={{ display: 'grid', gap: 6 }}>
          <strong>Tu respuesta</strong>
          <p style={{ margin: 0, color: '#1f1527' }}>{renderAnswer(item.question, item.myAnswer)}</p>
        </section>

        <section style={{ display: 'grid', gap: 6 }}>
          <strong>Lo que tu partner predijo sobre ti</strong>
          <p style={{ margin: 0, color: '#1f1527' }}>{renderPrediction(item.question, item.partnerPrediction)}</p>
        </section>

        <section style={{ display: 'grid', gap: 6 }}>
          <strong>Respuesta real de tu partner</strong>
          <p style={{ margin: 0, color: '#1f1527' }}>{renderAnswer(item.question, item.partnerAnswer)}</p>
        </section>

        <section style={{ display: 'grid', gap: 6 }}>
          <strong>Tu prediccion sobre tu partner</strong>
          <p style={{ margin: 0, color: '#1f1527' }}>{renderPrediction(item.question, item.myPrediction)}</p>
        </section>
      </div>

      {pendingValidation && (
        <section
          style={{
            display: 'grid',
            gap: 12,
            padding: 16,
            borderRadius: 16,
            background: '#fff6df',
            border: '1px solid #f0dfac',
          }}
        >
          <strong>Valida la prediccion de texto libre sobre tu respuesta</strong>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button
              variant="secondary"
              loading={validating}
              onClick={() => void submitValidation(true)}
              style={{ background: '#e3f8e9', color: '#1e6d37' }}
            >
              Si, acerto
            </Button>
            <Button variant="danger" loading={validating} onClick={() => void submitValidation(false)}>
              No, fallo
            </Button>
          </div>
          {error && <p style={{ margin: 0, color: '#d83a52', fontSize: 14 }}>{error}</p>}
        </section>
      )}

      {validatedResult !== undefined && validatedResult !== null && (
        <section
          style={{
            padding: 16,
            borderRadius: 16,
            background: validatedResult ? '#e3f8e9' : '#ffe7ea',
            color: validatedResult ? '#1e6d37' : '#8c2334',
            fontWeight: 600,
          }}
        >
          Validacion registrada: {validatedResult ? 'acerto' : 'fallo'}
        </section>
      )}
    </article>
  );
}

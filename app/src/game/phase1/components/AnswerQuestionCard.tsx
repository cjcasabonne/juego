import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import type { QuestionOption, QuestionType } from '../../../shared/types/db';
import Button from '../../../shared/components/Button';

interface Props {
  question: {
    id: string;
    text: string;
    type: QuestionType;
    options: QuestionOption[] | null;
  };
  position: number;
  total: number;
  onSubmit: (payload: { selectedOptionId?: string | null; freeText?: string | null }) => Promise<void>;
  saving?: boolean;
}

export default function AnswerQuestionCard({ question, position, total, onSubmit, saving = false }: Props) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(question.type === 'free_text' ? null : question.options?.[0]?.id ?? null);
  const [freeText, setFreeText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const showOptions = question.type !== 'free_text';
  const showFreeText = question.type !== 'multiple_choice';
  const optionList = useMemo(() => question.options ?? [], [question.options]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (question.type === 'multiple_choice' && !selectedOptionId) {
      setError('Selecciona una opción.');
      return;
    }

    if (question.type === 'free_text' && !freeText.trim()) {
      setError('Escribe tu respuesta.');
      return;
    }

    if (question.type === 'hybrid' && !selectedOptionId) {
      setError('Selecciona una opción.');
      return;
    }

    await onSubmit({
      selectedOptionId,
      freeText: showFreeText ? freeText.trim() || null : null,
    });

    setFreeText('');
  };

  return (
    <form
      onSubmit={submit}
      style={{
        background: '#fff',
        border: '1px solid #eadff5',
        borderRadius: 22,
        padding: 22,
        display: 'grid',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#8b6da8', textTransform: 'uppercase', letterSpacing: 1.2 }}>
          Pregunta {position} de {total}
        </span>
        <span
          style={{
            fontSize: 12,
            padding: '4px 8px',
            borderRadius: 999,
            background: '#fff6df',
            color: '#8a5b00',
          }}
        >
          {question.type}
        </span>
      </div>

      <h2 style={{ margin: 0, fontSize: 28, lineHeight: 1.15 }}>{question.text}</h2>

      {showOptions && (
        <div style={{ display: 'grid', gap: 10 }}>
          {optionList.map((option) => (
            <label
              key={option.id}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                border: '1px solid #eadff5',
                borderRadius: 14,
                padding: '14px 16px',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                checked={selectedOptionId === option.id}
                onChange={() => setSelectedOptionId(option.id)}
              />
              <span>{option.text}</span>
            </label>
          ))}
        </div>
      )}

      {showFreeText && (
        <div style={{ display: 'grid', gap: 6 }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#2b2135' }}>
            {question.type === 'free_text' ? 'Tu respuesta' : 'Detalle adicional opcional'}
          </label>
          <textarea
            rows={question.type === 'free_text' ? 5 : 3}
            value={freeText}
            onChange={(event) => setFreeText(event.target.value)}
            style={{
              border: '1px solid #d6ccdf',
              borderRadius: 12,
              padding: '0.8rem 0.9rem',
              font: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>
      )}

      {error && <p style={{ margin: 0, color: '#d83a52', fontSize: 14 }}>{error}</p>}

      <Button type="submit" loading={saving}>
        Guardar respuesta
      </Button>
    </form>
  );
}

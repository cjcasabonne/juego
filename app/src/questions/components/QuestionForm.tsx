import { useMemo, useState } from 'react';
import type { QuestionCategory, QuestionOption, QuestionType } from '../../shared/types/db';
import Button from '../../shared/components/Button';
import Input from '../../shared/components/Input';

interface QuestionDraft {
  type: QuestionType;
  category: QuestionCategory;
  intensity: number;
  text: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
}

interface Props {
  onSubmit: (payload: {
    type: QuestionType;
    category: QuestionCategory;
    intensity: number;
    text: string;
    options: QuestionOption[] | null;
  }) => Promise<void>;
  loading?: boolean;
}

const initialState: QuestionDraft = {
  type: 'multiple_choice',
  category: 'light',
  intensity: 1,
  text: '',
  option1: '',
  option2: '',
  option3: '',
  option4: '',
};

function buildOptions(draft: QuestionDraft): QuestionOption[] | null {
  if (draft.type === 'free_text') return null;

  return [draft.option1, draft.option2, draft.option3, draft.option4]
    .map((text, index) => ({ id: `opt_${index + 1}`, text: text.trim() }))
    .filter((option) => option.text.length > 0);
}

export default function QuestionForm({ onSubmit, loading = false }: Props) {
  const [draft, setDraft] = useState<QuestionDraft>(initialState);
  const [error, setError] = useState<string | null>(null);

  const showOptions = draft.type !== 'free_text';
  const options = useMemo(() => buildOptions(draft), [draft]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!draft.text.trim()) {
      setError('El texto de la pregunta es obligatorio.');
      return;
    }

    if (showOptions && (!options || options.length < 2)) {
      setError('Debes definir al menos 2 opciones.');
      return;
    }

    await onSubmit({
      type: draft.type,
      category: draft.category,
      intensity: draft.intensity,
      text: draft.text,
      options,
    });

    setDraft(initialState);
  };

  const setField = <K extends keyof QuestionDraft>(key: K, value: QuestionDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  return (
    <form
      onSubmit={submit}
      style={{
        display: 'grid',
        gap: 16,
        background: '#fff',
        border: '1px solid #eadff5',
        borderRadius: 22,
        padding: 22,
      }}
    >
      <div style={{ display: 'grid', gap: 6 }}>
        <label style={{ fontSize: 14, fontWeight: 600 }}>Tipo</label>
        <select
          value={draft.type}
          onChange={(event) => setField('type', event.target.value as QuestionType)}
          style={{ border: '1px solid #d6ccdf', borderRadius: 12, padding: '0.8rem 0.9rem' }}
        >
          <option value="multiple_choice">multiple_choice</option>
          <option value="hybrid">hybrid</option>
          <option value="free_text">free_text</option>
        </select>
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        <label style={{ fontSize: 14, fontWeight: 600 }}>Categoría</label>
        <select
          value={draft.category}
          onChange={(event) => setField('category', event.target.value as QuestionCategory)}
          style={{ border: '1px solid #d6ccdf', borderRadius: 12, padding: '0.8rem 0.9rem' }}
        >
          <option value="light">light</option>
          <option value="flirty">flirty</option>
          <option value="spicy">spicy</option>
          <option value="savage">savage</option>
        </select>
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        <label style={{ fontSize: 14, fontWeight: 600 }}>Intensidad</label>
        <select
          value={draft.intensity}
          onChange={(event) => setField('intensity', Number(event.target.value))}
          style={{ border: '1px solid #d6ccdf', borderRadius: 12, padding: '0.8rem 0.9rem' }}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        <label style={{ fontSize: 14, fontWeight: 600 }}>Pregunta</label>
        <textarea
          value={draft.text}
          onChange={(event) => setField('text', event.target.value)}
          rows={4}
          style={{
            border: '1px solid #d6ccdf',
            borderRadius: 12,
            padding: '0.8rem 0.9rem',
            font: 'inherit',
            resize: 'vertical',
          }}
        />
      </div>

      {showOptions && (
        <div style={{ display: 'grid', gap: 10 }}>
          <Input label="Opción 1" value={draft.option1} onChange={(event) => setField('option1', event.target.value)} />
          <Input label="Opción 2" value={draft.option2} onChange={(event) => setField('option2', event.target.value)} />
          <Input label="Opción 3" value={draft.option3} onChange={(event) => setField('option3', event.target.value)} />
          <Input label="Opción 4" value={draft.option4} onChange={(event) => setField('option4', event.target.value)} />
        </div>
      )}

      {error && <p style={{ margin: 0, color: '#d83a52', fontSize: 14 }}>{error}</p>}

      <Button type="submit" loading={loading}>
        Guardar pregunta
      </Button>
    </form>
  );
}

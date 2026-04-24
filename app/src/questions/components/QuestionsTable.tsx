import type { Database } from '../../shared/types/db';
import Button from '../../shared/components/Button';

type QuestionRow = Database['public']['Tables']['questions']['Row'];

interface Props {
  title: string;
  items: QuestionRow[];
  onDisable?: (questionId: string) => Promise<void>;
  loadingId?: string | null;
}

function renderOptions(options: QuestionRow['options']) {
  if (!options || options.length === 0) return 'Sin opciones';
  return options.map((option) => option.text).join(' | ');
}

export default function QuestionsTable({ title, items, onDisable, loadingId }: Props) {
  return (
    <section
      style={{
        background: '#fff',
        border: '1px solid #eadff5',
        borderRadius: 22,
        padding: 22,
        display: 'grid',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>{title}</h2>
        <span style={{ fontSize: 13, color: '#6f5a84' }}>{items.length} preguntas</span>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((item) => (
          <article
            key={item.id}
            style={{
              border: '1px solid #efe6f6',
              borderRadius: 16,
              padding: 16,
              background: item.is_active ? '#fff' : '#faf7fd',
              opacity: item.is_active ? 1 : 0.65,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 999, background: '#f4edff' }}>{item.type}</span>
                <span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 999, background: '#fff6df' }}>{item.category}</span>
                <span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 999, background: '#edf8ff' }}>intensidad {item.intensity}</span>
              </div>
              {onDisable && item.is_active && (
                <Button
                  variant="secondary"
                  loading={loadingId === item.id}
                  onClick={() => void onDisable(item.id)}
                >
                  Desactivar
                </Button>
              )}
            </div>

            <p style={{ margin: 0, color: '#1f1527', fontWeight: 600 }}>{item.text}</p>
            <p style={{ margin: '8px 0 0', color: '#6f5a84', fontSize: 13 }}>{renderOptions(item.options)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

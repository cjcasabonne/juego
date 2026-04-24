import type { ImportResult } from '../../shared/types/domain';

interface Props {
  result: ImportResult;
}

export default function ImportSummary({ result }: Props) {
  return (
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
      <h2 style={{ margin: 0, fontSize: 22 }}>Resultado de importación</h2>
      <p style={{ margin: 0, color: '#6f5a84' }}>Leídas: {result.read}</p>
      <p style={{ margin: 0, color: '#6f5a84' }}>Ignoradas por is_example: {result.skippedExample}</p>
      <p style={{ margin: 0, color: '#6f5a84' }}>Insertadas: {result.inserted}</p>
      <p style={{ margin: 0, color: '#6f5a84' }}>Duplicadas: {result.duplicates}</p>
      <p style={{ margin: 0, color: '#6f5a84' }}>Rechazadas: {result.rejected}</p>

      {result.errors.length > 0 && (
        <div style={{ display: 'grid', gap: 6 }}>
          {result.errors.map((item) => (
            <p key={item} style={{ margin: 0, color: '#d83a52', fontSize: 14 }}>
              {item}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}

interface Props {
  current: number;
  total: number;
  percent: number;
}

export default function PhaseProgress({ current, total, percent }: Props) {
  return (
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
        <strong>Progreso</strong>
        <span style={{ color: '#6f5a84', fontSize: 14 }}>
          {current}/{total}
        </span>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: '#f1ebf8', overflow: 'hidden' }}>
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #ff9558 0%, #a13ef0 100%)',
          }}
        />
      </div>
    </section>
  );
}

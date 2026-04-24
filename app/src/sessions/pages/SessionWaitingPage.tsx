import PageShell from '../../shared/components/PageShell';
import LoadingState from '../../shared/components/LoadingState';

interface Props {
  title: string;
  subtitle: string;
}

export default function SessionWaitingPage({ title, subtitle }: Props) {
  return (
    <PageShell title={title} backTo="/couples">
      <div
        style={{
          background: '#fff',
          border: '1px solid #eadff5',
          borderRadius: 22,
          padding: 22,
        }}
      >
        <p style={{ margin: 0, color: '#6f5a84' }}>{subtitle}</p>
        <LoadingState message="Esperando interacción de fase..." />
      </div>
    </PageShell>
  );
}

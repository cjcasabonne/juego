import { Link } from 'react-router-dom';
import type { CoupleWithMembers } from '../hooks/useCouples';
import Button from '../../shared/components/Button';
import InviteCodeBox from './InviteCodeBox';

interface Props {
  couple: CoupleWithMembers;
  onCreateSession: (coupleId: string) => Promise<void>;
  sessionLoadingId?: string | null;
}

export default function CoupleCard({ couple, onCreateSession, sessionLoadingId }: Props) {
  const ready = couple.members.length === 2;

  return (
    <article
      style={{
        background: '#fff',
        border: '1px solid #eadff5',
        borderRadius: 22,
        padding: 20,
        display: 'grid',
        gap: 16,
        boxShadow: '0 18px 45px rgba(114, 72, 141, 0.08)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>{couple.name || 'Pareja sin nombre'}</h2>
          <p style={{ margin: '8px 0 0', color: '#6f5a84', fontSize: 14 }}>
            Miembros: {couple.members.length}/2
          </p>
        </div>
        <span
          style={{
            padding: '6px 10px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            background: ready ? '#e3f8e9' : '#fff2df',
            color: ready ? '#1e6d37' : '#8a5b00',
          }}
        >
          {ready ? 'Lista para sesión' : 'Pendiente de partner'}
        </span>
      </div>

      <InviteCodeBox inviteCode={couple.invite_code} />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link to="/questions" state={{ coupleId: couple.id }} style={{ textDecoration: 'none' }}>
          <Button variant="secondary">Preguntas</Button>
        </Link>
        <Link to="/import/questions" state={{ coupleId: couple.id }} style={{ textDecoration: 'none' }}>
          <Button variant="secondary">Importar Excel</Button>
        </Link>
        <Button disabled={!ready} loading={sessionLoadingId === couple.id} onClick={() => void onCreateSession(couple.id)}>
          Crear sesión
        </Button>
      </div>
    </article>
  );
}

import { Link } from 'react-router-dom';
import type { Database } from '../../shared/types/db';
import Button from '../../shared/components/Button';

type GameSessionRow = Database['public']['Tables']['game_sessions']['Row'];

interface Props {
  session: GameSessionRow;
  sessionNumber?: number;
  coupleName?: string | null;
}

export default function ActiveSessionCard({ session, sessionNumber, coupleName }: Props) {
  const targetPath =
    session.status === 'completed' ? `/session/${session.id}/summary` : `/session/${session.id}/${session.status}`;

  return (
    <article
      style={{
        background: '#fff',
        border: '1px solid #eadff5',
        borderRadius: 18,
        padding: 18,
        display: 'grid',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <strong>Sesion {sessionNumber ?? '-'} - {coupleName?.trim() || 'Pareja sin nombre'}</strong>
        <span style={{ fontSize: 13, color: '#6f5a84' }}>{session.status}</span>
      </div>
      <p style={{ margin: 0, color: '#6f5a84', fontSize: 14 }}>
        Creada: {new Date(session.created_at).toLocaleString()}
      </p>
      <Link to={targetPath} style={{ textDecoration: 'none' }}>
        <Button>Continuar</Button>
      </Link>
    </article>
  );
}

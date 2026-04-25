import { Link } from 'react-router-dom';
import { useState } from 'react';
import type { CoupleWithMembers } from '../hooks/useCouples';
import { questionTaxonomy } from '../../shared/catalog/question-taxonomy';
import type { QuestionCategory } from '../../shared/types/db';
import Button from '../../shared/components/Button';
import InviteCodeBox from './InviteCodeBox';

interface Props {
  couple: CoupleWithMembers;
  onCreateSession: (coupleId: string, category: QuestionCategory) => Promise<void>;
  sessionLoadingId?: string | null;
}

export default function CoupleCard({ couple, onCreateSession, sessionLoadingId }: Props) {
  const ready = couple.members.length === 2;
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory>('sexy-questions');

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
          {ready ? 'Lista para sesion' : 'Pendiente de partner'}
        </span>
      </div>

      <InviteCodeBox inviteCode={couple.invite_code} />

      <div style={{ display: 'grid', gap: 6 }}>
        <label style={{ fontSize: 14, fontWeight: 600, color: '#34114f' }}>Categoria para jugar</label>
        <select
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value as QuestionCategory)}
          style={{ border: '1px solid #d6ccdf', borderRadius: 12, padding: '0.8rem 0.9rem', background: '#fff' }}
        >
          {questionTaxonomy.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.label}
            </option>
          ))}
        </select>
        <span style={{ fontSize: 13, color: '#6f5a84' }}>
          La sesion usara solo preguntas activas de esta categoria.
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link to="/questions" state={{ coupleId: couple.id }} style={{ textDecoration: 'none' }}>
          <Button variant="secondary">Preguntas</Button>
        </Link>
        <Link to="/import/questions" state={{ coupleId: couple.id }} style={{ textDecoration: 'none' }}>
          <Button variant="secondary">Importar Excel</Button>
        </Link>
        <Button
          disabled={!ready}
          loading={sessionLoadingId === couple.id}
          onClick={() => void onCreateSession(couple.id, selectedCategory)}
        >
          Crear sesion
        </Button>
      </div>
    </article>
  );
}

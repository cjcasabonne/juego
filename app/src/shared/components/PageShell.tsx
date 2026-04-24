import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  title: string;
  backTo?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function PageShell({ title, backTo, actions, children }: Props) {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #fff9f2 0%, #fff 45%, #f9f4ff 100%)' }}>
      <header
        style={{
          borderBottom: '1px solid #e8dff2',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        {backTo && (
          <button
            onClick={() => navigate(backTo)}
            aria-label="Volver"
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: 14,
              color: '#6f5a84',
              cursor: 'pointer',
            }}
          >
            Volver
          </button>
        )}
        <h1 style={{ flex: 1, margin: 0, fontSize: 22, color: '#1f1527' }}>{title}</h1>
        {actions}
      </header>
      <main style={{ maxWidth: 920, margin: '0 auto', padding: '28px 20px 48px' }}>{children}</main>
    </div>
  );
}

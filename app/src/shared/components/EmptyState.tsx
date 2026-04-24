import type { ReactNode } from 'react';

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ title, description, action }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 0',
        gap: 12,
        textAlign: 'center',
      }}
    >
      <p style={{ margin: 0, color: '#1f1527', fontWeight: 700 }}>{title}</p>
      {description && <p style={{ margin: 0, color: '#6f5a84', fontSize: 14 }}>{description}</p>}
      {action}
    </div>
  );
}

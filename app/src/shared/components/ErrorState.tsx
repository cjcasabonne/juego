interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 0',
        gap: 12,
      }}
    >
      <p style={{ margin: 0, color: '#d83a52', fontWeight: 700 }}>Error</p>
      <p style={{ margin: 0, color: '#6f5a84', fontSize: 14 }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#7f2bcc',
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

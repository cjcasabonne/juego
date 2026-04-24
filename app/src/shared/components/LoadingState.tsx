interface Props {
  message?: string;
}

export default function LoadingState({ message = 'Cargando...' }: Props) {
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
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          border: '4px solid #eadbf8',
          borderTopColor: '#a13ef0',
          animation: 'spin 1s linear infinite',
        }}
      />
      <p style={{ margin: 0, color: '#6f5a84', fontSize: 14 }}>{message}</p>
    </div>
  );
}

interface Props {
  inviteCode: string;
}

export default function InviteCodeBox({ inviteCode }: Props) {
  return (
    <div
      style={{
        background: '#fff6df',
        border: '1px solid #f0dfac',
        borderRadius: 16,
        padding: 16,
      }}
    >
      <p style={{ margin: 0, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, color: '#8b6a0d' }}>
        Invite code
      </p>
      <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 800, letterSpacing: 4, color: '#553c00' }}>
        {inviteCode}
      </p>
    </div>
  );
}

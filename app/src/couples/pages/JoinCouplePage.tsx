import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../shared/components/PageShell';
import Input from '../../shared/components/Input';
import Button from '../../shared/components/Button';
import ErrorState from '../../shared/components/ErrorState';
import { useJoinCouple } from '../hooks/useJoinCouple';

export default function JoinCouplePage() {
  const navigate = useNavigate();
  const { joinCouple, loading, error } = useJoinCouple();
  const [inviteCode, setInviteCode] = useState('');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await joinCouple(inviteCode);
    navigate('/couples', { replace: true });
  };

  return (
    <PageShell title="Unirse por código" backTo="/couples">
      <form
        onSubmit={onSubmit}
        style={{
          maxWidth: 560,
          margin: '0 auto',
          display: 'grid',
          gap: 16,
          background: '#fff',
          border: '1px solid #eadff5',
          borderRadius: 22,
          padding: 22,
        }}
      >
        <Input
          label="Invite code"
          placeholder="ABCD2345"
          value={inviteCode}
          onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
          maxLength={16}
        />
        <Button type="submit" loading={loading} disabled={inviteCode.trim().length < 6}>
          Unirme a la pareja
        </Button>
        {error && <ErrorState message={error} />}
      </form>
    </PageShell>
  );
}

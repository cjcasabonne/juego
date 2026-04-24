import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../shared/components/PageShell';
import Input from '../../shared/components/Input';
import Button from '../../shared/components/Button';
import ErrorState from '../../shared/components/ErrorState';
import { useCreateCouple } from '../hooks/useCreateCouple';

export default function CreateCouplePage() {
  const navigate = useNavigate();
  const { createCouple, loading, error } = useCreateCouple();
  const [name, setName] = useState('');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await createCouple(name);
    navigate('/couples', { replace: true });
  };

  return (
    <PageShell title="Crear pareja" backTo="/couples">
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
          label="Nombre"
          placeholder="Ej. Nosotros"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <p style={{ margin: 0, color: '#6f5a84', fontSize: 14 }}>
          Al crearla se genera el invite code y tu usuario se une automáticamente.
        </p>
        <Button type="submit" loading={loading}>
          Crear pareja
        </Button>
        {error && <ErrorState message={error} />}
      </form>
    </PageShell>
  );
}

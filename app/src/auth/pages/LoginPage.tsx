import type { CSSProperties, FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuthSession } from '../hooks/useAuthSession';
import Button from '../../shared/components/Button';
import Input from '../../shared/components/Input';
import ErrorState from '../../shared/components/ErrorState';

const cardStyle: CSSProperties = {
  maxWidth: 420,
  margin: '56px auto',
  background: '#fff',
  border: '1px solid #eadff5',
  borderRadius: 24,
  padding: 28,
  boxShadow: '0 24px 60px rgba(114, 72, 141, 0.10)',
};

type AuthMode = 'password_signin' | 'password_signup' | 'magic_link';

const modeCopy: Record<AuthMode, { title: string; subtitle: string; button: string }> = {
  password_signin: {
    title: 'Entrar con clave',
    subtitle: 'Usa email y contrasena para continuar tus sesiones.',
    button: 'Entrar',
  },
  password_signup: {
    title: 'Crear cuenta',
    subtitle: 'Crea tu usuario con email, display name y contrasena.',
    button: 'Crear cuenta',
  },
  magic_link: {
    title: 'Entrar con magic link',
    subtitle: 'Usa enlace por correo cuando no quieras escribir la clave.',
    button: 'Enviar enlace de acceso',
  },
};

export default function LoginPage() {
  const { session, loading } = useAuthSession();
  const [mode, setMode] = useState<AuthMode>('password_signin');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isValidEmail = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);
  const requiresPassword = mode !== 'magic_link';
  const requiresDisplayName = mode !== 'password_signin';
  const isValidPassword = password.trim().length >= 6;

  if (!loading && session) {
    return <Navigate to="/couples" replace />;
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSent(false);
    setSubmitting(true);

    try {
      const payload = {
        email: email.trim(),
        displayName: displayName.trim() || undefined,
        password: password.trim(),
      };

      if (mode === 'password_signin') {
        await authService.signInWithPassword(payload);
      } else if (mode === 'password_signup') {
        await authService.signUpWithPassword(payload);
      } else {
        await authService.signInWithOtp(payload);
        setSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesion');
    } finally {
      setSubmitting(false);
    }
  };

  const copy = modeCopy[mode];
  const canSubmit =
    isValidEmail &&
    (!requiresPassword || isValidPassword) &&
    (!requiresDisplayName || displayName.trim().length > 0);

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 20,
        background: 'radial-gradient(circle at top, #fff3d8 0%, #fff 34%, #f8f2ff 100%)',
      }}
    >
      <div style={cardStyle}>
        <p style={{ margin: 0, color: '#8b6da8', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.2 }}>
          Acceso
        </p>
        <h1 style={{ margin: '10px 0 12px', fontSize: 34, lineHeight: 1.05 }}>{copy.title}</h1>
        <p style={{ margin: 0, color: '#6f5a84', fontSize: 15 }}>{copy.subtitle}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 20 }}>
          <Button type="button" variant={mode === 'password_signin' ? 'primary' : 'secondary'} onClick={() => setMode('password_signin')}>
            Entrar
          </Button>
          <Button type="button" variant={mode === 'password_signup' ? 'primary' : 'secondary'} onClick={() => setMode('password_signup')}>
            Crear
          </Button>
          <Button type="button" variant={mode === 'magic_link' ? 'primary' : 'secondary'} onClick={() => setMode('magic_link')}>
            Magic link
          </Button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 14, marginTop: 24 }}>
          <Input
            label="Email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={email && !isValidEmail ? 'Ingresa un email valido.' : undefined}
          />

          {requiresDisplayName && (
            <Input
              label="Display name"
              placeholder="Como quieres aparecer"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          )}

          {requiresPassword && (
            <Input
              label="Clave"
              type="password"
              placeholder="Minimo 6 caracteres"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={password && !isValidPassword ? 'La clave debe tener al menos 6 caracteres.' : undefined}
            />
          )}

          <Button type="submit" loading={submitting} disabled={!canSubmit}>
            {copy.button}
          </Button>
        </form>

        {sent && (
          <div
            style={{
              marginTop: 18,
              padding: 14,
              borderRadius: 14,
              background: '#f3ecff',
              color: '#4b2b6b',
              fontSize: 14,
            }}
          >
            Revisa tu correo y abre el enlace para completar el acceso.
          </div>
        )}

        {mode === 'password_signup' && !sent && (
          <p style={{ margin: '16px 0 0', color: '#6f5a84', fontSize: 13 }}>
            Si tu proyecto exige confirmacion de email, Supabase puede pedir verificacion antes del primer ingreso.
          </p>
        )}

        {error && <ErrorState message={error} />}
      </div>
    </div>
  );
}

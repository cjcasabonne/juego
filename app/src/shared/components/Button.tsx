import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

const variants: Record<NonNullable<Props['variant']>, CSSProperties> = {
  primary: { background: '#a13ef0', color: '#fff' },
  secondary: { background: '#f2ecff', color: '#34114f' },
  danger: { background: '#d83a52', color: '#fff' },
};

export default function Button({
  children,
  variant = 'primary',
  loading = false,
  disabled,
  className,
  style,
  ...rest
}: Props) {
  return (
    <button
      className={className}
      disabled={disabled || loading}
      style={{
        border: 'none',
        borderRadius: 12,
        padding: '0.8rem 1rem',
        fontSize: 14,
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.65 : 1,
        transition: 'opacity 0.2s ease',
        ...variants[variant],
        ...style,
      }}
      {...rest}
    >
      {loading ? 'Cargando...' : children}
    </button>
  );
}

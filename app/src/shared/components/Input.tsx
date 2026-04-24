import type { CSSProperties, InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className, id, style, ...rest }: Props) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  const inputStyle: CSSProperties = {
    border: `1px solid ${error ? '#d83a52' : '#d6ccdf'}`,
    borderRadius: 12,
    padding: '0.8rem 0.9rem',
    fontSize: 14,
    outline: 'none',
    background: '#fff',
    width: '100%',
    ...style,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label htmlFor={inputId} style={{ fontSize: 14, fontWeight: 600, color: '#2b2135' }}>
          {label}
        </label>
      )}
      <input id={inputId} className={className} style={inputStyle} {...rest} />
      {error && <p style={{ fontSize: 12, color: '#d83a52', margin: 0 }}>{error}</p>}
    </div>
  );
}

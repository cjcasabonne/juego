interface Props {
  onSelect: (file: File) => void;
}

export default function ImportDropzone({ onSelect }: Props) {
  return (
    <label
      style={{
        display: 'grid',
        placeItems: 'center',
        gap: 8,
        padding: 28,
        border: '2px dashed #d6ccdf',
        borderRadius: 18,
        background: '#fff',
        cursor: 'pointer',
      }}
    >
      <strong>Seleccionar Excel</strong>
      <span style={{ color: '#6f5a84', fontSize: 14 }}>Hoja requerida: `Preguntas`</span>
      <input
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onSelect(file);
        }}
      />
    </label>
  );
}

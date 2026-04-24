import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageShell from '../../shared/components/PageShell';
import Button from '../../shared/components/Button';
import ErrorState from '../../shared/components/ErrorState';
import LoadingState from '../../shared/components/LoadingState';
import { useCouples } from '../../couples/hooks/useCouples';
import { useAuthSession } from '../../auth/hooks/useAuthSession';
import ImportDropzone from '../components/ImportDropzone';
import ImportSummary from '../components/ImportSummary';
import { useExcelImport } from '../hooks/useExcelImport';
import { downloadQuestionsTemplate } from '../services/import-template.service';

export default function ImportQuestionsPage() {
  const location = useLocation();
  const state = location.state as { coupleId?: string } | null;
  const { couples } = useCouples();
  const { user } = useAuthSession();
  const { importFile, loading, error, result } = useExcelImport();
  const [file, setFile] = useState<File | null>(null);
  const [scope, setScope] = useState<string>(state?.coupleId ?? 'global');

  const coupleId = useMemo(() => (scope === 'global' ? null : scope), [scope]);

  return (
    <PageShell title="Importar preguntas" backTo="/couples">
      <div style={{ display: 'grid', gap: 18 }}>
        <section
          style={{
            background: '#fff',
            border: '1px solid #eadff5',
            borderRadius: 22,
            padding: 22,
            display: 'grid',
            gap: 14,
          }}
        >
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 600 }}>Scope de importacion</label>
            <select
              value={scope}
              onChange={(event) => setScope(event.target.value)}
              style={{ border: '1px solid #d6ccdf', borderRadius: 12, padding: '0.8rem 0.9rem' }}
            >
              <option value="global">Global</option>
              {couples.map((couple) => (
                <option key={couple.id} value={couple.id}>
                  {couple.name || couple.invite_code}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              padding: '12px 14px',
              border: '1px solid #eadff5',
              borderRadius: 16,
              background: '#faf7ff',
            }}
          >
            <div style={{ display: 'grid', gap: 4 }}>
              <strong>Plantilla de importacion</strong>
              <span style={{ color: '#6f5a84', fontSize: 14 }}>
                Descarga un Excel listo con hoja `Preguntas` y columnas `category + subcategory`.
              </span>
            </div>
            <Button variant="secondary" type="button" onClick={downloadQuestionsTemplate}>
              Descargar plantilla
            </Button>
          </div>

          <ImportDropzone onSelect={setFile} />

          {file && <p style={{ margin: 0, color: '#6f5a84' }}>Archivo seleccionado: {file.name}</p>}

          <Button
            disabled={!file || !user}
            loading={loading}
            onClick={() => file && user && void importFile({ file, coupleId, createdBy: user.id })}
          >
            Ejecutar importacion
          </Button>
        </section>

        {loading && <LoadingState message="Importando preguntas..." />}
        {error && <ErrorState message={error} />}
        {result && <ImportSummary result={result} />}
      </div>
    </PageShell>
  );
}

import { useState } from 'react';
import type { ImportResult } from '../../shared/types/domain';
import { parseQuestionsExcel } from '../parsers/excel.parser';
import { validateImportRow, type ValidatedImportRow } from '../validators/import.validator';
import { importService } from '../services/import.service';

export function useExcelImport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const importFile = async (params: { file: File; coupleId: string | null; createdBy: string | null }) => {
    setLoading(true);
    setError(null);

    try {
      const parsed = await parseQuestionsExcel(params.file);
      const validRows: ValidatedImportRow[] = [];
      const errors: string[] = [];
      let skippedExample = 0;

      parsed.forEach((row, index) => {
        if (row.isExample) {
          skippedExample += 1;
          return;
        }

        const validated = validateImportRow(row, index);
        if (validated.error) {
          errors.push(validated.error);
          return;
        }

        if (validated.value) {
          validRows.push(validated.value);
        }
      });

      const summary = await importService.importQuestions({
        coupleId: params.coupleId,
        createdBy: params.createdBy,
        rows: validRows,
        skippedExample,
        errors,
      });

      setResult(summary);
      return summary;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo importar el Excel';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { importFile, loading, error, result };
}

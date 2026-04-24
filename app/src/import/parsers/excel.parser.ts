import * as XLSX from 'xlsx';
import type { ImportRow } from '../../shared/types/domain';

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  return String(value ?? '').trim().toLowerCase() === 'true';
}

export async function parseQuestionsExcel(file: File): Promise<ImportRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets.Preguntas;
  if (!sheet) throw new Error('El archivo no contiene la hoja "Preguntas".');

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  return rows.map((row) => ({
    questionId: String(row.question_id ?? '').trim(),
    isExample: normalizeBoolean(row.is_example),
    type: String(row.type ?? '').trim() as ImportRow['type'],
    category: String(row.category ?? '').trim() as ImportRow['category'],
    intensity: Number(row.intensity ?? 0),
    text: String(row.text ?? '').trim(),
    option1: String(row.option_1 ?? '').trim(),
    option2: String(row.option_2 ?? '').trim(),
    option3: String(row.option_3 ?? '').trim(),
    option4: String(row.option_4 ?? '').trim(),
  }));
}

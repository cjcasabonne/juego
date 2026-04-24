import type { ImportRow } from '../../shared/types/domain';
import type { QuestionCategory, QuestionOption, QuestionType } from '../../shared/types/db';

const validTypes: QuestionType[] = ['multiple_choice', 'hybrid', 'free_text'];
const validCategories: QuestionCategory[] = ['light', 'flirty', 'spicy', 'savage'];

export interface ValidatedImportRow {
  questionId: string | null;
  type: QuestionType;
  category: QuestionCategory;
  intensity: number;
  text: string;
  options: QuestionOption[] | null;
}

export function validateImportRow(row: ImportRow, index: number): { value?: ValidatedImportRow; error?: string } {
  if (row.isExample) {
    return {};
  }

  if (!validTypes.includes(row.type)) {
    return { error: `Fila ${index + 2}: type inválido.` };
  }

  if (!validCategories.includes(row.category)) {
    return { error: `Fila ${index + 2}: category inválido.` };
  }

  if (!Number.isInteger(row.intensity) || row.intensity < 1 || row.intensity > 5) {
    return { error: `Fila ${index + 2}: intensity debe estar entre 1 y 5.` };
  }

  if (!row.text || row.text.length > 500) {
    return { error: `Fila ${index + 2}: text es obligatorio y debe tener máximo 500 caracteres.` };
  }

  if (row.type === 'free_text') {
    return {
      value: {
        questionId: row.questionId || null,
        type: row.type,
        category: row.category,
        intensity: row.intensity,
        text: row.text,
        options: null,
      },
    };
  }

  const options = [row.option1, row.option2, row.option3, row.option4]
    .map((text, indexOption) => ({ id: `opt_${indexOption + 1}`, text: text.trim() }))
    .filter((option) => option.text.length > 0);

  if (options.length < 2) {
    return { error: `Fila ${index + 2}: se requieren al menos 2 opciones.` };
  }

  return {
    value: {
      questionId: row.questionId || null,
      type: row.type,
      category: row.category,
      intensity: row.intensity,
      text: row.text,
      options,
    },
  };
}

import type { ImportRow } from '../../shared/types/domain';
import { isValidQuestionCategory, isValidQuestionSubcategoryPair } from '../../shared/catalog/question-taxonomy';
import type { QuestionCategory, QuestionOption, QuestionSubcategory, QuestionType } from '../../shared/types/db';

const validTypes: QuestionType[] = ['multiple_choice', 'hybrid', 'free_text'];

export interface ValidatedImportRow {
  questionId: string | null;
  type: QuestionType;
  category: QuestionCategory;
  subcategory: QuestionSubcategory;
  intensity: number;
  text: string;
  options: QuestionOption[] | null;
}

export function validateImportRow(row: ImportRow, index: number): { value?: ValidatedImportRow; error?: string } {
  if (row.isExample) {
    return {};
  }

  if (!validTypes.includes(row.type)) {
    return { error: `Fila ${index + 2}: type invalido.` };
  }

  if (!isValidQuestionCategory(row.category)) {
    return { error: `Fila ${index + 2}: category invalido.` };
  }

  if (!isValidQuestionSubcategoryPair(row.category, row.subcategory)) {
    return { error: `Fila ${index + 2}: subcategory invalida para la category indicada.` };
  }

  if (!Number.isInteger(row.intensity) || row.intensity < 1 || row.intensity > 5) {
    return { error: `Fila ${index + 2}: intensity debe estar entre 1 y 5.` };
  }

  if (!row.text || row.text.length > 500) {
    return { error: `Fila ${index + 2}: text es obligatorio y debe tener maximo 500 caracteres.` };
  }

  if (row.type === 'free_text') {
    return {
      value: {
        questionId: row.questionId || null,
        type: row.type,
        category: row.category,
        subcategory: row.subcategory,
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
      subcategory: row.subcategory,
      intensity: row.intensity,
      text: row.text,
      options,
    },
  };
}

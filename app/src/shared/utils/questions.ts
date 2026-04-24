import type { QuestionOption } from '../types/db';

export function resolveOptionText(
  options: QuestionOption[] | null | undefined,
  optionId: string | null | undefined,
  fallback = 'Sin respuesta',
) {
  if (!optionId) return fallback;

  const match = options?.find((option) => option.id === optionId);
  return match?.text ?? optionId;
}

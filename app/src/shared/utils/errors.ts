export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Error desconocido';
}

export function parseSupabaseError(error: unknown): string {
  const msg = getErrorMessage(error);
  // Map known Supabase/DB error codes to user-friendly messages
  if (msg.includes('couple_full')) return 'La pareja ya tiene 2 miembros.';
  if (msg.includes('couple_incomplete')) return 'La pareja necesita 2 miembros para iniciar una sesión.';
  if (msg.includes('unauthorized')) return 'No tienes permiso para realizar esta acción.';
  if (msg.includes('invalid_code')) return 'Código de invitación no válido.';
  if (msg.includes('expired_code')) return 'El código de invitación expiró.';
  if (msg.includes('already_member')) return 'Ya eres miembro de esta pareja.';
  if (msg.includes('insufficient_questions_pool')) return 'No hay suficientes preguntas activas para iniciar la sesión (mínimo 10).';
  return msg;
}

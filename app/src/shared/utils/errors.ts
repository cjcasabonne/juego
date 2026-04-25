export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Error desconocido';
}

export function parseSupabaseError(error: unknown): string {
  const msg = getErrorMessage(error);
  if (msg.includes('couple_full')) return 'La pareja ya tiene 2 miembros.';
  if (msg.includes('couple_incomplete')) return 'La pareja necesita 2 miembros para iniciar una sesion.';
  if (msg.includes('unauthorized')) return 'No tienes permiso para realizar esta accion.';
  if (msg.includes('invalid_code')) return 'Codigo de invitacion no valido.';
  if (msg.includes('expired_code')) return 'El codigo de invitacion expiro.';
  if (msg.includes('already_member')) return 'Ya eres miembro de esta pareja.';
  if (msg.includes('invalid_category')) return 'Debes elegir una categoria para iniciar la sesion.';
  if (msg.includes('insufficient_questions_pool')) {
    return 'No hay suficientes preguntas activas sin repetir para iniciar la sesion en esa categoria (minimo 10).';
  }
  return msg;
}

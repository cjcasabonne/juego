export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-PE', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

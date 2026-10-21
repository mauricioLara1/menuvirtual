const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function formatearPrecio(valor: number): string {
  return formatoCOP.format(valor);
}

export function hoyColombia(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
}

// Fecha y hora (UTC que manda la API) mostradas en hora de Colombia
export function formatearFechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

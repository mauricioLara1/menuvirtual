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

import { isAxiosError } from 'axios';

export function mensajeError(e: unknown, porDefecto = 'Algo salió mal. Intenta de nuevo.'): string {
  if (isAxiosError(e)) {
    const d = e.response?.data;
    if (Array.isArray(d?.detalles) && d.detalles.length > 0) {
      return d.detalles.map((x: { campo: string; mensaje: string }) => `${x.campo}: ${x.mensaje}`).join(' · ');
    }
    if (typeof d?.error === 'string') return d.error;
  }
  return porDefecto;
}

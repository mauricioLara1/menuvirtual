import { api } from './cliente';

export interface Descuento {
  id: number;
  sucursal_id: number;
  nombre: string;
  tipo: 'PORCENTAJE' | 'VALOR_FIJO';
  valor: number;
  fecha_inicio: string; // AAAA-MM-DD
  fecha_fin: string;
  estado: 'PROGRAMADO' | 'VIGENTE' | 'VENCIDO';
  producto_ids: number[];
}

export interface DatosDescuento {
  nombre: string;
  tipo: 'PORCENTAJE' | 'VALOR_FIJO';
  valor: number;
  fecha_inicio: string;
  fecha_fin: string;
  producto_ids: number[];
}

export async function listarDescuentos(sucursalId: number): Promise<Descuento[]> {
  const { data } = await api.get('/descuentos', { params: { sucursal_id: sucursalId } });
  return data;
}

export async function crearDescuento(datos: DatosDescuento & { sucursal_id: number }): Promise<Descuento> {
  const { data } = await api.post('/descuentos', datos);
  return data;
}

export async function actualizarDescuento(id: number, datos: DatosDescuento): Promise<Descuento> {
  const { data } = await api.put(`/descuentos/${id}`, datos);
  return data;
}

export async function eliminarDescuento(id: number): Promise<void> {
  await api.delete(`/descuentos/${id}`);
}

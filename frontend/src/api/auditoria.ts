import { api } from './cliente';

export interface FilaAuditoria {
  id: number;
  fecha: string; // ISO (UTC); se muestra en hora de Colombia
  usuario: string | null;
  accion: 'CREAR' | 'EDITAR' | 'ELIMINAR';
  entidad: string;
  entidad_id: number | null;
  descripcion: string | null;
}

export interface RespuestaAuditoria {
  total: number;
  pagina: number;
  limite: number;
  paginas: number;
  items: FilaAuditoria[];
}

export interface FiltrosAuditoria {
  pagina: number;
  limite: number;
  accion?: string;
  entidad?: string;
  usuario_id?: number;
  desde?: string;
  hasta?: string;
}

// axios omite los parámetros undefined, así que los filtros vacíos no se envían
export async function listarAuditoria(filtros: FiltrosAuditoria): Promise<RespuestaAuditoria> {
  const { data } = await api.get('/auditoria', { params: filtros });
  return data;
}

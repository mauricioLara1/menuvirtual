import type { UsuarioSesion } from '../repositories/usuarios.repo';

type Permiso = { ok: true; sucursalId: number } | { ok: false; status: number; error: string };

// ¿Sobre qué sucursal puede crear este usuario? El ADMIN, solo la suya; el OWNER, la que indique.
export function sucursalPermitida(u: UsuarioSesion, pedida?: number | null): Permiso {
  if (u.rol === 'OWNER') {
    if (!pedida) return { ok: false, status: 400, error: 'sucursal_id es obligatorio para el OWNER' };
    return { ok: true, sucursalId: pedida };
  }
  if (!u.sucursal_id) {
    return { ok: false, status: 403, error: 'Tu usuario no tiene sucursal asignada' };
  }
  if (pedida && pedida !== u.sucursal_id) {
    return { ok: false, status: 403, error: 'No puedes actuar sobre otra sucursal' };
  }
  return { ok: true, sucursalId: u.sucursal_id };
}

// ¿Puede este usuario modificar algo que pertenece a esa sucursal?
export function puedeTocarSucursal(u: UsuarioSesion, sucursalId: number): boolean {
  return u.rol === 'OWNER' || (u.sucursal_id !== null && u.sucursal_id === sucursalId);
}

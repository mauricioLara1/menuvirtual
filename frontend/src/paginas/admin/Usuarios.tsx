import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listarSucursales } from '../../api/menu';
import {
  actualizarUsuario,
  crearUsuario,
  eliminarUsuario,
  listarUsuarios,
  type UsuarioFila,
} from '../../api/usuarios';
import { useSesion } from '../../hooks/useSesion';
import { mensajeError } from '../../utils/errores';

interface Campos {
  usuario: string;
  password: string;
  rol: 'OWNER' | 'ADMIN';
  sucursal_id: number;
}

const MIN_CLAVE = 5;

export default function Usuarios() {
  const queryClient = useQueryClient();
  const { data: yo } = useSesion();
  const usuarios = useQuery({ queryKey: ['usuarios'], queryFn: listarUsuarios });
  const sucursales = useQuery({ queryKey: ['sucursales'], queryFn: listarSucursales });
  const [editando, setEditando] = useState<UsuarioFila | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<Campos>({
    defaultValues: { usuario: '', password: '', rol: 'ADMIN' },
  });
  const rol = watch('rol');

  function limpiar() {
    setEditando(null);
    reset({ usuario: '', password: '', rol: 'ADMIN', sucursal_id: undefined });
  }

  function empezarEdicion(u: UsuarioFila) {
    setEditando(u);
    reset({ usuario: u.usuario, password: '', rol: u.rol, sucursal_id: u.sucursal_id ?? undefined });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function guardar(c: Campos) {
    const sucursal_id = c.rol === 'ADMIN' ? c.sucursal_id : null;
    try {
      if (editando) {
        await actualizarUsuario(editando.id, {
          rol: c.rol,
          sucursal_id,
          ...(c.password ? { password: c.password } : {}),
        });
      } else {
        await crearUsuario({ usuario: c.usuario.trim(), password: c.password, rol: c.rol, sucursal_id });
      }
      toast.success(editando ? 'Usuario actualizado' : 'Usuario creado');
      limpiar();
      await queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    } catch (e) {
      toast.error(mensajeError(e, 'No pudimos guardar el usuario.'));
    }
  }

  async function eliminar(u: UsuarioFila) {
    if (!window.confirm(`¿Eliminar al usuario "${u.usuario}"? Perderá el acceso de inmediato.`)) return;
    try {
      await eliminarUsuario(u.id);
      toast.success('Usuario eliminado');
      if (editando?.id === u.id) limpiar();
      await queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    } catch (e) {
      toast.error(mensajeError(e, 'No pudimos eliminar el usuario.'));
    }
  }

  return (
    <>
      <h1>Usuarios</h1>

      <form className="tarjeta-form" onSubmit={handleSubmit(guardar)} noValidate>
        <h2>{editando ? `Editando: ${editando.usuario}` : 'Nuevo usuario'}</h2>
        <div className="fila-form">
          <label>
            Usuario
            <input
              type="text"
              autoComplete="off"
              disabled={!!editando}
              maxLength={50}
              {...register('usuario', {
                required: 'Escribe el usuario',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' },
                pattern: { value: /^[a-z0-9._-]+$/, message: 'Solo minúsculas, números, punto, guion y guion bajo' },
              })}
            />
            {errors.usuario && <span className="error-campo">{errors.usuario.message}</span>}
          </label>
          <label>
            {editando ? 'Nueva contraseña (vacío = no cambiarla)' : 'Contraseña'}
            <input
              type="password"
              autoComplete="new-password"
              maxLength={72}
              {...register('password', {
                validate: (v) => {
                  if (!v) return editando ? true : 'Escribe la contraseña';
                  return v.length >= MIN_CLAVE || `Mínimo ${MIN_CLAVE} caracteres`;
                },
              })}
            />
            {errors.password && <span className="error-campo">{errors.password.message}</span>}
          </label>
        </div>
        <div className="fila-form" style={{ marginTop: 12 }}>
          <label>
            Rol
            <select {...register('rol')}>
              <option value="ADMIN">ADMIN (una sucursal)</option>
              <option value="OWNER">OWNER (todas)</option>
            </select>
          </label>
          {rol === 'ADMIN' && (
            <label>
              Sucursal
              <select
                {...register('sucursal_id', {
                  valueAsNumber: true,
                  validate: (v, f) => f.rol !== 'ADMIN' || (Number.isInteger(v) && v > 0) || 'Elige la sucursal',
                })}
              >
                <option value="">Elige...</option>
                {sucursales.data?.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
              {errors.sucursal_id && <span className="error-campo">{errors.sucursal_id.message}</span>}
            </label>
          )}
          <button type="submit" disabled={isSubmitting}>{editando ? 'Guardar cambios' : 'Crear usuario'}</button>
          {editando && <button type="button" className="boton-enlace" onClick={limpiar}>Cancelar</button>}
        </div>
      </form>

      {usuarios.isLoading && <p className="aviso">Cargando...</p>}
      {usuarios.isError && <p className="aviso">No pudimos cargar los usuarios.</p>}
      {usuarios.data && (
        <table className="tabla">
          <thead>
            <tr><th>Usuario</th><th>Rol</th><th>Sucursal</th><th></th></tr>
          </thead>
          <tbody>
            {usuarios.data.map((u) => (
              <tr key={u.id}>
                <td>{u.usuario}{u.id === yo?.id ? ' (tú)' : ''}</td>
                <td>{u.rol}</td>
                <td>{u.sucursal ?? 'Todas'}</td>
                <td>
                  <button type="button" className="boton-enlace" onClick={() => empezarEdicion(u)}>Editar</button>
                  {u.id !== yo?.id && (
                    <button type="button" className="boton-enlace rojo" onClick={() => eliminar(u)}>Eliminar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

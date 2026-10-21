import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listarSucursales } from '../../api/menu';
import { actualizarSucursal, crearSucursal, eliminarSucursal } from '../../api/sucursales';
import type { Sucursal } from '../../api/tipos';
import { mensajeError } from '../../utils/errores';

interface Campos {
  nombre: string;
  direccion: string;
}

export default function Sucursales() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['sucursales'], queryFn: listarSucursales });
  const [editando, setEditando] = useState<Sucursal | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Campos>({
    defaultValues: { nombre: '', direccion: '' },
  });

  function empezarEdicion(s: Sucursal) {
    setEditando(s);
    reset({ nombre: s.nombre, direccion: s.direccion });
  }

  function cancelar() {
    setEditando(null);
    reset({ nombre: '', direccion: '' });
  }

  async function guardar(c: Campos) {
    const datos = { nombre: c.nombre.trim(), direccion: c.direccion.trim() };
    try {
      if (editando) await actualizarSucursal(editando.id, datos);
      else await crearSucursal(datos);
      toast.success(editando ? 'Sucursal actualizada' : 'Sucursal creada');
      cancelar();
      await queryClient.invalidateQueries({ queryKey: ['sucursales'] });
    } catch (e) {
      toast.error(mensajeError(e, 'No pudimos guardar la sucursal.'));
    }
  }

  async function eliminar(s: Sucursal) {
    if (!window.confirm(`¿Eliminar "${s.nombre}"? Su menú dejará de verse.`)) return;
    try {
      await eliminarSucursal(s.id);
      toast.success('Sucursal eliminada');
      if (editando?.id === s.id) cancelar();
      await queryClient.invalidateQueries({ queryKey: ['sucursales'] });
    } catch (e) {
      toast.error(mensajeError(e, 'No pudimos eliminar la sucursal.'));
    }
  }

  return (
    <>
      <h1>Sucursales</h1>

      <form className="tarjeta-form" onSubmit={handleSubmit(guardar)} noValidate>
        <h2>{editando ? `Editando: ${editando.nombre}` : 'Nueva sucursal'}</h2>
        <div className="fila-form">
          <label>
            Nombre
            <input type="text" maxLength={100} {...register('nombre', { required: 'Escribe el nombre' })} />
            {errors.nombre && <span className="error-campo">{errors.nombre.message}</span>}
          </label>
          <label>
            Dirección
            <input type="text" maxLength={200} {...register('direccion', { required: 'Escribe la dirección' })} />
            {errors.direccion && <span className="error-campo">{errors.direccion.message}</span>}
          </label>
          <button type="submit" disabled={isSubmitting}>{editando ? 'Guardar cambios' : 'Crear'}</button>
          {editando && <button type="button" className="boton-enlace" onClick={cancelar}>Cancelar</button>}
        </div>
      </form>

      {isLoading && <p className="aviso">Cargando...</p>}
      {isError && <p className="aviso">No pudimos cargar las sucursales.</p>}
      {data && (
        <table className="tabla">
          <thead>
            <tr><th>Nombre</th><th>Dirección</th><th></th></tr>
          </thead>
          <tbody>
            {data.map((s) => (
              <tr key={s.id}>
                <td>{s.nombre}</td>
                <td>{s.direccion}</td>
                <td>
                  <button type="button" className="boton-enlace" onClick={() => empezarEdicion(s)}>Editar</button>
                  <button type="button" className="boton-enlace rojo" onClick={() => eliminar(s)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

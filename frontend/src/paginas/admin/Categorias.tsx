import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  actualizarCategoria,
  crearCategoria,
  eliminarCategoria,
  listarCategorias,
  type CategoriaConOrden,
} from '../../api/categorias';
import { mensajeError } from '../../utils/errores';

interface Campos {
  nombre: string;
  orden: number;
}

export default function Categorias() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['categorias'], queryFn: listarCategorias });
  const [editando, setEditando] = useState<CategoriaConOrden | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Campos>({
    defaultValues: { nombre: '', orden: undefined },
  });

  function empezarEdicion(c: CategoriaConOrden) {
    setEditando(c);
    reset({ nombre: c.nombre, orden: c.orden });
  }

  function cancelar() {
    setEditando(null);
    reset({ nombre: '', orden: undefined });
  }

  async function guardar(c: Campos) {
    // Si deja "orden" vacío, la API usa 0 al crear y conserva el actual al editar
    const datos = { nombre: c.nombre.trim(), orden: Number.isNaN(c.orden) ? undefined : c.orden };
    try {
      if (editando) await actualizarCategoria(editando.id, datos);
      else await crearCategoria(datos);
      toast.success(editando ? 'Categoría actualizada' : 'Categoría creada');
      cancelar();
      await queryClient.invalidateQueries({ queryKey: ['categorias'] });
      await queryClient.invalidateQueries({ queryKey: ['productos'] });
    } catch (e) {
      toast.error(mensajeError(e, 'No pudimos guardar la categoría.'));
    }
  }

  async function eliminar(c: CategoriaConOrden) {
    if (!window.confirm(`¿Eliminar la categoría "${c.nombre}"?`)) return;
    try {
      await eliminarCategoria(c.id);
      toast.success('Categoría eliminada');
      if (editando?.id === c.id) cancelar();
      await queryClient.invalidateQueries({ queryKey: ['categorias'] });
    } catch (e) {
      // Si tiene productos activos, la API responde 409 con el motivo
      toast.error(mensajeError(e, 'No pudimos eliminar la categoría.'));
    }
  }

  return (
    <>
      <h1>Categorías</h1>

      <form className="tarjeta-form" onSubmit={handleSubmit(guardar)} noValidate>
        <h2>{editando ? `Editando: ${editando.nombre}` : 'Nueva categoría'}</h2>
        <div className="fila-form">
          <label>
            Nombre
            <input type="text" maxLength={50} {...register('nombre', { required: 'Escribe el nombre' })} />
            {errors.nombre && <span className="error-campo">{errors.nombre.message}</span>}
          </label>
          <label>
            Orden en el menú (0 sale primero)
            <input
              type="number"
              step={1}
              {...register('orden', {
                valueAsNumber: true,
                min: { value: 0, message: 'Mínimo 0' },
                max: { value: 9999, message: 'Máximo 9999' },
              })}
            />
            {errors.orden && <span className="error-campo">{errors.orden.message}</span>}
          </label>
          <button type="submit" disabled={isSubmitting}>{editando ? 'Guardar cambios' : 'Crear'}</button>
          {editando && <button type="button" className="boton-enlace" onClick={cancelar}>Cancelar</button>}
        </div>
      </form>

      {isLoading && <p className="aviso">Cargando...</p>}
      {isError && <p className="aviso">No pudimos cargar las categorías.</p>}
      {data && (
        <table className="tabla">
          <thead>
            <tr><th>Orden</th><th>Nombre</th><th></th></tr>
          </thead>
          <tbody>
            {data.map((c) => (
              <tr key={c.id}>
                <td>{c.orden}</td>
                <td>{c.nombre}</td>
                <td>
                  <button type="button" className="boton-enlace" onClick={() => empezarEdicion(c)}>Editar</button>
                  <button type="button" className="boton-enlace rojo" onClick={() => eliminar(c)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

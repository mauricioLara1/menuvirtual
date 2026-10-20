import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listarCategorias } from '../../api/categorias';
import { actualizarProducto, crearProducto, obtenerProducto } from '../../api/productos';
import type { Categoria, Producto } from '../../api/tipos';
import { useContextoPanel } from '../../hooks/useContextoPanel';
import { mensajeError } from '../../utils/errores';

interface Campos {
  nombre: string;
  descripcion: string;
  precio: number;
  categoria_id: number;
}

interface PropsFormulario {
  inicial?: Producto;
  categorias: Categoria[];
  sucursalId: number;
}

function Formulario({ inicial, categorias, sucursalId }: PropsFormulario) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Campos>({
    defaultValues: {
      nombre: inicial?.nombre ?? '',
      descripcion: inicial?.descripcion ?? '',
      precio: inicial?.precio,
      categoria_id: inicial?.categoria_id,
    },
  });

  async function enviar(c: Campos) {
    const datos = {
      nombre: c.nombre.trim(),
      descripcion: c.descripcion.trim() || null,
      precio: c.precio,
      // Las imágenes llegan en otra fase; mientras tanto se conserva la que ya tenía.
      imagen_url: inicial?.imagen_url ?? null,
      categoria_id: c.categoria_id,
    };
    try {
      if (inicial) await actualizarProducto(inicial.id, datos);
      else await crearProducto({ ...datos, sucursal_id: sucursalId });
      toast.success(inicial ? 'Producto actualizado' : 'Producto creado');
      await queryClient.invalidateQueries({ queryKey: ['productos', sucursalId] });
      navigate('/admin/productos');
    } catch (e) {
      toast.error(mensajeError(e, 'No pudimos guardar el producto.'));
    }
  }

  return (
    <>
      <h1>{inicial ? 'Modificar producto' : 'Agregar producto'}</h1>
      <form className="formulario formulario-ancho" onSubmit={handleSubmit(enviar)} noValidate>
        <label>
          Nombre
          <input type="text" maxLength={100} {...register('nombre', { required: 'Escribe el nombre' })} />
          {errors.nombre && <span className="error-campo">{errors.nombre.message}</span>}
        </label>
        <label>
          Descripción (opcional)
          <textarea rows={3} maxLength={500} {...register('descripcion')} />
        </label>
        <label>
          Precio
          <input
            type="number"
            step="any"
            {...register('precio', {
              required: 'Escribe el precio',
              valueAsNumber: true,
              min: { value: 0, message: 'No puede ser negativo' },
            })}
          />
          {errors.precio && <span className="error-campo">{errors.precio.message}</span>}
        </label>
        <label>
          Categoría
          <select {...register('categoria_id', { required: 'Elige una categoría', valueAsNumber: true })}>
            <option value="">Elige...</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          {errors.categoria_id && <span className="error-campo">{errors.categoria_id.message}</span>}
        </label>
        <div className="botones-fila">
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar'}</button>
          <Link to="/admin/productos">Cancelar</Link>
        </div>
      </form>
    </>
  );
}

// Carga lo que el formulario necesita (categorías y, si edita, el producto)
// y recién entonces lo pinta, para que los campos nazcan con sus valores.
export default function FormularioProducto() {
  const { sucursalId } = useContextoPanel();
  const { id } = useParams();
  const idProducto = id ? Number(id) : null;

  const categorias = useQuery({ queryKey: ['categorias'], queryFn: listarCategorias });
  const producto = useQuery({
    queryKey: ['producto', idProducto],
    queryFn: () => obtenerProducto(idProducto as number),
    enabled: idProducto !== null,
    staleTime: 0,
    gcTime: 0,
  });

  if (sucursalId === null || categorias.isLoading || producto.isLoading) {
    return <p className="aviso">Cargando...</p>;
  }
  if (categorias.isError || producto.isError) {
    return <p className="aviso">No pudimos cargar los datos. <Link to="/admin/productos">Volver</Link></p>;
  }

  return <Formulario inicial={producto.data} categorias={categorias.data ?? []} sucursalId={sucursalId} />;
}

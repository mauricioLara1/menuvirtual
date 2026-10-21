import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listarCategorias } from '../../api/categorias';
import { actualizarProducto, crearProducto, obtenerProducto, subirImagen } from '../../api/productos';
import type { Categoria, Producto } from '../../api/tipos';
import { useContextoPanel } from '../../hooks/useContextoPanel';
import { mensajeError } from '../../utils/errores';

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

interface Campos {
  nombre: string;
  descripcion: string;
  precio: number;
  categoria_id: number;
  imagen: FileList;
}

interface PropsFormulario {
  inicial?: Producto;
  categorias: Categoria[];
  sucursalId: number;
}

function Formulario({ inicial, categorias, sucursalId }: PropsFormulario) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<Campos>({
    defaultValues: {
      nombre: inicial?.nombre ?? '',
      descripcion: inicial?.descripcion ?? '',
      precio: inicial?.precio,
      categoria_id: inicial?.categoria_id,
    },
  });

  // Vista previa: la foto recién elegida, o la que ya tiene el producto
  const archivo = watch('imagen')?.[0];
  const [vista, setVista] = useState<string | null>(null);
  useEffect(() => {
    if (!archivo) {
      setVista(null);
      return;
    }
    const url = URL.createObjectURL(archivo);
    setVista(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);
  const imagenMostrada = vista ?? inicial?.imagen_url ?? null;

  async function enviar(c: Campos) {
    const datos = {
      nombre: c.nombre.trim(),
      descripcion: c.descripcion.trim() || null,
      precio: c.precio,
      imagen_url: inicial?.imagen_url ?? null,
      categoria_id: c.categoria_id,
    };

    // 1) Guardar el producto
    let id = inicial?.id;
    try {
      if (inicial) {
        await actualizarProducto(inicial.id, datos);
      } else {
        const creado = await crearProducto({ ...datos, sucursal_id: sucursalId });
        id = creado.id;
      }
    } catch (e) {
      toast.error(mensajeError(e, 'No pudimos guardar el producto.'));
      return;
    }

    // 2) Subir la foto (si eligió una). Si falla, el producto ya quedó guardado.
    let fallaImagen: string | null = null;
    const nueva = c.imagen?.[0];
    if (nueva && id) {
      try {
        await subirImagen(id, nueva);
      } catch (e) {
        fallaImagen = mensajeError(e, 'No pudimos subir la imagen.');
      }
    }

    await queryClient.invalidateQueries({ queryKey: ['productos', sucursalId] });
    if (fallaImagen) toast.error(`Producto guardado, pero la imagen falló: ${fallaImagen}`);
    else toast.success(inicial ? 'Producto actualizado' : 'Producto creado');
    navigate('/admin/productos');
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
        <label>
          Foto (jpg, png o webp, máx. 5 MB)
          {imagenMostrada ? (
            <img className="vista-previa" src={imagenMostrada} alt="Vista previa" />
          ) : (
            <div className="vista-vacia">Sin foto</div>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            {...register('imagen', {
              validate: (archivos) => {
                const a = archivos?.[0];
                if (!a) return true;
                if (!TIPOS_PERMITIDOS.includes(a.type)) return 'Solo jpg, png o webp';
                if (a.size > MAX_BYTES) return 'La foto pesa más de 5 MB';
                return true;
              },
            })}
          />
          {errors.imagen && <span className="error-campo">{errors.imagen.message}</span>}
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

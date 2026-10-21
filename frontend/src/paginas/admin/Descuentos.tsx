import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  actualizarDescuento,
  crearDescuento,
  eliminarDescuento,
  listarDescuentos,
  type Descuento,
} from '../../api/descuentos';
import { listarProductos } from '../../api/menu';
import { useContextoPanel } from '../../hooks/useContextoPanel';
import { mensajeError } from '../../utils/errores';
import { formatearPrecio, hoyColombia } from '../../utils/formato';

interface Campos {
  nombre: string;
  tipo: 'PORCENTAJE' | 'VALOR_FIJO';
  valor: number;
  fecha_inicio: string;
  fecha_fin: string;
}

function textoValor(d: Pick<Descuento, 'tipo' | 'valor'>): string {
  return d.tipo === 'PORCENTAJE' ? `${d.valor}%` : formatearPrecio(d.valor);
}

const ETIQUETA_ESTADO = { VIGENTE: 'Vigente', PROGRAMADO: 'Programado', VENCIDO: 'Vencido' } as const;

function Pantalla({ sucursalId }: { sucursalId: number }) {
  const queryClient = useQueryClient();
  const descuentos = useQuery({
    queryKey: ['descuentos', sucursalId],
    queryFn: () => listarDescuentos(sucursalId),
  });
  const productos = useQuery({
    queryKey: ['productos', sucursalId],
    queryFn: () => listarProductos(sucursalId),
  });

  const [editando, setEditando] = useState<Descuento | null>(null);
  const [seleccion, setSeleccion] = useState<number[]>([]);
  const [errorProductos, setErrorProductos] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Campos>({
    defaultValues: { nombre: '', tipo: 'PORCENTAJE', fecha_inicio: hoyColombia(), fecha_fin: hoyColombia() },
  });

  function limpiar() {
    setEditando(null);
    setSeleccion([]);
    setErrorProductos(null);
    reset({ nombre: '', tipo: 'PORCENTAJE', valor: undefined, fecha_inicio: hoyColombia(), fecha_fin: hoyColombia() });
  }

  function empezarEdicion(d: Descuento) {
    setEditando(d);
    setSeleccion(d.producto_ids);
    setErrorProductos(null);
    reset({ nombre: d.nombre, tipo: d.tipo, valor: d.valor, fecha_inicio: d.fecha_inicio, fecha_fin: d.fecha_fin });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function alternar(id: number) {
    setErrorProductos(null);
    setSeleccion((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function guardar(c: Campos) {
    if (seleccion.length === 0) {
      setErrorProductos('Elige al menos un producto');
      return;
    }
    const datos = {
      nombre: c.nombre.trim(),
      tipo: c.tipo,
      valor: c.valor,
      fecha_inicio: c.fecha_inicio,
      fecha_fin: c.fecha_fin,
      producto_ids: seleccion,
    };
    try {
      if (editando) await actualizarDescuento(editando.id, datos);
      else await crearDescuento({ ...datos, sucursal_id: sucursalId });
      toast.success(editando ? 'Descuento actualizado' : 'Descuento creado');
      limpiar();
      await queryClient.invalidateQueries({ queryKey: ['descuentos', sucursalId] });
      await queryClient.invalidateQueries({ queryKey: ['menu'] });
    } catch (e) {
      toast.error(mensajeError(e, 'No pudimos guardar el descuento.'));
    }
  }

  async function eliminar(d: Descuento) {
    if (!window.confirm(`¿Eliminar el descuento "${d.nombre}"?`)) return;
    try {
      await eliminarDescuento(d.id);
      toast.success('Descuento eliminado');
      if (editando?.id === d.id) limpiar();
      await queryClient.invalidateQueries({ queryKey: ['descuentos', sucursalId] });
      await queryClient.invalidateQueries({ queryKey: ['menu'] });
    } catch (e) {
      toast.error(mensajeError(e, 'No pudimos eliminar el descuento.'));
    }
  }

  return (
    <>
      <h1>Descuentos</h1>

      <form className="tarjeta-form" onSubmit={handleSubmit(guardar)} noValidate>
        <h2>{editando ? `Editando: ${editando.nombre}` : 'Nuevo descuento'}</h2>
        <div className="fila-form">
          <label>
            Nombre
            <input type="text" maxLength={100} {...register('nombre', { required: 'Escribe el nombre' })} />
            {errors.nombre && <span className="error-campo">{errors.nombre.message}</span>}
          </label>
          <label>
            Tipo
            <select {...register('tipo')}>
              <option value="PORCENTAJE">Porcentaje (%)</option>
              <option value="VALOR_FIJO">Valor fijo ($)</option>
            </select>
          </label>
          <label>
            Valor
            <input
              type="number"
              step="any"
              {...register('valor', {
                required: 'Escribe el valor',
                valueAsNumber: true,
                validate: (v, f) => {
                  if (!(v > 0)) return 'Debe ser mayor que 0';
                  if (f.tipo === 'PORCENTAJE' && v > 100) return 'Máximo 100%';
                  return true;
                },
              })}
            />
            {errors.valor && <span className="error-campo">{errors.valor.message}</span>}
          </label>
        </div>
        <div className="fila-form" style={{ marginTop: 12 }}>
          <label>
            Desde
            <input type="date" {...register('fecha_inicio', { required: 'Elige la fecha' })} />
            {errors.fecha_inicio && <span className="error-campo">{errors.fecha_inicio.message}</span>}
          </label>
          <label>
            Hasta (incluido)
            <input
              type="date"
              {...register('fecha_fin', {
                required: 'Elige la fecha',
                validate: (v, f) => v >= f.fecha_inicio || 'No puede ser anterior al inicio',
              })}
            />
            {errors.fecha_fin && <span className="error-campo">{errors.fecha_fin.message}</span>}
          </label>
        </div>

        <p style={{ margin: '16px 0 0' }}>Productos con este descuento ({seleccion.length} elegidos)</p>
        {productos.isLoading && <p className="aviso">Cargando productos...</p>}
        {productos.data && productos.data.length === 0 && (
          <p className="aviso">Esta sucursal no tiene productos todavía.</p>
        )}
        <div className="lista-productos-check">
          {productos.data?.map((p) => (
            <label key={p.id} className="opcion-producto">
              <input type="checkbox" checked={seleccion.includes(p.id)} onChange={() => alternar(p.id)} />
              <span>{p.nombre} <small>{formatearPrecio(p.precio)}</small></span>
            </label>
          ))}
        </div>
        {errorProductos && <span className="error-campo">{errorProductos}</span>}

        <div className="fila-form" style={{ marginTop: 16 }}>
          <button type="submit" disabled={isSubmitting}>{editando ? 'Guardar cambios' : 'Crear descuento'}</button>
          {editando && <button type="button" className="boton-enlace" onClick={limpiar}>Cancelar</button>}
        </div>
      </form>

      {descuentos.isLoading && <p className="aviso">Cargando...</p>}
      {descuentos.isError && <p className="aviso">No pudimos cargar los descuentos.</p>}
      {descuentos.data && descuentos.data.length === 0 && <p className="aviso">Aún no hay descuentos.</p>}
      {descuentos.data && descuentos.data.length > 0 && (
        <table className="tabla">
          <thead>
            <tr><th>Nombre</th><th>Descuento</th><th>Vigencia</th><th>Estado</th><th>Productos</th><th></th></tr>
          </thead>
          <tbody>
            {descuentos.data.map((d) => (
              <tr key={d.id}>
                <td>{d.nombre}</td>
                <td>{textoValor(d)}</td>
                <td>{d.fecha_inicio} → {d.fecha_fin}</td>
                <td><span className={`chip estado-${d.estado.toLowerCase()}`}>{ETIQUETA_ESTADO[d.estado]}</span></td>
                <td>{d.producto_ids.length}</td>
                <td>
                  <button type="button" className="boton-enlace" onClick={() => empezarEdicion(d)}>Editar</button>
                  <button type="button" className="boton-enlace rojo" onClick={() => eliminar(d)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

// Al cambiar de sucursal (el OWNER) se reinicia toda la pantalla
export default function Descuentos() {
  const { sucursalId } = useContextoPanel();
  if (sucursalId === null) return <p className="aviso">Cargando...</p>;
  return <Pantalla key={sucursalId} sucursalId={sucursalId} />;
}

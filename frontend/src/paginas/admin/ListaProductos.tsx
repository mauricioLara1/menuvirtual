import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listarProductos } from '../../api/menu';
import { eliminarProducto } from '../../api/productos';
import { useContextoPanel } from '../../hooks/useContextoPanel';
import { formatearPrecio } from '../../utils/formato';

export default function ListaProductos() {
  const { sucursalId } = useContextoPanel();
  const queryClient = useQueryClient();
  const [marcados, setMarcados] = useState<number[]>([]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['productos', sucursalId],
    queryFn: () => listarProductos(sucursalId as number),
    enabled: sucursalId !== null,
  });

  const productos = data ?? [];

  function alternar(id: number) {
    setMarcados((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function alternarTodos() {
    setMarcados((prev) => (prev.length === productos.length ? [] : productos.map((p) => p.id)));
  }

  async function eliminarMarcados() {
    if (!window.confirm(`¿Eliminar ${marcados.length} producto(s)? Dejarán de verse en el menú.`)) return;
    const resultados = await Promise.allSettled(marcados.map((id) => eliminarProducto(id)));
    const fallidos = resultados.filter((r) => r.status === 'rejected').length;
    if (fallidos === 0) toast.success('Productos eliminados');
    else toast.error(`No se pudieron eliminar ${fallidos} producto(s)`);
    setMarcados([]);
    await queryClient.invalidateQueries({ queryKey: ['productos', sucursalId] });
  }

  if (sucursalId === null || isLoading) return <p className="aviso">Cargando...</p>;
  if (isError) return <p className="aviso">No pudimos cargar los productos.</p>;

  return (
    <>
      <div className="barra-acciones">
        <h1>Productos</h1>
        <button type="button" className="peligro" disabled={marcados.length === 0} onClick={eliminarMarcados}>
          Eliminar seleccionados ({marcados.length})
        </button>
      </div>

      {productos.length === 0 ? (
        <p className="aviso">Esta sucursal aún no tiene productos.</p>
      ) : (
        <table className="tabla">
          <thead>
            <tr>
              <th><input type="checkbox" checked={marcados.length === productos.length} onChange={alternarTodos} aria-label="Marcar todos" /></th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id}>
                <td><input type="checkbox" checked={marcados.includes(p.id)} onChange={() => alternar(p.id)} aria-label={`Marcar ${p.nombre}`} /></td>
                <td>{p.nombre}</td>
                <td>{p.categoria}</td>
                <td>{formatearPrecio(p.precio)}</td>
                <td><Link to={`/admin/productos/${p.id}/editar`}>Editar</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

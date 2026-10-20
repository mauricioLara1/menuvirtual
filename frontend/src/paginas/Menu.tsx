import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { listarProductos, obtenerSucursal } from '../api/menu';
import type { Producto } from '../api/tipos';
import { formatearPrecio } from '../utils/formato';

interface Grupo {
  categoria: string;
  productos: Producto[];
}

// La API ya entrega los productos ordenados por categoría;
// aquí solo los agrupamos para pintar un título por categoría.
function agruparPorCategoria(productos: Producto[]): Grupo[] {
  const grupos: Grupo[] = [];
  for (const p of productos) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.categoria === p.categoria) {
      ultimo.productos.push(p);
    } else {
      grupos.push({ categoria: p.categoria, productos: [p] });
    }
  }
  return grupos;
}

export default function Menu() {
  const { sucursalId } = useParams();
  const id = Number(sucursalId);
  const idValido = Number.isInteger(id) && id > 0;

  const sucursal = useQuery({
    queryKey: ['sucursal', id],
    queryFn: () => obtenerSucursal(id),
    enabled: idValido,
  });

  const productos = useQuery({
    queryKey: ['productos', id],
    queryFn: () => listarProductos(id),
    enabled: idValido,
  });

  if (!idValido || sucursal.isError) {
    return (
      <main className="pagina">
        <p className="aviso">Esta sucursal no existe.</p>
        <Link to="/">Ver sucursales</Link>
      </main>
    );
  }

  if (sucursal.isLoading || productos.isLoading) {
    return (
      <main className="pagina">
        <p className="aviso">Cargando menú...</p>
      </main>
    );
  }

  if (productos.isError) {
    return (
      <main className="pagina">
        <p className="aviso">No pudimos cargar el menú. Intenta de nuevo.</p>
      </main>
    );
  }

  const grupos = agruparPorCategoria(productos.data ?? []);

  return (
    <main className="pagina">
      <header className="encabezado">
        <h1 className="titulo">{sucursal.data?.nombre}</h1>
        <p className="direccion">{sucursal.data?.direccion}</p>
      </header>

      {grupos.length === 0 && <p className="aviso">Aún no hay productos en el menú.</p>}

      {grupos.map((g) => (
        <section key={g.categoria} className="categoria">
          <h2 className="categoria-titulo">{g.categoria}</h2>
          {g.productos.map((p) => (
            <article key={p.id} className="producto">
              <div className="producto-texto">
                <h3 className="producto-nombre">{p.nombre}</h3>
                {p.descripcion && <p className="producto-desc">{p.descripcion}</p>}
                <p className="producto-precio">{formatearPrecio(p.precio)}</p>
              </div>
              {p.imagen_url ? (
                <img className="producto-foto" src={p.imagen_url} alt={p.nombre} loading="lazy" />
              ) : (
                <div className="producto-foto producto-sin-foto" aria-hidden="true">
                  Sin foto
                </div>
              )}
            </article>
          ))}
        </section>
      ))}
    </main>
  );
}

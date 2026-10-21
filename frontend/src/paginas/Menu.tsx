import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { listarMenu, obtenerSucursal } from '../api/menu';
import type { ProductoMenu } from '../api/tipos';
import { formatearPrecio } from '../utils/formato';

interface Grupo {
  categoria: string;
  productos: ProductoMenu[];
}

// La API ya entrega los productos ordenados por categoría;
// aquí solo los agrupamos para pintar un título por categoría.
function agruparPorCategoria(productos: ProductoMenu[]): Grupo[] {
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

function Precio({ p }: { p: ProductoMenu }) {
  if (!p.descuento) return <p className="producto-precio">{formatearPrecio(p.precio)}</p>;
  const etiqueta =
    p.descuento.tipo === 'PORCENTAJE' ? `-${p.descuento.valor}%` : `-${formatearPrecio(p.descuento.valor)}`;
  return (
    <p className="producto-precio">
      <span className="precio-anterior">{formatearPrecio(p.precio)}</span>{' '}
      <span>{formatearPrecio(p.precio_final)}</span>{' '}
      <span className="etiqueta-descuento" title={p.descuento.nombre}>{etiqueta}</span>
    </p>
  );
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

  const menu = useQuery({
    queryKey: ['menu', id],
    queryFn: () => listarMenu(id),
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

  if (sucursal.isLoading || menu.isLoading) {
    return (
      <main className="pagina">
        <p className="aviso">Cargando menú...</p>
      </main>
    );
  }

  if (menu.isError) {
    return (
      <main className="pagina">
        <p className="aviso">No pudimos cargar el menú. Intenta de nuevo.</p>
      </main>
    );
  }

  const grupos = agruparPorCategoria(menu.data ?? []);

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
                <Precio p={p} />
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

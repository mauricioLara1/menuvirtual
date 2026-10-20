import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listarSucursales } from '../api/menu';

export default function Inicio() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['sucursales'],
    queryFn: listarSucursales,
  });

  return (
    <main className="pagina">
      <h1 className="titulo">Elige tu sucursal</h1>
      {isLoading && <p className="aviso">Cargando...</p>}
      {isError && <p className="aviso">No pudimos cargar las sucursales.</p>}
      <ul className="lista-sucursales">
        {data?.map((s) => (
          <li key={s.id}>
            <Link to={`/menu/${s.id}`} className="tarjeta-sucursal">
              <strong>{s.nombre}</strong>
              <span>{s.direccion}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

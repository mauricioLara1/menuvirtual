import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cerrarSesion } from '../../api/auth';
import { listarSucursales } from '../../api/menu';
import { useSesion } from '../../hooks/useSesion';
import type { ContextoPanel } from '../../hooks/useContextoPanel';

export default function Panel() {
  const { data: usuario } = useSesion();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const sucursales = useQuery({ queryKey: ['sucursales'], queryFn: listarSucursales });
  const [elegida, setElegida] = useState<number | null>(null);

  const esOwner = usuario?.rol === 'OWNER';
  // El ADMIN siempre trabaja en su sucursal; el OWNER elige.
  const sucursalId = esOwner
    ? (elegida ?? sucursales.data?.[0]?.id ?? null)
    : (usuario?.sucursal_id ?? null);

  const contexto: ContextoPanel = { sucursalId };

  async function salir() {
    await cerrarSesion();
    queryClient.setQueryData(['me'], null);
    navigate('/login');
  }

  return (
    <div className="panel">
      <aside className="barra-lateral">
        <h2>Panel</h2>
        <p className="quien">{usuario?.usuario} · {usuario?.rol}</p>

        {esOwner && (
          <label className="selector-sucursal">
            Sucursal
            <select value={sucursalId ?? ''} onChange={(e) => setElegida(Number(e.target.value))}>
              {sucursales.data?.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </label>
        )}

        <nav>
          <NavLink to="/admin/productos/nuevo">Agregar producto</NavLink>
          <NavLink to="/admin/productos" end>Modificar / Quitar</NavLink>
          <button type="button" disabled>Descuentos</button>
        </nav>

        {sucursalId && <Link className="enlace-menu" to={`/menu/${sucursalId}`}>Ver menú público</Link>}
        <button type="button" className="salir" onClick={salir}>Cerrar sesión</button>
      </aside>
      <section className="panel-contenido">
        <Outlet context={contexto} />
      </section>
    </div>
  );
}

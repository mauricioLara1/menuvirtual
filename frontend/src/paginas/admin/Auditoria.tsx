import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listarAuditoria } from '../../api/auditoria';
import { listarUsuarios } from '../../api/usuarios';
import { formatearFechaHora } from '../../utils/formato';

const ENTIDADES = ['producto', 'categoria', 'sucursal', 'descuento', 'usuario'];

export default function Auditoria() {
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(20);
  const [accion, setAccion] = useState('');
  const [entidad, setEntidad] = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const rangoInvalido = !!desde && !!hasta && hasta < desde;

  const usuarios = useQuery({ queryKey: ['usuarios'], queryFn: listarUsuarios });
  const auditoria = useQuery({
    queryKey: ['auditoria', pagina, limite, accion, entidad, usuarioId, desde, hasta],
    queryFn: () =>
      listarAuditoria({
        pagina,
        limite,
        accion: accion || undefined,
        entidad: entidad || undefined,
        usuario_id: usuarioId ? Number(usuarioId) : undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
      }),
    enabled: !rangoInvalido,
    placeholderData: keepPreviousData,
  });

  // Cualquier cambio de filtro vuelve a la página 1
  function filtrar(setter: (v: string) => void) {
    return (valor: string) => {
      setter(valor);
      setPagina(1);
    };
  }

  function limpiar() {
    setAccion('');
    setEntidad('');
    setUsuarioId('');
    setDesde('');
    setHasta('');
    setPagina(1);
  }

  const datos = auditoria.data;

  return (
    <>
      <div className="barra-acciones">
        <h1>Auditoría</h1>
        <button type="button" className="boton-enlace" onClick={() => auditoria.refetch()}>Actualizar</button>
      </div>

      <div className="tarjeta-form">
        <div className="fila-form">
          <label>
            Acción
            <select value={accion} onChange={(e) => filtrar(setAccion)(e.target.value)}>
              <option value="">Todas</option>
              <option value="CREAR">Crear</option>
              <option value="EDITAR">Editar</option>
              <option value="ELIMINAR">Eliminar</option>
            </select>
          </label>
          <label>
            Entidad
            <select value={entidad} onChange={(e) => filtrar(setEntidad)(e.target.value)}>
              <option value="">Todas</option>
              {ENTIDADES.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </label>
          <label>
            Usuario
            <select value={usuarioId} onChange={(e) => filtrar(setUsuarioId)(e.target.value)}>
              <option value="">Todos</option>
              {usuarios.data?.map((u) => <option key={u.id} value={u.id}>{u.usuario}</option>)}
            </select>
          </label>
        </div>
        <div className="fila-form" style={{ marginTop: 12 }}>
          <label>
            Desde
            <input type="date" value={desde} onChange={(e) => filtrar(setDesde)(e.target.value)} />
          </label>
          <label>
            Hasta (incluido)
            <input type="date" value={hasta} onChange={(e) => filtrar(setHasta)(e.target.value)} />
          </label>
          <button type="button" onClick={limpiar}>Limpiar filtros</button>
        </div>
        {rangoInvalido && <span className="error-campo">"Hasta" no puede ser anterior a "Desde"</span>}
      </div>

      {auditoria.isLoading && <p className="aviso">Cargando...</p>}
      {auditoria.isError && <p className="aviso">No pudimos cargar la auditoría.</p>}
      {datos && datos.items.length === 0 && <p className="aviso">No hay registros con esos filtros.</p>}
      {datos && datos.items.length > 0 && (
        <>
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Sobre</th><th>Detalle</th></tr>
              </thead>
              <tbody>
                {datos.items.map((f) => (
                  <tr key={f.id}>
                    <td>{formatearFechaHora(f.fecha)}</td>
                    <td>{f.usuario ?? '—'}</td>
                    <td><span className={`chip accion-${f.accion.toLowerCase()}`}>{f.accion}</span></td>
                    <td>{f.entidad}{f.entidad_id ? ` #${f.entidad_id}` : ''}</td>
                    <td>{f.descripcion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="paginacion">
            <button type="button" disabled={datos.pagina <= 1} onClick={() => setPagina((p) => p - 1)}>Anterior</button>
            <span>Página {datos.pagina} de {datos.paginas} · {datos.total} registros</span>
            <button type="button" disabled={datos.pagina >= datos.paginas} onClick={() => setPagina((p) => p + 1)}>Siguiente</button>
            <label style={{ marginLeft: 'auto' }}>
              Por página{' '}
              <select value={limite} onChange={(e) => { setLimite(Number(e.target.value)); setPagina(1); }}>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>
          </div>
        </>
      )}
    </>
  );
}

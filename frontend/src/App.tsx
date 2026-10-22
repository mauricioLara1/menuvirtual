import { Navigate, Route, Routes } from 'react-router-dom';
import RutaProtegida from './componentes/RutaProtegida';
import Inicio from './paginas/Inicio';
import Login from './paginas/Login';
import Menu from './paginas/Menu';
import Panel from './paginas/admin/Panel';
import ListaProductos from './paginas/admin/ListaProductos';
import FormularioProducto from './paginas/admin/FormularioProducto';
import Sucursales from './paginas/admin/Sucursales';
import Categorias from './paginas/admin/Categorias';
import Descuentos from './paginas/admin/Descuentos';
import RequiereSucursal from './componentes/RequiereSucursal';
import Usuarios from './paginas/admin/Usuarios';
import Auditoria from './paginas/admin/Auditoria';
import MiClave from './paginas/admin/MiClave';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/menu/:sucursalId" element={<Menu />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <RutaProtegida roles={['ADMIN', 'OWNER']}>
            <Panel />
          </RutaProtegida>
        }
      >
        <Route index element={<Navigate to="productos" replace />} />
        <Route path="productos" element={<RequiereSucursal><ListaProductos /></RequiereSucursal>} />
        <Route path="productos/nuevo" element={<RequiereSucursal><FormularioProducto /></RequiereSucursal>} />
        <Route path="productos/:id/editar" element={<RequiereSucursal><FormularioProducto /></RequiereSucursal>} />
        <Route path="sucursales" element={<RutaProtegida roles={["OWNER"]}><Sucursales /></RutaProtegida>} />
        <Route path="categorias" element={<RutaProtegida roles={["OWNER"]}><Categorias /></RutaProtegida>} />
        <Route path="descuentos" element={<RequiereSucursal><Descuentos /></RequiereSucursal>} />
        <Route path="usuarios" element={<RutaProtegida roles={["OWNER"]}><Usuarios /></RutaProtegida>} />
        <Route path="auditoria" element={<RutaProtegida roles={["OWNER"]}><Auditoria /></RutaProtegida>} />
        <Route path="mi-clave" element={<MiClave />} />
      </Route>
      <Route path="*" element={<p className="aviso">Página no encontrada.</p>} />
    </Routes>
  );
}

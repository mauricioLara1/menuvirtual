import { Navigate, Route, Routes } from 'react-router-dom';
import RutaProtegida from './componentes/RutaProtegida';
import Inicio from './paginas/Inicio';
import Login from './paginas/Login';
import Menu from './paginas/Menu';
import Panel from './paginas/admin/Panel';
import ListaProductos from './paginas/admin/ListaProductos';
import FormularioProducto from './paginas/admin/FormularioProducto';

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
        <Route path="productos" element={<ListaProductos />} />
        <Route path="productos/nuevo" element={<FormularioProducto />} />
        <Route path="productos/:id/editar" element={<FormularioProducto />} />
      </Route>
      <Route path="*" element={<p className="aviso">Página no encontrada.</p>} />
    </Routes>
  );
}

import { Route, Routes } from 'react-router-dom';
import Inicio from './paginas/Inicio';
import Menu from './paginas/Menu';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/menu/:sucursalId" element={<Menu />} />
      <Route path="*" element={<p className="aviso">Página no encontrada.</p>} />
    </Routes>
  );
}

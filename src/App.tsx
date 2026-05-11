import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EscanerAsistencia from './pages/EscanerAsistencia';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Usamos el nuevo componente del escáner en la ruta /escanear */}
        <Route path="/escanear" element={<EscanerAsistencia />} />
      </Routes>
    </BrowserRouter>
  );
}
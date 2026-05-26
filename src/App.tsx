import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EscanerAsistencia from './pages/EscanerAsistencia';
import ProtectedRoute from './components/auth/ProtectedRoute';
import InactivityWrapper from './components/auth/InactivityWrapper';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <InactivityWrapper>
              <Dashboard />
            </InactivityWrapper>
          </ProtectedRoute>
        } />
        <Route path="/escanear" element={
          <ProtectedRoute>
            <InactivityWrapper>
              <EscanerAsistencia />
            </InactivityWrapper>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
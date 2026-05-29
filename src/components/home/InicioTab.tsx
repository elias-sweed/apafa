import { useQuery } from '@tanstack/react-query';
import { Users, QrCode, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { parentService } from '../../services/parentService';

export default function InicioTab({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await parentService.getStats();
      if (res.error) throw new Error(typeof res.error === 'string' ? res.error : 'Error al cargar estadisticas');
      return { totalEstudiantes: res.totalEstudiantes, totalAsociados: res.totalAsociados, sinDNI: res.sinDNI };
    },
    staleTime: 5 * 60 * 1000,
  });

  const s = stats || { totalEstudiantes: 0, totalAsociados: 0, sinDNI: 0 };
  const fmt = (n: number) => n.toLocaleString('en-US');

  return (
    <div className="space-y-8 animate-fade-in">
      
      <div className="bg-linear-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-2">¡Bienvenido al Sistema APAFA!</h2>
        <p className="text-blue-100 text-lg">Panel de control de la I.E. Jimenez Pimentel - Año 2026</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="theme-stat-card">
          <div className="p-4 bg-blue-500/15 text-blue-400 rounded-lg">
            <Users size={32} />
          </div>
          <div>
            <p className="text-sm text-dash-text-muted font-medium">Total Estudiantes</p>
            <p className="text-2xl font-bold text-dash-text">{fmt(s.totalEstudiantes)}</p>
          </div>
        </div>

        <div className="theme-stat-card">
          <div className="p-4 bg-green-500/15 text-green-400 rounded-lg">
            <ShieldCheck size={32} />
          </div>
          <div>
            <p className="text-sm text-dash-text-muted font-medium">Asociados Activos</p>
            <p className="text-2xl font-bold text-dash-text">{fmt(s.totalAsociados)}</p>
          </div>
        </div>

        <div className="theme-stat-card">
          <div className="p-4 bg-purple-500/15 text-purple-400 rounded-lg">
            <QrCode size={32} />
          </div>
          <div>
            <p className="text-sm text-dash-text-muted font-medium">Carnets a Generar</p>
            <p className="text-2xl font-bold text-dash-text">{fmt(s.totalAsociados)}</p>
          </div>
        </div>

        <div className="theme-stat-card">
          <div className="p-4 bg-orange-500/15 text-orange-400 rounded-lg">
            <AlertCircle size={32} />
          </div>
          <div>
            <p className="text-sm text-dash-text-muted font-medium">Faltan Datos (DNI)</p>
            <p className="text-2xl font-bold text-dash-text">{fmt(s.sinDNI)}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="theme-section-title">Accesos Rápidos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <button 
            onClick={() => setActiveTab('padres')}
            className="theme-action-card"
          >
            <div className="flex items-center gap-4">
              <div className="theme-action-icon">
                <Users size={24} />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-dash-text">Gestionar Datos de Padres</h4>
                <p className="text-sm text-dash-text-muted">Actualizar nombres, DNIs y corregir errores</p>
              </div>
            </div>
            <ArrowRight className="text-dash-text-subtle theme-action-card-arrow transition-colors" />
          </button>

          <button 
            onClick={() => setActiveTab('qrs')}
            className="theme-action-card"
          >
            <div className="flex items-center gap-4">
              <div className="theme-action-icon">
                <QrCode size={24} />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-dash-text">Imprimir Carnets</h4>
                <p className="text-sm text-dash-text-muted">Generar QRs y mandar a imprimir en A4 o PVC</p>
              </div>
            </div>
            <ArrowRight className="text-dash-text-subtle theme-action-card-arrow transition-colors" />
          </button>

        </div>
      </div>

    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { Users, QrCode, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { parentService } from '../../services/parentService';

export default function InicioTab({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await parentService.getStats();
      if (res.error) throw new Error(res.error);
      return { totalEstudiantes: res.totalEstudiantes, totalAsociados: res.totalAsociados, sinDNI: res.sinDNI };
    },
    staleTime: 5 * 60 * 1000,
  });

  const s = stats || { totalEstudiantes: 0, totalAsociados: 0, sinDNI: 0 };
  const fmt = (n: number) => n.toLocaleString('en-US');

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Mensaje de Bienvenida */}
      <div className="bg-linear-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-2">¡Bienvenido al Sistema APAFA!</h2>
        <p className="text-blue-100 text-lg">Panel de control de la I.E. Jimenez Pimentel - Año 2026</p>
      </div>

      {/* Tarjetas de Estadísticas (Visuales) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-100 text-blue-600 rounded-lg">
            <Users size={32} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Estudiantes</p>
            <p className="text-2xl font-bold text-slate-800">{fmt(s.totalEstudiantes)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-green-100 text-green-600 rounded-lg">
            <ShieldCheck size={32} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Asociados Activos</p>
            <p className="text-2xl font-bold text-slate-800">{fmt(s.totalAsociados)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-purple-100 text-purple-600 rounded-lg">
            <QrCode size={32} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Carnets a Generar</p>
            <p className="text-2xl font-bold text-slate-800">{fmt(s.totalAsociados)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-orange-100 text-orange-600 rounded-lg">
            <AlertCircle size={32} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Faltan Datos (DNI)</p>
            <p className="text-2xl font-bold text-slate-800">{fmt(s.sinDNI)}</p>
          </div>
        </div>
      </div>

      {/* Accesos Rápidos */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-4">Accesos Rápidos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <button 
            onClick={() => setActiveTab('padres')}
            className="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-50 text-slate-600 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                <Users size={24} />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-slate-800">Gestionar Datos de Padres</h4>
                <p className="text-sm text-slate-500">Actualizar nombres, DNIs y corregir errores</p>
              </div>
            </div>
            <ArrowRight className="text-slate-400 group-hover:text-blue-600 transition-colors" />
          </button>

          <button 
            onClick={() => setActiveTab('qrs')}
            className="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-50 text-slate-600 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                <QrCode size={24} />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-slate-800">Imprimir Carnets</h4>
                <p className="text-sm text-slate-500">Generar QRs y mandar a imprimir en A4 o PVC</p>
              </div>
            </div>
            <ArrowRight className="text-slate-400 group-hover:text-blue-600 transition-colors" />
          </button>

        </div>
      </div>

    </div>
  );
}
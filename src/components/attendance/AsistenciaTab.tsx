import { useEffect, useState } from 'react';
import { asistenciaService } from '../../services/asistenciaService';
import { Download, Users, Calendar, AlertTriangle } from 'lucide-react';

export default function AsistenciaTab() {
  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [inasistentes, setInasistentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');

    const [resAsistencias, resInasistentes] = await Promise.all([
      asistenciaService.obtenerAsistencias(),
      asistenciaService.exportarInasistentes(),
    ]);

    if (resAsistencias.error) setError(resAsistencias.error);
    else setAsistencias(resAsistencias.data || []);

    if (resInasistentes.error) setError(resInasistentes.error);
    else setInasistentes(resInasistentes.data || []);

    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const exportarCSV = () => {
    const headers = ['Apoderado', 'DNI', 'Hijos'];
    const rows = inasistentes.map((p: any) => [
      p.asociado_nombre,
      p.asociado_dni,
      p.hijos.map((h: any) => `${h.estudiante} (${h.grado} ${h.seccion})`).join('; '),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inasistentes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500 animate-pulse font-medium">Cargando asistencias...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
          <AlertTriangle size={20} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* TARJETAS DE RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <Calendar className="text-blue-600" size={28} />
            <div>
              <p className="text-2xl font-bold text-slate-800">{asistencias.length}</p>
              <p className="text-sm text-slate-500">Asistieron</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <Users className="text-orange-600" size={28} />
            <div>
              <p className="text-2xl font-bold text-slate-800">{inasistentes.length}</p>
              <p className="text-sm text-slate-500">No Asistieron</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <Users className="text-green-600" size={28} />
            <div>
              <p className="text-2xl font-bold text-slate-800">{asistencias.length + inasistentes.length}</p>
              <p className="text-sm text-slate-500">Total Padres</p>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA DE ASISTENCIA */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Registro de Asistencia</h3>
          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            <Download size={16} />
            Exportar Inasistentes
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-4">Apoderado</th>
                <th className="px-4 py-4">DNI</th>
                <th className="px-4 py-4">Hijos</th>
                <th className="px-4 py-4">Hora</th>
                <th className="px-4 py-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {asistencias.length === 0 && inasistentes.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-500">
                    No hay registros de asistencia aún.
                  </td>
                </tr>
              )}
              {asistencias.map((p: any) => (
                <tr key={p.id} className="hover:bg-green-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800 uppercase">
                    {p.asociado_nombre}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{p.asociado_dni}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    <div className="flex flex-wrap gap-1">
                      {p.hijos?.map((h: any, i: number) => (
                        <span key={i} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-medium">
                          {h.grado} "{h.seccion}"
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {p.created_at ? new Date(p.created_at).toLocaleTimeString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                      Asistió
                    </span>
                  </td>
                </tr>
              ))}
              {inasistentes.map((p: any) => (
                <tr key={p.asociado_dni} className="hover:bg-red-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800 uppercase">
                    {p.asociado_nombre}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{p.asociado_dni}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    <div className="flex flex-wrap gap-1">
                      {p.hijos?.map((h: any, i: number) => (
                        <span key={i} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium">
                          {h.grado} "{h.seccion}"
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">-</td>
                  <td className="px-4 py-3 text-center">
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                      Falta
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
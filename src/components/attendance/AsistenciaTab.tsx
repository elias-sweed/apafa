import { useEffect, useState } from 'react';
import { asistenciaService } from '../../services/asistenciaService';
import { Download, Users, Calendar, AlertTriangle, Trash2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

type Filtro = 'todos' | 'asistio' | 'falta';

const PAGE_SIZE = 20;

export default function AsistenciaTab() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<number | null>(null);
  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [inasistentes, setInasistentes] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [page, setPage] = useState(0);
  const [showCrear, setShowCrear] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState(new Date().toISOString().slice(0, 10));

  const cargarEventos = async () => {
    const res = await asistenciaService.obtenerEventos();
    if (res.data) {
      setEventos(res.data);
      if (res.data.length > 0) {
        setEventoSeleccionado(res.data[0].id);
      } else {
        setLoading(false);
      }
    }
  };

  const loadData = async () => {
    if (!eventoSeleccionado) return;
    setLoading(true);
    setError('');

    const [resAsistencias, resInasistentes] = await Promise.all([
      asistenciaService.obtenerAsistencias({ evento_id: eventoSeleccionado, page, pageSize: PAGE_SIZE }),
      asistenciaService.exportarInasistentes(eventoSeleccionado),
    ]);

    if (resAsistencias.error) setError(resAsistencias.error);
    else {
      setAsistencias(resAsistencias.data || []);
      setTotalCount(resAsistencias.count || 0);
    }

    if (resInasistentes.error) setError(resInasistentes.error);
    else setInasistentes(resInasistentes.data || []);

    setLoading(false);
  };

  useEffect(() => { cargarEventos(); }, []);

  useEffect(() => { loadData(); }, [eventoSeleccionado, page]);

  const crearEvento = async () => {
    if (!nuevoNombre.trim()) return;
    const res = await asistenciaService.crearEvento(nuevoNombre.trim(), nuevaFecha);
    if (res.data) {
      setEventos(prev => [res.data, ...prev]);
      setEventoSeleccionado(res.data.id);
      setShowCrear(false);
      setNuevoNombre('');
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar esta asistencia?')) return;
    await asistenciaService.eliminarAsistencia(id);
    loadData();
  };

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

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Combinar asistencias + inasistentes para la tabla filtrada
  const tablaCompleta = [
    ...asistencias.map((a: any) => ({ ...a, _estado: 'asistio' as const })),
    ...inasistentes.map((i: any) => ({ ...i, _estado: 'falta' as const })),
  ].filter(r => {
    if (filtro === 'asistio') return r._estado === 'asistio';
    if (filtro === 'falta') return r._estado === 'falta';
    return true;
  });

  const eventoActual = eventos.find(e => e.id === eventoSeleccionado);

  if (loading && asistencias.length === 0 && inasistentes.length === 0) {
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

      {/* SELECTOR DE EVENTO */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">Evento / Reunión</label>
        <div className="flex gap-2">
          <select
            value={eventoSeleccionado || ''}
            onChange={e => { setEventoSeleccionado(Number(e.target.value)); setPage(0); }}
            className="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-sm font-medium border border-slate-200 focus:outline-none focus:border-blue-500"
          >
            {eventos.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.fecha?.slice(0, 10)} - {ev.nombre}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowCrear(!showCrear)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-colors"
            title="Nuevo Evento"
          >
            <Plus size={20} />
          </button>
        </div>

        {showCrear && (
          <div className="mt-2 bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
            <input
              value={nuevoNombre}
              onChange={e => setNuevoNombre(e.target.value)}
              placeholder="Nombre del evento"
              className="w-full bg-white rounded-lg px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-blue-500"
            />
            <input
              type="date"
              value={nuevaFecha}
              onChange={e => setNuevaFecha(e.target.value)}
              className="w-full bg-white rounded-lg px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={crearEvento}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg text-sm transition-colors"
            >
              Crear Evento
            </button>
          </div>
        )}

        {eventoActual && (
          <div className="mt-2 flex items-center gap-2 text-slate-500 text-xs">
            <Calendar size={14} />
            <span>{eventoActual.fecha?.slice(0, 10)} - {eventoActual.nombre}</span>
          </div>
        )}
      </div>

      {/* TARJETAS DE RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <Calendar className="text-blue-600" size={28} />
            <div>
              <p className="text-2xl font-bold text-slate-800">{totalCount}</p>
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
              <p className="text-2xl font-bold text-slate-800">{totalCount + inasistentes.length}</p>
              <p className="text-sm text-slate-500">Total Padres</p>
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS Y EXPORTAR */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {(['todos', 'asistio', 'falta'] as Filtro[]).map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  filtro === f
                    ? f === 'asistio' ? 'bg-green-500 text-white shadow'
                      : f === 'falta' ? 'bg-red-500 text-white shadow'
                      : 'bg-blue-600 text-white shadow'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {f === 'todos' ? 'Todos' : f === 'asistio' ? 'Asistieron' : 'Falta'}
              </button>
            ))}
          </div>
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
                <th className="px-4 py-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tablaCompleta.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500">
                    No hay registros para este evento.
                  </td>
                </tr>
              )}
              {tablaCompleta.map((p: any) => (
                <tr key={p.asociado_dni || p.id} className={`transition-colors ${
                  p._estado === 'asistio' ? 'hover:bg-green-50/50' : 'hover:bg-red-50/50'
                }`}>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800 uppercase">
                    {p.asociado_nombre}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{p.asociado_dni}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    <div className="flex flex-wrap gap-1">
                      {p.hijos?.map((h: any, i: number) => (
                        <span key={i} className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          p._estado === 'asistio' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {h.grado} "{h.seccion}"
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">-
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      p._estado === 'asistio'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {p._estado === 'asistio' ? 'Asistió' : 'Falta'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p._estado === 'asistio' && (
                      <button
                        onClick={() => eliminar(p.id)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                        title="Eliminar asistencia"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        <div className="p-4 border-t border-slate-100 flex justify-between items-center">
          <span className="text-sm text-slate-600">
            Página {page + 1} de {totalPages || 1} ({totalCount} registros)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 rounded hover:bg-slate-100 border border-slate-200 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setPage(p => (p + 1 < totalPages ? p + 1 : p))}
              disabled={page + 1 >= totalPages}
              className="p-2 rounded hover:bg-slate-100 border border-slate-200 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

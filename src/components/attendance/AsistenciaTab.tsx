import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { asistenciaService } from '../../services/asistenciaService';
import { Download, Users, Calendar, AlertTriangle, Trash2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { toast } from 'sonner';

type Filtro = 'todos' | 'asistio' | 'falta';

const PAGE_SIZE = 20;

export default function AsistenciaTab() {
  const queryClient = useQueryClient();
  const [eventoSeleccionado, setEventoSeleccionado] = useState<number | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [page, setPage] = useState(0);
  const [showCrear, setShowCrear] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState(new Date().toISOString().slice(0, 10));

  const { data: eventos, error: eventosError } = useQuery({
    queryKey: ['eventos'],
    queryFn: async () => {
      const res = await asistenciaService.obtenerEventos();
      if (res.error) throw new Error(res.error);
      return res.data || [];
    },
  });

  // Select first event once loaded, and re-select if current event was deleted
  useEffect(() => {
    if (eventos && eventos.length > 0) {
      if (!eventoSeleccionado || !eventos.find(e => e.id === eventoSeleccionado)) {
        setEventoSeleccionado(eventos[0].id);
      }
    }
  }, [eventos, eventoSeleccionado]);

  const { data: asistenciasRaw, isLoading: loadingAsistencias, error: asistenciasError } = useQuery({
    queryKey: ['asistencias', eventoSeleccionado],
    queryFn: async () => {
      if (!eventoSeleccionado) return { asistencias: [], inasistentes: [], totalAsistieron: 0, totalPadres: 0, attendanceMap: new Map<number, number>() };
      const [resAsistencias, resInasistentes] = await Promise.all([
        asistenciaService.obtenerAsistencias({ evento_id: eventoSeleccionado }),
        asistenciaService.exportarInasistentes(eventoSeleccionado),
      ]);
      if (resAsistencias.error) throw new Error(resAsistencias.error);
      if (resInasistentes.error) throw new Error(resInasistentes.error);

      const map = new Map<number, number>();
      if (resAsistencias.data) {
        const { data: raw } = await supabase
          .from('asistencias')
          .select('id, padre_id')
          .eq('evento_id', eventoSeleccionado);
        for (const r of raw || []) {
          if (!map.has(r.padre_id)) map.set(r.padre_id, r.id);
        }
      }

      return {
        asistencias: resAsistencias.data || [],
        inasistentes: resInasistentes.data || [],
        totalAsistieron: resInasistentes.totalAsistieron || 0,
        totalPadres: resInasistentes.totalPadres || 0,
        attendanceMap: map,
      };
    },
    enabled: !!eventoSeleccionado,
  });

  const createEventMutation = useMutation({
    mutationFn: async () => {
      if (!nuevoNombre.trim()) throw new Error('Nombre requerido');
      const res = await asistenciaService.crearEvento(nuevoNombre.trim(), nuevaFecha);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['eventos'] });
      if (data) setEventoSeleccionado(data.id);
      setShowCrear(false);
      setNuevoNombre('');
    },
  });

  const deleteAttendanceMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await asistenciaService.eliminarAsistencia(id);
      if (res.error) throw new Error(res.error);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['asistencias', eventoSeleccionado] });
      const prev = queryClient.getQueryData(['asistencias', eventoSeleccionado]) as any;
      if (prev) {
        queryClient.setQueryData(['asistencias', eventoSeleccionado], {
          ...prev,
          asistencias: prev.asistencias.filter((a: any) => a.id !== id && a.padre_id !== id),
          totalAsistieron: Math.max(0, prev.totalAsistieron - 1),
        });
      }
      toast.success('Asistencia eliminada');
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) queryClient.setQueryData(['asistencias', eventoSeleccionado], context.prev);
      toast.error('Error al eliminar asistencia');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['asistencias', eventoSeleccionado] });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await asistenciaService.eliminarEvento(id);
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success('Evento eliminado');
      queryClient.invalidateQueries({ queryKey: ['eventos'] });
      setEventoSeleccionado(null);
    },
    onError: () => toast.error('Error al eliminar evento'),
  });

  const data = asistenciasRaw || { asistencias: [], inasistentes: [], totalAsistieron: 0, totalPadres: 0, attendanceMap: new Map() };
  const { asistencias, inasistentes, totalAsistieron, totalPadres, attendanceMap } = data;
  const error = eventosError ? (eventosError as Error).message : asistenciasError ? (asistenciasError as Error).message : '';

  // Combinar y ordenar todos los padres
  const tablaCompleta = [
    ...asistencias.map((a: any) => ({ ...a, _estado: 'asistio' as const })),
    ...inasistentes.map((i: any) => ({ ...i, _estado: 'falta' as const })),
  ]
    .filter(r => {
      if (filtro === 'asistio') return r._estado === 'asistio';
      if (filtro === 'falta') return r._estado === 'falta';
      return true;
    })
    .sort((a, b) => (a.asociado_nombre || '').localeCompare(b.asociado_nombre || ''));

  const totalFiltered = tablaCompleta.length;
  const totalPages = Math.ceil(totalFiltered / PAGE_SIZE);
  const paginaActual = tablaCompleta.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const eventoActual = eventos?.find(e => e.id === eventoSeleccionado);

  const exportarCSV = () => {
    const headers = ['Apoderado', 'DNI', 'Hijos'];
    const rows = inasistentes.map((p: any) => [
      p.asociado_nombre,
      p.asociado_dni,
      p.hijos?.map((h: any) => `${h.estudiante} (${h.grado} ${h.seccion})`).join('; '),
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

  if (loadingAsistencias && asistencias.length === 0 && inasistentes.length === 0) {
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
            {eventos?.map(ev => (
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
              onClick={() => createEventMutation.mutate()}
              disabled={createEventMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {createEventMutation.isPending ? 'Creando...' : 'Crear Evento'}
            </button>
          </div>
        )}

        {eventoActual && (
          <div className="mt-2 flex items-center gap-2 text-slate-500 text-xs">
            <Calendar size={14} />
            <span>{eventoActual.fecha?.slice(0, 10)} - {eventoActual.nombre}</span>
            <button
              onClick={() => {
                if (!confirm(`¿Eliminar evento "${eventoActual.nombre}"?`)) return;
                deleteEventMutation.mutate(eventoActual.id);
              }}
              className="ml-auto p-1 text-red-400 hover:text-red-600 transition-colors"
              title="Eliminar evento"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* TARJETAS DE RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <Calendar className="text-blue-600" size={28} />
            <div>
              <p className="text-2xl font-bold text-slate-800">{totalAsistieron}</p>
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
              <p className="text-2xl font-bold text-slate-800">{totalPadres}</p>
              <p className="text-sm text-slate-500">Total Padres</p>
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS Y EXPORTAR */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="hidden sm:inline">Filtrar:</span>
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {(['todos', 'asistio', 'falta'] as Filtro[]).map(f => (
              <button
                key={f}
                onClick={() => { setFiltro(f); setPage(0); }}
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
              {paginaActual.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500">
                    No hay registros para este evento.
                  </td>
                </tr>
              )}
              {paginaActual.map((p: any) => (
                <tr key={p.padre_id ? `a-${p.padre_id}` : `f-${p.asociado_dni || p.asociado_nombre}`} className={`transition-colors ${
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
                        onClick={() => {
                          const id = attendanceMap.get(p.padre_id) || p.id;
                          if (!confirm('¿Eliminar esta asistencia?')) return;
                          deleteAttendanceMutation.mutate(id);
                        }}
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
            Página {page + 1} de {totalPages || 1} ({totalFiltered} registros)
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

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '../components/Sidebar';
import FilterBar from '../components/parents/FilterBar';
import EditModal from '../components/parents/EditModal';
import AddParentModal from '../components/parents/AddParentModal';
import InicioTab from '../components/home/InicioTab';
import QRSynchronizedTab from '../components/parents/QRSynchronizedTab';
import AsistenciaTab from '../components/attendance/AsistenciaTab';
import ConfigTab from '../components/settings/ConfigTab';
import { parentService } from '../services/parentService';
import { formatParentNumero } from '../components/parents/ParentFormFields';
import { ChevronLeft, ChevronRight, Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { unregisterTodayPadronIds } from '../utils/todayPadronIds';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('inicio');
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const defaultFilters = {
    searchTerm: '',
    nivel: '',
    grado: '',
    seccion: '',
    incompleto: false,
    soloHoy: false,
    sortBy: 'alfabetico' as const,
    page: 0,
  };

  const [filters, setFilters] = useState(defaultFilters);

  const handleTabChange = (tab: string) => {
    const padresQr = (t: string) => t === 'padres' || t === 'qrs';
    if (padresQr(activeTab) && padresQr(tab) && tab !== activeTab) {
      setFilters({ ...defaultFilters });
    }
    setActiveTab(tab);
  };

  const pageSize = 100;

  const { data, isLoading } = useQuery({
    queryKey: ['parents', filters],
    queryFn: async () => {
      const res = await parentService.getParents({
        page: filters.page,
        pageSize,
        searchTerm: filters.searchTerm,
        nivel: filters.nivel,
        grado: filters.grado,
        seccion: filters.seccion,
        incompleto: filters.incompleto,
        soloHoy: filters.soloHoy,
        sortBy: filters.sortBy,
      });
      if (res.error) throw new Error(typeof res.error === 'string' ? res.error : 'Error al cargar datos');
      return { items: res.data || [], totalCount: res.count || 0 };
    },
    enabled: activeTab === 'padres' || activeTab === 'qrs',
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await parentService.deleteParent(ids);
      if (res.error) throw new Error(typeof res.error === 'string' ? res.error : 'Error al eliminar');
    },
    onSuccess: (_data, deletedIds) => {
      unregisterTodayPadronIds(deletedIds);
      toast.success('Eliminado correctamente');
      queryClient.invalidateQueries({ queryKey: ['parents'] });
    },
    onError: (err) => toast.error('Error al eliminar: ' + (err as Error).message),
  });

  const handleEdit = (parent: any) => {
    setSelectedParent(parent);
    setIsModalOpen(true);
  };

  const handleDelete = (rows: any[]) => {
    const display = rows[0]?.asociado_nombre || `DNI: ${rows[0]?.asociado_dni || '?'}`;
    if (!confirm(`¿Eliminar a ${display} y todos sus hijos del padrón?`)) return;
    deleteMutation.mutate(rows.map(r => r.id));
  };

  const rows = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="dashboard-theme">
      
      {/* SIDEBAR */}
      <div className="print:hidden">
        <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />
      </div>
      
      <main className="dashboard-main">
        
        {/* VISTA 0: INICIO */}
        {activeTab === 'inicio' && (
          <InicioTab setActiveTab={handleTabChange} />
        )}

        {/* ENCABEZADO INTELIGENTE (Aparece en todas menos en inicio) */}
        {activeTab !== 'inicio' && (
          <div className="print:hidden mb-6">
            <header className={activeTab === 'configuracion' || activeTab === 'config' ? 'mb-8' : 'mb-6'}>
              <h1 className="theme-page-title">
                {activeTab === 'padres' ? 'Datos de Padres' : 
                 activeTab === 'asistencia' ? 'Asistencia' :
                 activeTab === 'qrs' ? 'QRs Generados' : 
                 'Configuración del Sistema'}
              </h1>
              <p className="theme-page-subtitle">
                {activeTab === 'asistencia'
                  ? 'Registro de asistencia y control de inasistentes'
                  : activeTab === 'configuracion' || activeTab === 'config' 
                  ? 'Ajustes globales, importación de Excel y base de datos' 
                  : 'Gestión del padrón general de asociados'}
              </p>
            </header>

            {/* BARRA DE FILTROS - ¡Ojo! Solo se muestra en Padres y QRs */}
            {(activeTab === 'padres' || activeTab === 'qrs') && (
              <FilterBar filters={filters} setFilters={setFilters} />
            )}
          </div>
        )}

        {/* VISTA 3: ASISTENCIA */}
        {activeTab === 'asistencia' && (
          <div className="bg-transparent rounded-xl">
            <AsistenciaTab />
          </div>
        )}

        {/* VISTA 4: CONFIGURACIÓN */}
        {(activeTab === 'configuracion' || activeTab === 'config') && (
          <div className="bg-transparent rounded-xl">
            <ConfigTab />
          </div>
        )}

        {/* VISTA 1: TABLA DE PADRES */}
        {activeTab === 'padres' && (
          <>
            <div className="theme-card">
              <div className="theme-card-header">
                <span className="theme-hint">Haciendo clic en un padre puedes editar sus datos</span>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="theme-btn-primary"
                >
                  <Plus size={18} />
                  Agregar Padre
                </button>
              </div>
              {isLoading ? (
                <div className="w-full p-8 theme-loading">Cargando datos...</div>
              ) : rows.length === 0 ? (
                <div className="p-20 theme-empty">No se encontraron resultados.</div>
              ) : (
                <div className="overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="theme-table-head">
                      <tr>
                        <th className="px-4 py-4 w-24">N°</th>
                        <th className="px-4 py-4">Hijos</th>
                        <th className="px-4 py-4">Apoderado</th>
                        <th className="px-4 py-4">DNI</th>
                        <th className="px-4 py-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="theme-table-divide">
                      {(() => {
                        // Build name -> DNI lookup so rows with same name but missing DNI still group together
                        const nameToDNI: Record<string, string> = {};
                        for (const row of rows) {
                          const name = (row.asociado_nombre || '').trim().toUpperCase();
                          if (row.asociado_dni && name) nameToDNI[name] ||= row.asociado_dni;
                        }
                        const groups = new Map<string, { rows: any[]; dni: string; displayName: string }>();
                        const seenStudents = new Map<string, Set<string>>();
                        for (const row of rows) {
                          const name = (row.asociado_nombre || '').trim().toUpperCase();
                          const displayName = (row.asociado_nombre || '').trim();
                          const dni = row.asociado_dni || nameToDNI[name] || '';
                          const key = dni || name || `id-${row.id}`;
                          if (!groups.has(key)) groups.set(key, { rows: [], dni, displayName });
                          // Deduplicate students within a parent (same grado/seccion/estudiante)
                          const sKey = `${row.estudiante || ''}|${row.grado || ''}|${row.seccion || ''}`;
                          const set = seenStudents.get(key) || (seenStudents.set(key, new Set()), seenStudents.get(key)!);
                          if (!set.has(sKey)) { set.add(sKey); groups.get(key)!.rows.push(row); }
                        }
                        return Array.from(groups.entries()).map(([key, group]) => (
                          <tr key={key} className="theme-table-row">
                            <td className="px-4 py-3 align-top">
                              <span className="inline-block bg-yellow-500 text-black text-xs font-black px-2 py-1 rounded">
                                {formatParentNumero(group.rows[0].id)}
                              </span>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <div className="space-y-1">
                                {group.rows.map((r: any) => (
                                  <div key={r.id} className="text-[11px] text-dash-text-muted leading-tight">
                                    <span className="px-1.5 py-0.5 bg-dash-surface-elevated rounded text-[10px] font-medium uppercase">{r.grado} "{r.seccion}"</span>
                                    <span className="ml-1">{r.estudiante}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-dash-text uppercase">
                              {group.displayName || <span className="text-orange-500 text-xs italic">Falta Nombre</span>}
                            </td>
                            <td className="px-4 py-3 text-sm text-dash-text-muted">
                              {group.dni || <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs font-bold">SIN DNI</span>}
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button 
                                  onClick={() => handleEdit(group.rows[0])}
                                  className="theme-btn-icon-edit"
                                  title="Editar Datos"
                                >
                                  <Pencil size={18} />
                                </button>
                                <button 
                                  onClick={() => handleDelete(group.rows)}
                                  className="theme-btn-icon-delete"
                                  title="Eliminar"
                                >
                                  <Trash2 size={18} />
                                </button>
                                </div>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <EditModal 
              isOpen={isModalOpen} 
              onClose={() => setIsModalOpen(false)} 
              parent={selectedParent}
              onSaved={() => queryClient.invalidateQueries({ queryKey: ['parents'] })}
            />
            <AddParentModal 
              isOpen={isAddModalOpen} 
              onClose={() => setIsAddModalOpen(false)} 
              onSaved={() => queryClient.invalidateQueries({ queryKey: ['parents'] })}
            />
          </>
        )}

        {/* VISTA 2: PESTAÑA DE QRS */}
        {activeTab === 'qrs' && (
          <div className="bg-transparent rounded-xl">
            <QRSynchronizedTab data={rows} loading={isLoading} soloHoy={filters.soloHoy} />
          </div>
        )}

        {/* PAGINACIÓN - Solo si estamos en Padres o QRs */}
        {(activeTab === 'padres' || activeTab === 'qrs') && !isLoading && rows.length > 0 && (
          <div className="theme-pagination">
            <span className="text-sm text-dash-text-muted font-medium">
              Mostrando página {filters.page + 1} de {totalPages} <span className="text-dash-text-subtle mx-2">|</span> Total: <span className="font-bold text-dash-text">{totalCount}</span> registros
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setFilters(f => ({...f, page: Math.max(0, f.page - 1)}))}
                disabled={filters.page === 0}
                className="theme-btn-pagination"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setFilters(f => ({...f, page: f.page + 1}))}
                disabled={filters.page >= totalPages - 1}
                className="theme-btn-pagination"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

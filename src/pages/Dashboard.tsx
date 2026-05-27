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
import { ChevronLeft, ChevronRight, Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('inicio');
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    searchTerm: '',
    nivel: '',
    grado: '',
    incompleto: false,
    page: 0
  });

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
        incompleto: filters.incompleto,
      });
      if (res.error) throw new Error(res.error);
      return res.data || [];
    },
    enabled: activeTab === 'padres' || activeTab === 'qrs',
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ dni, name }: { dni: string; name: string }) => {
      const res = await parentService.deleteParent(dni, name);
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success('Eliminado correctamente');
      queryClient.invalidateQueries({ queryKey: ['parents'] });
    },
    onError: () => toast.error('Error al eliminar'),
  });

  const handleEdit = (parent: any) => {
    setSelectedParent(parent);
    setIsModalOpen(true);
  };

  const handleDelete = (dni: string, name: string) => {
    const display = name || `DNI: ${dni}`;
    if (!confirm(`¿Eliminar a ${display} y todos sus hijos del padrón?`)) return;
    deleteMutation.mutate({ dni, name });
  };

  const rows = data || [];

  return (
    <div className="flex bg-slate-50 min-h-screen print:bg-white">
      
      {/* SIDEBAR */}
      <div className="print:hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      
      {/* Le añadimos pb-16 (padding-bottom) para que nunca se corte al final */}
      <main className="ml-64 flex-1 p-8 pb-16 print:ml-0 print:p-0">
        
        {/* VISTA 0: INICIO */}
        {activeTab === 'inicio' && (
          <InicioTab setActiveTab={setActiveTab} />
        )}

        {/* ENCABEZADO INTELIGENTE (Aparece en todas menos en inicio) */}
        {activeTab !== 'inicio' && (
          <div className="print:hidden mb-6">
            <header className={activeTab === 'configuracion' || activeTab === 'config' ? 'mb-8' : 'mb-6'}>
              <h1 className="text-2xl font-bold text-slate-800 capitalize">
                {activeTab === 'padres' ? 'Datos de Padres' : 
                 activeTab === 'asistencia' ? 'Asistencia' :
                 activeTab === 'qrs' ? 'QRs Generados' : 
                 'Configuración del Sistema'}
              </h1>
              <p className="text-slate-500 text-sm">
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
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-slate-200 print:hidden">
                <span className="text-sm text-slate-500">Haciendo clic en un padre puedes editar sus datos</span>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus size={18} />
                  Agregar Padre
                </button>
              </div>
              {isLoading ? (
                <div className="w-full p-8 text-center text-slate-500 animate-pulse">Cargando datos...</div>
              ) : rows.length === 0 ? (
                <div className="p-20 text-center text-slate-500">No se encontraron resultados.</div>
              ) : (
                <div className="overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold tracking-wider">
                      <tr>
                        <th className="px-4 py-4">Hijos</th>
                        <th className="px-4 py-4">Apoderado</th>
                        <th className="px-4 py-4">DNI</th>
                        <th className="px-4 py-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
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
                          <tr key={key} className="hover:bg-blue-50/50 transition-colors">
                            <td className="px-4 py-3 align-top">
                              <div className="space-y-1">
                                {group.rows.map((r: any) => (
                                  <div key={r.id} className="text-[11px] text-slate-700 leading-tight">
                                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-medium uppercase">{r.grado} "{r.seccion}"</span>
                                    <span className="ml-1">{r.estudiante}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-slate-800 uppercase">
                              {group.displayName || <span className="text-orange-500 text-xs italic">Falta Nombre</span>}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-500">
                              {group.dni || <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">SIN DNI</span>}
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button 
                                  onClick={() => handleEdit(group.rows[0])}
                                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                  title="Editar Datos"
                                >
                                  <Pencil size={18} />
                                </button>
                                <button 
                                  onClick={() => handleDelete(group.dni, group.displayName)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
            <QRSynchronizedTab data={rows} loading={isLoading} pageOffset={filters.page * pageSize} />
          </div>
        )}

        {/* PAGINACIÓN - Solo si estamos en Padres o QRs */}
        {(activeTab === 'padres' || activeTab === 'qrs') && !isLoading && rows.length > 0 && (
          <div className="mt-6 p-4 bg-white shadow-sm rounded-xl border border-slate-200 flex justify-between items-center print:hidden">
            <span className="text-sm text-slate-600 font-medium">Mostrando página {filters.page + 1}</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setFilters(f => ({...f, page: Math.max(0, f.page - 1)}))}
                disabled={filters.page === 0}
                className="p-2 rounded hover:bg-slate-50 border border-slate-200 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setFilters(f => ({...f, page: f.page + 1}))}
                disabled={rows.length < pageSize}
                className="p-2 rounded hover:bg-slate-50 border border-slate-200 transition-all disabled:opacity-30"
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

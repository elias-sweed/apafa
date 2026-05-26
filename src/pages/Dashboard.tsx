import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import FilterBar from '../components/parents/FilterBar';
import EditModal from '../components/parents/EditModal';
import InicioTab from '../components/home/InicioTab';
import QRSynchronizedTab from '../components/parents/QRSynchronizedTab';
import AsistenciaTab from '../components/attendance/AsistenciaTab';
import ConfigTab from '../components/settings/ConfigTab';
import { parentService } from '../services/parentService';
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('inicio');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);

  const [filters, setFilters] = useState({
    searchTerm: '',
    nivel: '',
    grado: '',
    incompleto: false,
    page: 0
  });
  
  const pageSize = 100; 

  const loadData = async () => {
    setLoading(true);
    const { data: padres, error } = await parentService.getParents({
      page: filters.page,
      pageSize,
      searchTerm: filters.searchTerm,
      nivel: filters.nivel,
      grado: filters.grado,
      incompleto: filters.incompleto
    });

    if (!error) setData(padres || []);
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'padres' || activeTab === 'qrs') {
      const delay = setTimeout(() => { loadData(); }, 300);
      return () => clearTimeout(delay);
    } else {
      setLoading(false);
    }
  }, [filters, activeTab]);

  const handleEdit = (parent: any) => {
    setSelectedParent(parent);
    setIsModalOpen(true);
  };

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
              {loading ? (
                <div className="w-full p-8 text-center text-slate-500 animate-pulse">Cargando datos...</div>
              ) : data.length === 0 ? (
                <div className="p-20 text-center text-slate-500">No se encontraron resultados.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-max">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold tracking-wider">
                      <tr>
                        <th className="px-4 py-4">Grado/Sec</th>
                        <th className="px-4 py-4">Estudiante</th>
                        <th className="px-4 py-4">Asociado (Padre/Madre)</th>
                        <th className="px-4 py-4">DNI</th>
                        <th className="px-4 py-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.map((row) => (
                        <tr key={row.id} className="hover:bg-blue-50/50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium uppercase text-slate-800">{row.grado} - {row.seccion}</td>
                          <td className="px-4 py-3 text-sm text-slate-700 uppercase">{row.estudiante}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-800 uppercase">
                            {row.asociado_nombre || <span className="text-orange-500 text-xs italic">Falta Nombre</span>}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500">
                            {row.asociado_dni || <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">SIN DNI</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button 
                              onClick={() => handleEdit(row)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Editar Datos"
                            >
                              <Pencil size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <EditModal 
              isOpen={isModalOpen} 
              onClose={() => setIsModalOpen(false)} 
              parent={selectedParent}
              onSaved={loadData}
            />
          </>
        )}

        {/* VISTA 2: PESTAÑA DE QRS */}
        {activeTab === 'qrs' && (
          <div className="bg-transparent rounded-xl">
            <QRSynchronizedTab data={data} loading={loading} pageOffset={filters.page * pageSize} />
          </div>
        )}

        {/* PAGINACIÓN - Solo si estamos en Padres o QRs */}
        {(activeTab === 'padres' || activeTab === 'qrs') && !loading && data.length > 0 && (
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
                disabled={data.length < pageSize}
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
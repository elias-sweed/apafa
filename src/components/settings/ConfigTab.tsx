import { Settings, UploadCloud, Database, ShieldAlert, Save } from 'lucide-react';

export default function ConfigTab() {
  return (
    // Agregamos 'mx-auto' aquí para centrar todo el bloque en la pantalla
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      
      {/* Tarjeta 1: Importar Datos */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-100 p-6 bg-slate-50 flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Database size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Base de Datos</h2>
            <p className="text-sm text-slate-500">Importar o actualizar el padrón de asociados</p>
          </div>
        </div>
        
        <div className="p-6">
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer group">
            <UploadCloud size={48} className="mx-auto text-slate-400 group-hover:text-blue-500 mb-4 transition-colors" />
            <p className="text-slate-700 font-medium mb-1">Haz clic o arrastra tu archivo Excel (.xlsx o .csv)</p>
            <p className="text-sm text-slate-500">Las columnas deben ser: Grado, Sección, Estudiante, Padre, DNI</p>
            <button className="mt-4 bg-slate-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-900 transition-colors">
              Seleccionar Archivo
            </button>
          </div>
        </div>
      </div>

      {/* Tarjeta 2: Variables del Sistema */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-100 p-6 bg-slate-50 flex items-center gap-3">
          <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
            <Settings size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Variables del Sistema</h2>
            <p className="text-sm text-slate-500">Configuración global para los carnets y reportes</p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Año Académico</label>
            <input 
              type="text" 
              defaultValue="2026"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Institución</label>
            <input 
              type="text" 
              defaultValue="JIMENEZ PIMENTEL"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        <div className="p-6 pt-0 bg-white flex justify-end">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors">
            <Save size={20} /> Guardar Cambios
          </button>
        </div>
      </div>

      {/* Tarjeta 3: Peligro */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-full">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Zona de Peligro</h3>
              <p className="text-sm text-slate-500">Borrar todos los registros actuales (Irreversible)</p>
            </div>
          </div>
          <button className="border border-red-500 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-50 transition-colors">
            Vaciar Base de Datos
          </button>
        </div>
      </div>

    </div>
  );
}
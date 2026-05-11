import { Search, AlertCircle } from 'lucide-react';

export default function FilterBar({ filters, setFilters }: any) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-center">
      <div className="relative flex-1 min-w-62.5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text"
          placeholder="Buscar estudiante o DNI..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setFilters({...filters, searchTerm: e.target.value, page: 0})}
        />
      </div>

{/* 1. FILTRO DE NIVEL PRINCIPAL */}
      <select 
        className="px-4 py-2 rounded-lg border border-slate-200 outline-none bg-white"
        // TRUCO: Al cambiar de nivel, borramos el grado para que no haya cruces (ej. Secundaria con "3 Años")
        onChange={(e) => setFilters({...filters, nivel: e.target.value, grado: '', page: 0})}
        value={filters.nivel || ''}
      >
        <option value="">Todos los Niveles</option>
        <option value="INICIAL">Inicial</option>
        <option value="PRIMARIA">Primaria</option>
        <option value="SECUNDARIA">Secundaria</option>
      </select>

      {/* 2. FILTROS DINÁMICOS DE GRADO (Aparecen según el nivel que elijas) */}
      
      {/* Si eligió INICIAL, mostramos esto: */}
      {filters.nivel === 'INICIAL' && (
        <select 
          className="px-4 py-2 rounded-lg border border-slate-200 outline-none bg-white animate-in fade-in"
          onChange={(e) => setFilters({...filters, grado: e.target.value, page: 0})}
          value={filters.grado || ''}
        >
          <option value="">Todos los Grados</option>
          <option value="3 AÑOS">3 Años</option>
          <option value="4 AÑOS">4 Años</option>
          <option value="5 AÑOS">5 Años</option>
        </select>
      )}

      {/* Si eligió PRIMARIA, mostramos esto: */}
      {filters.nivel === 'PRIMARIA' && (
        <select 
          className="px-4 py-2 rounded-lg border border-slate-200 outline-none bg-white animate-in fade-in"
          onChange={(e) => setFilters({...filters, grado: e.target.value, page: 0})}
          value={filters.grado || ''}
        >
          <option value="">Todos los Grados</option>
          <option value="PRIMERO">Primero</option>
          <option value="SEGUNDO">Segundo</option>
          <option value="TERCERO">Tercero</option>
          <option value="CUARTO">Cuarto</option>
          <option value="QUINTO">Quinto</option>
          <option value="SEXTO">Sexto</option>
        </select>
      )}

      {/* Si eligió SECUNDARIA, mostramos esto: */}
      {filters.nivel === 'SECUNDARIA' && (
        <select 
          className="px-4 py-2 rounded-lg border border-slate-200 outline-none bg-white animate-in fade-in"
          onChange={(e) => setFilters({...filters, grado: e.target.value, page: 0})}
          value={filters.grado || ''}
        >
          <option value="">Todos los Grados</option>
          <option value="PRIMERO">Primero</option>
          <option value="SEGUNDO">Segundo</option>
          <option value="TERCERO">Tercero</option>
          <option value="CUARTO">Cuarto</option>
          <option value="QUINTO">Quinto</option>
        </select>
      )}

      <button 
        onClick={() => setFilters({...filters, incompleto: !filters.incompleto, page: 0})}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
          filters.incompleto ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-slate-200 text-slate-600'
        }`}
      >
        <AlertCircle size={18} />
        Faltan Datos
      </button>
    </div>
  );
}
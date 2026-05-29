import { Search, AlertCircle, X, CalendarClock } from 'lucide-react';
import { getTodayPadronCount } from '../../utils/todayPadronIds';

export default function FilterBar({ filters, setFilters }: any) {
  const secciones = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'U', 'UNICA'];

  const clearSearch = () => setFilters({ ...filters, searchTerm: '', page: 0 });

  const selectClass = 'theme-select';

  return (
    <div className="theme-panel mb-6 flex flex-wrap gap-4 items-center">
      <div className="relative flex-1 min-w-62.5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dash-text-subtle" size={18} />
        <input
          type="text"
          placeholder="Buscar estudiante o DNI..."
          value={filters.searchTerm || ''}
          className={`theme-search-input ${filters.searchTerm ? 'pr-10' : 'pr-4'}`}
          onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value, page: 0 })}
        />
        {filters.searchTerm && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-dash-text-subtle hover:text-dash-text hover:bg-dash-surface-elevated rounded-full transition-colors"
            title="Limpiar búsqueda"
            aria-label="Limpiar búsqueda"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <select 
        className="theme-select"
        onChange={(e) => setFilters({...filters, sortBy: e.target.value, page: 0})}
        value={filters.sortBy || 'alfabetico'}
      >
        <option value="alfabetico">Alfabético</option>
        <option value="recientes">Más Recientes</option>
      </select>

      <select 
        className="theme-select"
        onChange={(e) => setFilters({...filters, nivel: e.target.value, grado: '', seccion: '', page: 0})}
        value={filters.nivel || ''}
      >
        <option value="">Todos los Niveles</option>
        <option value="INICIAL">Inicial</option>
        <option value="PRIMARIA">Primaria</option>
        <option value="SECUNDARIA">Secundaria</option>
      </select>

      {filters.nivel === 'INICIAL' && (
        <select 
          className={selectClass}
          onChange={(e) => setFilters({...filters, grado: e.target.value, seccion: '', page: 0})}
          value={filters.grado || ''}
        >
          <option value="">Todos los Grados</option>
          <option value="3 AÑOS">3 Años</option>
          <option value="4 AÑOS">4 Años</option>
          <option value="5 AÑOS">5 Años</option>
        </select>
      )}

      {filters.nivel === 'PRIMARIA' && (
        <select 
          className={selectClass}
          onChange={(e) => setFilters({...filters, grado: e.target.value, seccion: '', page: 0})}
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

      {filters.nivel === 'SECUNDARIA' && (
        <select 
          className={selectClass}
          onChange={(e) => setFilters({...filters, grado: e.target.value, seccion: '', page: 0})}
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

      {filters.nivel && (
        <select 
          className={selectClass}
          onChange={(e) => setFilters({...filters, seccion: e.target.value, page: 0})}
          value={filters.seccion || ''}
        >
          <option value="">Todas las Secciones</option>
          {secciones.map(sec => (
            <option key={sec} value={sec}>{sec}</option>
          ))}
        </select>
      )}

      <button
        type="button"
        onClick={() => setFilters({ ...filters, soloHoy: !filters.soloHoy, page: 0 })}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
          filters.soloHoy
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
            : 'bg-dash-surface-elevated border-dash-border text-dash-text-muted'
        }`}
        title="Solo registros agregados hoy (Excel o manual)"
      >
        <CalendarClock size={18} />
        Agregados hoy
        {getTodayPadronCount() > 0 && (
          <span className="text-xs font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">
            {getTodayPadronCount()}
          </span>
        )}
      </button>

      <button 
        onClick={() => setFilters({...filters, incompleto: !filters.incompleto, page: 0})}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
          filters.incompleto
            ? 'bg-orange-500/15 border-orange-500/40 text-orange-400'
            : 'bg-dash-surface-elevated border-dash-border text-dash-text-muted'
        }`}
      >
        <AlertCircle size={18} />
        Faltan Datos
      </button>
    </div>
  );
}

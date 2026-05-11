import { supabase } from '../lib/supabase';

interface DatosQR {
  padre_id?: number;
  asociado_dni?: string;
  asociado_nombre?: string;
  segundo_responsable?: string;
}

const parsearQR = (qrData: string): DatosQR | null => {
  try {
    return JSON.parse(qrData);
  } catch {
    return null;
  }
};

export const asistenciaService = {
  registrarAsistencia: async (qrData: string) => {
    try {
      const datosQR = parsearQR(qrData);
      if (!datosQR || !datosQR.padre_id) {
        return { error: 'QR invalido: no contiene un identificador de padre valido.' };
      }

      const padreId = Number(datosQR.padre_id);
      if (!Number.isFinite(padreId)) {
        return { error: 'QR invalido: identificador de padre no numerico.' };
      }

      // 1. Guardamos la asistencia
      const { error: insertError } = await supabase
        .from('asistencias')
        .insert([{ 
          padre_id: padreId,
          evento: 'Asamblea APAFA 2026' 
        }]);

      // Si hay error 23505, significa que ya estaba registrado (Unique Constraint)
      if (insertError) {
        if (insertError.code === '23505') {
          return { error: 'DUPLICADO' };
        }
        return { error: 'Error al registrar en la base de datos.' };
      }

      // 2. Traemos los datos del padre
      const { data: padre, error: fetchError } = await supabase
        .from('padron_general')
        .select('*')
        .eq('id', padreId)
        .single();

      if (fetchError) return { error: 'Asistencia guardada, pero no se pudo cargar el nombre.' };

      // 3. Buscamos todos los hijos del mismo padre (por DNI) para mostrar grado/seccion
      const dni = datosQR.asociado_dni || padre.asociado_dni;
      let hijos: any[] = [];
      if (dni) {
        const { data: siblings } = await supabase
          .from('padron_general')
          .select('estudiante, grado, seccion, nivel')
          .eq('asociado_dni', dni)
          .order('estudiante', { ascending: true });
        if (siblings) {
          hijos = siblings;
        }
      }

      return { data: { ...padre, hijos }, error: null };
    } catch (err) {
      return { error: 'Error de conexión.' };
    }
  },

  // Modo clasificador: solo lee la info del QR sin registrar asistencia
  clasificarCarnet: async (qrData: string) => {
    try {
      const datosQR = parsearQR(qrData);
      if (!datosQR || !datosQR.padre_id) {
        return { error: 'QR invalido.' };
      }

      const padreId = Number(datosQR.padre_id);
      if (!Number.isFinite(padreId)) {
        return { error: 'QR invalido.' };
      }

      const { data: padre, error: fetchError } = await supabase
        .from('padron_general')
        .select('*')
        .eq('id', padreId)
        .single();

      if (fetchError) return { error: 'No se encontro el registro.' };

      const dni = datosQR.asociado_dni || padre.asociado_dni;
      let hijos: any[] = [];
      if (dni) {
        const { data: siblings } = await supabase
          .from('padron_general')
          .select('estudiante, grado, seccion, nivel')
          .eq('asociado_dni', dni)
          .order('estudiante', { ascending: true });
        if (siblings) {
          hijos = siblings;
        }
      }

      return { data: { ...padre, hijos }, error: null };
    } catch {
      return { error: 'Error de conexión.' };
    }
  },

  obtenerAsistencias: async ({ evento }: { evento?: string } = {}) => {
    try {
      let query = supabase
        .from('asistencias')
        .select('*')
        .order('created_at', { ascending: false });

      if (evento) {
        query = query.eq('evento', evento);
      }

      const { data: asistencias, error } = await query;
      if (error) return { error: 'Error al cargar asistencias.' };

      // Obtener todos los padre_id únicos y traer sus datos
      const ids = [...new Set(asistencias?.map(a => a.padre_id).filter(Boolean) || [])];
      const { data: padres } = await supabase
        .from('padron_general')
        .select('*')
        .in('id', ids);

      const padresPorId = new Map(padres?.map(p => [p.id, p]) || []);

      // Agrupar por asociado_dni
      const map = new Map<string, any>();
      for (const row of asistencias || []) {
        const p = padresPorId.get(row.padre_id);
        const dni = p?.asociado_dni || `id-${row.padre_id}`;
        if (!map.has(dni)) {
          map.set(dni, {
            id: row.id,
            padre_id: row.padre_id,
            asociado_nombre: p?.asociado_nombre || '',
            asociado_dni: p?.asociado_dni || '',
            segundo_responsable: p?.segundo_responsable || '',
            created_at: row.created_at,
            evento: row.evento,
            hijos: [],
          });
        }
        if (p) {
          const entry = map.get(dni);
          if (!entry.hijos.some((h: any) => h.estudiante === p.estudiante)) {
            entry.hijos.push({
              estudiante: p.estudiante,
              grado: p.grado,
              seccion: p.seccion,
              nivel: p.nivel,
            });
          }
        }
      }

      return { data: Array.from(map.values()), error: null };
    } catch {
      return { error: 'Error de conexión.' };
    }
  },

  exportarInasistentes: async ({ evento }: { evento?: string } = {}) => {
    try {
      const eventoFiltro = evento || 'Asamblea APAFA 2026';

      // 1. Obtener los padre_id que ya asistieron al evento
      const { data: asistencias } = await supabase
        .from('asistencias')
        .select('padre_id')
        .eq('evento', eventoFiltro);

      const idsAsistieron = new Set(asistencias?.map(a => a.padre_id) || []);

      // 2. Traer todos los registros del padrón agrupados por DNI
      const { data: padron, error: errPadron } = await supabase
        .from('padron_general')
        .select('id, asociado_dni, asociado_nombre, estudiante, grado, seccion, nivel')
        .not('asociado_dni', 'is', null);

      if (errPadron) return { error: 'Error al cargar el padrón.' };

      // 3. Agrupar por DNI y determinar si algún hijo asistió
      const padresMap = new Map<string, any>();
      for (const row of padron) {
        const dni = row.asociado_dni;
        if (!padresMap.has(dni)) {
          padresMap.set(dni, {
            asociado_nombre: row.asociado_nombre,
            asociado_dni: dni,
            asistio: false,
            hijos: [],
          });
        }
        const entry = padresMap.get(dni);
        if (idsAsistieron.has(row.id)) {
          entry.asistio = true;
        }
        entry.hijos.push({
          estudiante: row.estudiante,
          grado: row.grado,
          seccion: row.seccion,
          nivel: row.nivel,
        });
      }

      // 4. Filtrar solo los que NO asistieron
      const inasistentes = Array.from(padresMap.values())
        .filter(p => !p.asistio)
        .sort((a, b) => a.asociado_nombre?.localeCompare(b.asociado_nombre));

      return { data: inasistentes, error: null };
    } catch {
      return { error: 'Error de conexión.' };
    }
  }
};
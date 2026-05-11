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
  // EVENTOS
  obtenerEventos: async () => {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) return { error: 'Error al cargar eventos.' };
      return { data: data || [], error: null };
    } catch {
      return { error: 'Error de conexión.' };
    }
  },

  crearEvento: async (nombre: string, fecha: string) => {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .insert([{ nombre, fecha }])
        .select()
        .single();

      if (error) return { error: 'Error al crear evento.' };
      return { data, error: null };
    } catch {
      return { error: 'Error de conexión.' };
    }
  },

  eliminarEvento: async (id: number) => {
    try {
      const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', id);

      if (error) return { error: 'Error al eliminar evento.' };
      return { error: null };
    } catch {
      return { error: 'Error de conexión.' };
    }
  },

  // ASISTENCIA
  registrarAsistencia: async (qrData: string, eventoId: number) => {
    try {
      const datosQR = parsearQR(qrData);
      if (!datosQR || !datosQR.padre_id) {
        return { error: 'QR invalido: no contiene un identificador de padre valido.' };
      }

      const padreId = Number(datosQR.padre_id);
      if (!Number.isFinite(padreId)) {
        return { error: 'QR invalido: identificador de padre no numerico.' };
      }

      const { error: insertError } = await supabase
        .from('asistencias')
        .insert([{ padre_id: padreId, evento_id: eventoId }]);

      if (insertError) {
        if (insertError.code === '23505') {
          return { error: 'DUPLICADO' };
        }
        return { error: 'Error al registrar en la base de datos.' };
      }

      const { data: padre, error: fetchError } = await supabase
        .from('padron_general')
        .select('*')
        .eq('id', padreId)
        .single();

      if (fetchError) return { error: 'Asistencia guardada, pero no se pudo cargar el nombre.' };

      const dni = datosQR.asociado_dni || padre?.asociado_dni;
      let hijos: any[] = [];
      if (dni) {
        const { data: siblings } = await supabase
          .from('padron_general')
          .select('estudiante, grado, seccion, nivel')
          .eq('asociado_dni', dni)
          .order('estudiante', { ascending: true });
        if (siblings) hijos = siblings;
      }

      return { data: { ...padre, hijos }, error: null };
    } catch {
      return { error: 'Error de conexión.' };
    }
  },

  obtenerAsistencias: async ({ evento_id, page, pageSize }: { evento_id?: number; page?: number; pageSize?: number } = {}) => {
    try {
      let query = supabase
        .from('asistencias')
        .select('*', { count: 'exact' })
        .order('id', { ascending: false });

      if (evento_id) query = query.eq('evento_id', evento_id);

      if (page !== undefined && pageSize !== undefined) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const { data: asistencias, error, count } = await query;
      if (error) return { error: 'Error al cargar asistencias.', data: [], count: 0 };

      const ids = [...new Set(asistencias?.map(a => a.padre_id).filter(Boolean) || [])];
      const { data: padres } = await supabase
        .from('padron_general')
        .select('*')
        .in('id', ids);

      const padresPorId = new Map(padres?.map(p => [p.id, p]) || []);

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
            created_at: row.created_at,
            evento_id: row.evento_id,
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

      return { data: Array.from(map.values()), count: count || 0, error: null };
    } catch {
      return { error: 'Error de conexión.', data: [], count: 0 };
    }
  },

  eliminarAsistencia: async (id: number) => {
    try {
      const { error } = await supabase
        .from('asistencias')
        .delete()
        .eq('id', id);

      if (error) return { error: 'Error al eliminar asistencia.' };
      return { error: null };
    } catch {
      return { error: 'Error de conexión.' };
    }
  },

  exportarInasistentes: async (eventoId: number) => {
    try {
      const { data: asistencias } = await supabase
        .from('asistencias')
        .select('padre_id')
        .eq('evento_id', eventoId);

      const idsAsistieron = new Set(asistencias?.map(a => a.padre_id) || []);

      const { data: padron, error: errPadron } = await supabase
        .from('padron_general')
        .select('id, asociado_dni, asociado_nombre, estudiante, grado, seccion, nivel');

      if (errPadron) return { error: 'Error al cargar el padrón.', data: [] };

      const padresMap = new Map<string, any>();
      for (const row of padron || []) {
        const key = row.asociado_dni || row.asociado_nombre || `sinid-${row.id}`;
        if (!padresMap.has(key)) {
          padresMap.set(key, {
            asociado_nombre: row.asociado_nombre,
            asociado_dni: row.asociado_dni || '',
            asistio: false,
            hijos: [],
          });
        }
        const entry = padresMap.get(key);
        if (idsAsistieron.has(row.id)) entry.asistio = true;
        if (!entry.hijos.some((h: any) => h.estudiante === row.estudiante)) {
          entry.hijos.push({
            estudiante: row.estudiante,
            grado: row.grado,
            seccion: row.seccion,
            nivel: row.nivel,
          });
        }
      }

      const todos = Array.from(padresMap.values());
      const totalAsistieron = todos.filter(p => p.asistio).length;
      const inasistentes = todos
        .filter(p => !p.asistio)
        .sort((a, b) => (a.asociado_nombre || '').localeCompare(b.asociado_nombre || ''));

      return { data: inasistentes, totalAsistieron, totalPadres: todos.length, error: null };
    } catch {
      return { error: 'Error de conexión.', data: [], totalAsistieron: 0, totalPadres: 0 };
    }
  }
};

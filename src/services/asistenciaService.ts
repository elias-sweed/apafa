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
      const { error: errAsist } = await supabase
        .from('asistencias')
        .delete()
        .eq('evento_id', id);
      if (errAsist) return { error: 'Error al eliminar asistencias del evento.' };

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

      // Verificar si ya existe asistencia para este padre en este evento
      const { data: existente } = await supabase
        .from('asistencias')
        .select('id')
        .eq('padre_id', padreId)
        .eq('evento_id', eventoId)
        .maybeSingle();
      if (existente) {
        return { error: 'DUPLICADO' };
      }

      const { error: insertError } = await supabase
        .from('asistencias')
        .insert([{ padre_id: padreId, evento_id: eventoId }]);

      if (insertError) {
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

      let asistencias: any[];
      let count: number | null;

      if (page !== undefined && pageSize !== undefined) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        const res = await query.range(from, to);
        if (res.error) return { error: 'Error al cargar asistencias.', data: [], count: 0 };
        asistencias = res.data || [];
        count = res.count;
      } else {
        let all: any[] = [];
        let from = 0;
        const ps = 1000;
        while (true) {
          const res = await supabase
            .from('asistencias')
            .select('*')
            .order('id', { ascending: false })
            .eq('evento_id', evento_id!)
            .range(from, from + ps - 1);
          if (res.error) return { error: 'Error al cargar asistencias.', data: [], count: 0 };
          if (!res.data || res.data.length === 0) break;
          all = all.concat(res.data);
          from += ps;
        }
        asistencias = all;
        count = asistencias.length;
      }

      const ids = [...new Set(asistencias?.map(a => a.padre_id).filter(Boolean) || [])];

      let padresData: any[] = [];
      if (ids.length > 0) {
        let offset = 0;
        while (true) {
          const batch = ids.slice(offset, offset + 200);
          if (batch.length === 0) break;
          const { data } = await supabase.from('padron_general').select('*').in('id', batch);
          if (data) padresData = padresData.concat(data);
          offset += 200;
        }
      }
      const padresPorId = new Map(padresData?.map(p => [p.id, p]) || []);

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

      let allPadron: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error: err } = await supabase
          .from('padron_general')
          .select('id, asociado_dni, asociado_nombre, estudiante, grado, seccion, nivel')
          .range(from, from + pageSize - 1);
        if (err) return { error: 'Error al cargar el padrón.', data: [] };
        if (!data || data.length === 0) break;
        allPadron = allPadron.concat(data);
        from += pageSize;
      }

      const padresMap = new Map<string, any>();
      for (const row of allPadron || []) {
        const key = row.asociado_dni || (row.asociado_nombre || '').trim().toUpperCase() || `unknown`;
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

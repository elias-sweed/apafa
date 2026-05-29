import { supabase } from '../lib/supabase';
import { getTodayPadronIds } from '../utils/todayPadronIds';

async function fetchAllPadronIds(): Promise<number[]> {
  const all: number[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('padron_general')
      .select('id')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data?.length) break;

    all.push(...data.map((r) => Number(r.id)));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return all;
}

/** Reutiliza el primer N° libre (ej. si borraste 1816, el siguiente será 1816). */
function allocatePadronIds(existingIds: number[], count: number): number[] {
  const used = new Set(existingIds);
  const result: number[] = [];
  let candidate = 1;

  while (result.length < count) {
    if (!used.has(candidate)) {
      result.push(candidate);
      used.add(candidate);
    }
    candidate++;
  }

  return result;
}

export const parentService = {
  async getParents({ page, pageSize, searchTerm, nivel, grado, seccion, incompleto, sortBy, soloHoy }: any) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('padron_general').select('*', { count: 'exact' });

    // Filtro de Búsqueda General
    if (searchTerm) {
      // Separamos los términos por espacios para buscar en diferentes columnas
      const terms = searchTerm.trim().split(/\s+/);
      
      terms.forEach((term: string) => {
        let orString = `estudiante.ilike.%${term}%,dni_estudiante.ilike.%${term}%,asociado_dni.ilike.%${term}%,asociado_nombre.ilike.%${term}%,grado.ilike.%${term}%,seccion.ilike.%${term}%`;
        
        // Si el término es numérico (ej. "0001"), también buscamos por ID
        const numId = parseInt(term, 10);
        if (!isNaN(numId)) {
          orString += `,id.eq.${numId}`;
        }
        
        query = query.or(orString);
      });
    }

    // Filtros por Categoría
    if (nivel) query = query.eq('nivel', nivel);
    if (grado) query = query.eq('grado', grado);
    if (seccion) query = query.eq('seccion', seccion);

    // FILTRO CRÍTICO: Padres sin datos completos (DNI vacío o null)
    if (incompleto) {
      query = query.or('asociado_dni.is.null, asociado_dni.eq.""');
    }

    if (soloHoy) {
      const todayIds = getTodayPadronIds();
      if (todayIds.length === 0) {
        return { data: [], error: null, count: 0 };
      }
      query = query.in('id', todayIds);
    }

    // Ordenamiento
    if (sortBy === 'recientes') {
      query = query.order('id', { ascending: false });
    } else {
      query = query.order('estudiante', { ascending: true });
    }

    const { data, error, count } = await query.range(from, to);
    return { data, error, count };
  },

  async updateParent(id: number, updates: any) {
    const { data, error } = await supabase
      .from('padron_general')
      .update(updates)
      .eq('id', id);
    return { data, error };
  },

  async getStats() {
    const { count: totalRows } = await supabase
      .from('padron_general')
      .select('*', { count: 'exact', head: true });

    let all: any[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data } = await supabase
        .from('padron_general')
        .select('asociado_dni, asociado_nombre')
        .range(from, from + pageSize - 1);
      if (!data || data.length === 0) break;
      all = all.concat(data);
      from += pageSize;
    }

    const unique = new Map<string, any>();
    let sinDNI = 0;
    for (const row of all) {
      const key = row.asociado_dni || (row.asociado_nombre || '').trim().toUpperCase() || `unknown`;
      if (!unique.has(key)) {
        unique.set(key, row);
        if (!row.asociado_dni) sinDNI++;
      }
    }
    return {
      error: null,
      totalEstudiantes: totalRows || all.length,
      totalAsociados: unique.size,
      sinDNI,
    };
  },

  async deleteParent(ids: number[]) {
    const { error } = await supabase.from('padron_general').delete().in('id', ids);
    return { error };
  },

  async addParent(data: any) {
    try {
      const existing = await fetchAllPadronIds();
      const [id] = allocatePadronIds(existing, 1);
      const { data: inserted, error } = await supabase
        .from('padron_general')
        .insert([{ ...data, id }])
        .select('id');
      const assignedId = inserted?.[0]?.id != null ? Number(inserted[0].id) : id;
      return { error, id: assignedId };
    } catch (error) {
      return { error, id: undefined };
    }
  },

  async getNextId() {
    try {
      const existing = await fetchAllPadronIds();
      const [nextId] = allocatePadronIds(existing, 1);
      return { nextId, error: null };
    } catch (error) {
      return { nextId: 1, error };
    }
  },

  async bulkInsertParents(rows: Record<string, unknown>[]) {
    const BATCH_SIZE = 500;
    let inserted = 0;
    const ids: number[] = [];

    try {
      const existing = await fetchAllPadronIds();
      const newIds = allocatePadronIds(existing, rows.length);
      let idIndex = 0;

      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const slice = rows.slice(i, i + BATCH_SIZE);
        const batch = slice.map((row) => {
          const id = newIds[idIndex++];
          return { ...row, id };
        });

        const { data, error } = await supabase.from('padron_general').insert(batch).select('id');
        if (error) {
          return { error, inserted, ids };
        }
        if (data) {
          ids.push(...data.map((r) => Number(r.id)));
        }
        inserted += slice.length;
      }

      return { error: null, inserted, ids };
    } catch (error) {
      return { error, inserted, ids };
    }
  },

  async clearAllParents() {
    const { error } = await supabase.from('padron_general').delete().gte('id', 0);
    return { error };
  },
};
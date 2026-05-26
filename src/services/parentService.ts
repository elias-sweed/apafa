import { supabase } from '../lib/supabase';

export const parentService = {
  async getParents({ page, pageSize, searchTerm, nivel, grado, incompleto }: any) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('padron_general').select('*', { count: 'exact' });

    // Filtro de Búsqueda General
    if (searchTerm) {
      query = query.or(`estudiante.ilike.%${searchTerm}%,dni_estudiante.ilike.%${searchTerm}%,asociado_dni.ilike.%${searchTerm}%`);
    }

    // Filtros por Categoría
    if (nivel) query = query.eq('nivel', nivel);
    if (grado) query = query.eq('grado', grado);

    // FILTRO CRÍTICO: Padres sin datos completos (DNI vacío o null)
    if (incompleto) {
      query = query.or('asociado_dni.is.null, asociado_dni.eq.""');
    }

    const { data, error, count } = await query.range(from, to).order('estudiante', { ascending: true });
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

  async deleteParent(dni: string, name: string) {
    const query = dni
      ? supabase.from('padron_general').delete().eq('asociado_dni', dni)
      : supabase.from('padron_general').delete().eq('asociado_nombre', name);
    const { error } = await query;
    return { error };
  },

  async addParent(data: any) {
    const { error } = await supabase.from('padron_general').insert([data]);
    return { error };
  }
};
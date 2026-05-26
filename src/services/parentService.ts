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
    const { data, error } = await supabase
      .from('padron_general')
      .select('asociado_dni, asociado_nombre');

    if (error) return { error, totalEstudiantes: 0, totalAsociados: 0, sinDNI: 0 };

    const unique = new Map<string, any>();
    let sinDNI = 0;
    for (const row of data || []) {
      const key = row.asociado_dni || row.asociado_nombre || `unknown`;
      if (!unique.has(key)) {
        unique.set(key, row);
        if (!row.asociado_dni) sinDNI++;
      }
    }
    return {
      error: null,
      totalEstudiantes: data?.length || 0,
      totalAsociados: unique.size,
      sinDNI,
    };
  }
};
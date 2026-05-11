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
  }
};
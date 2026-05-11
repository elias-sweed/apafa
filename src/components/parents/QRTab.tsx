import CarnetCard from './CarnetCard';

export default function QRTab({ data, loading }: { data: any[], loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col md:flex-row gap-4 items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200 animate-pulse">
            <div className="w-55 h-85 bg-slate-200 rounded-xl shadow-md"></div>
            <div className="w-55 h-85 bg-slate-200 rounded-xl shadow-md"></div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return <div className="p-20 text-center text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">No hay datos para mostrar.</div>;
  }

  // Agrupar por padre para evitar carnets duplicados
  const grouped = data.reduce<Record<string, any>>((acc, row) => {
    const key = row.asociado_dni || row.asociado_nombre || `unknown-${row.id}`;
    if (!acc[key]) {
      acc[key] = { ...row, students: [] };
    }
    acc[key].students.push({
      estudiante: row.estudiante,
      grado: row.grado,
      seccion: row.seccion,
    });
    return acc;
  }, {});
  const groupedData = Object.values(grouped);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {groupedData.map((group: any) => (
        <CarnetCard key={group.id} parent={group} />
      ))}
    </div>
  );
}
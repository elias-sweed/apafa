import { Printer, CreditCard } from 'lucide-react';
import { useState } from 'react';
import CarnetPrint from './CarnetPrint';

export default function QRSynchronizedTab({ data, loading, pageOffset = 0 }: { data: any[], loading: boolean, pageOffset?: number }) {
  // Estado para saber si imprimimos en A4 o en PVC
  const [printMode, setPrintMode] = useState<'a4' | 'pvc'>('a4');

  const handlePrint = (mode: 'a4' | 'pvc') => {
    setPrintMode(mode);
    // Le damos a React 100 milisegundos para cambiar las clases CSS antes de abrir la ventana de impresión
    setTimeout(() => {
      window.print();
    }, 100);
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500 animate-pulse font-medium">Cargando carnets...</div>;
  }

  if (data.length === 0) {
    return <div className="p-20 text-center text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">No se encontraron resultados.</div>;
  }

  // Agrupar por padre (asociado_dni o asociado_nombre) para evitar carnets duplicados
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
    <div className="relative">
      
      {/* BOTONERA DE IMPRESIÓN */}
      <div className="flex justify-end gap-4 mb-8 print:hidden sticky top-4 z-50">
        <button
          onClick={() => handlePrint('a4')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center gap-3 transition-all transform hover:scale-105 border-2 border-blue-400"
        >
          <Printer size={24} />
          <span className="text-lg">Imprimir en A4</span>
        </button>
        
        <button
          onClick={() => handlePrint('pvc')}
          className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center gap-3 transition-all transform hover:scale-105 border-2 border-slate-600"
        >
          <CreditCard size={24} />
          <span className="text-lg">Imprimir en PVC</span>
        </button>
      </div>

      {/* CONTENEDOR DE TARJETAS */}
      <div className={`gap-4 ${printMode === 'a4' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 print:grid print:grid-cols-2 print:gap-2' : 'grid grid-cols-1 sm:grid-cols-2 print:block'}`}>
        {groupedData.map((group: any, index: number) => (
          <CarnetPrint key={group.id} parent={group} printMode={printMode} numero={pageOffset + index + 1} />
        ))}
      </div>

    </div>
  );
}
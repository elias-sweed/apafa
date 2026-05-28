import { QRCodeSVG } from 'qrcode.react';
import { AlertCircle } from 'lucide-react';

function toTitleCase(str: string) {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

export default function CarnetCard({ parent }: any) {
  const hasDNI = Boolean(parent.asociado_dni);
  const qrPayload = JSON.stringify({
    padre_id: parent.id ?? null,
    asociado_dni: parent.asociado_dni ?? '',
  });
  const children = parent.students || [];

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
      
      {/* LADO FRONTAL DEL CARNET */}
      <div className="w-64 h-96 bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden flex flex-col relative">
        <div className="bg-blue-800 w-full py-4 text-center">
          <h2 className="text-white font-bold text-sm">ASOCIACIÓN APAFA</h2>
          <p className="text-blue-200 text-[10px] font-medium tracking-widest">PERIODO 2026</p>
        </div>
        
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-16 h-16 bg-slate-100 rounded-full border-2 border-blue-100 flex items-center justify-center shrink-0">
              <span className="text-slate-400 text-xs">FOTO</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Apoderado Asociado</p>
              <p className="text-sm font-bold text-slate-800 leading-tight truncate uppercase">
                {parent.asociado_nombre ? toTitleCase(parent.asociado_nombre) : '---'}
              </p>
              <p className="text-xs text-blue-600 font-bold">DNI: {parent.asociado_dni || 'PENDIENTE'}</p>
            </div>
          </div>

          <div className="mb-3 border-t border-slate-100 pt-3">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Segundo Apoderado</p>
            <p className="text-sm font-bold text-slate-800 leading-tight truncate uppercase">
              {parent.segundo_responsable ? toTitleCase(parent.segundo_responsable) : '---'}
            </p>
          </div>

          {/* Hijo(s) */}
          <div className="flex-1 border-t border-slate-100 pt-3 min-h-0">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Hijo(s):</p>
            {children.length > 0 ? (
              <div className="space-y-1">
                {children.map((child: any, i: number) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-500 text-sm leading-tight mt-0.5 shrink-0">•</span>
                    <div className="text-xs font-bold text-slate-800 leading-tight uppercase flex-1 min-w-0">
                      <span className="truncate block">{child.estudiante || ''}</span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {child.grado || ''}{child.seccion ? ` "${child.seccion}"` : ''}{child.nivel ? ` - ${child.nivel}` : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Sin hijos registrados</p>
            )}
          </div>
        </div>
      </div>

      {/* LADO POSTERIOR (REVERSO CON QR) */}
      <div className="w-64 h-96 bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden flex flex-col items-center justify-center relative">
        <div className="absolute top-0 w-full h-8 bg-blue-800/10"></div>
        
        <div className="p-4 flex flex-col items-center">
          <p className="text-[10px] text-slate-500 font-bold text-center mb-4 uppercase px-4">
            Este carnet es personal e intransferible.
          </p>

          <div className={`p-2 rounded-xl border-2 shadow-sm w-40 h-40 flex items-center justify-center ${hasDNI ? 'bg-white border-slate-200' : 'bg-orange-50 border-orange-200'}`}>
            {hasDNI ? (
              <QRCodeSVG value={qrPayload} size={140} level="H" />
            ) : (
              <div className="text-center text-orange-600 flex flex-col items-center">
                <AlertCircle size={28} className="mb-2 opacity-50" />
                <span className="text-[10px] font-bold uppercase text-center leading-tight">Falta DNI</span>
              </div>
            )}
          </div>

          <p className="text-[10px] text-slate-400 mt-6 text-center px-4">
            Escanear al ingreso de la institución.
          </p>
        </div>
        
        <div className="absolute bottom-0 w-full h-8 bg-blue-800/10"></div>
      </div>

    </div>
  );
}

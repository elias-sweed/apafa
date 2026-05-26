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

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
      
      {/* LADO FRONTAL DEL CARNET */}
      <div className="w-55 h-85 bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden flex flex-col relative">
        <div className="bg-blue-800 w-full py-4 text-center">
          <h2 className="text-white font-bold text-sm">ASOCIACIÓN APAFA</h2>
          <p className="text-blue-200 text-[10px] font-medium tracking-widest">PERIODO 2026</p>
        </div>
        
        <div className="flex-1 p-4 flex flex-col justify-center items-center text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full border-2 border-blue-100 mb-4 flex items-center justify-center">
            <span className="text-slate-400 text-xs">FOTO</span>
          </div>
          
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nombre del Apoderado Asociado</p>
          <p className="text-xs font-bold text-slate-800 leading-tight line-clamp-2">
            {parent.asociado_nombre ? toTitleCase(parent.asociado_nombre) : '---'}
          </p>
          <p className="text-xs text-blue-600 font-bold mt-1">DNI: {parent.asociado_dni || 'PENDIENTE'}</p>

          <div className="mt-2 w-full border-t border-slate-100 pt-2">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nombre del Segundo Apoderado</p>
            <p className="text-xs font-bold text-slate-800 leading-tight line-clamp-2">
              {parent.segundo_responsable ? toTitleCase(parent.segundo_responsable) : ''}
            </p>
          </div>
        </div>
      </div>

      {/* LADO POSTERIOR (REVERSO CON QR) */}
      <div className="w-55 h-85 bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden flex flex-col items-center justify-center relative">
        <div className="absolute top-0 w-full h-8 bg-blue-800/10"></div>
        
        <div className="p-4 flex flex-col items-center">
          <p className="text-[10px] text-slate-500 font-bold text-center mb-4 uppercase px-4">
            Este carnet es personal e intransferible.
          </p>

          <div className={`p-2 rounded-xl border-2 shadow-sm w-35 h-35 flex items-center justify-center ${hasDNI ? 'bg-white border-slate-200' : 'bg-orange-50 border-orange-200'}`}>
            {hasDNI ? (
              <QRCodeSVG value={qrPayload} size={120} level="H" />
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
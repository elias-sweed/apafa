import { QRCodeSVG } from 'qrcode.react';
import { AlertCircle } from 'lucide-react';
import logoEscuela from '../../assets/logo.png';

function toTitleCase(str: string) {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

export default function CarnetPrint({ parent, printMode = 'a4' }: { parent: any, printMode?: 'a4' | 'pvc' }) {
  const hasDNI = Boolean(parent.asociado_dni);
  const qrPayload = JSON.stringify({
    padre_id: parent.id ?? null,
    asociado_dni: parent.asociado_dni ?? '',
    asociado_nombre: parent.asociado_nombre ?? '',
    segundo_responsable: parent.segundo_responsable ?? '',
  });

  return (
    <div className={`flex items-center justify-center p-2 print:p-1 ${printMode === 'a4' ? 'print:break-inside-avoid' : 'print:m-0'}`}>
      {/* TARJETA HORIZONTAL ÚNICA */}
      <div className="w-[86mm] h-[54mm] bg-white rounded-[3mm] border-[1.2mm] border-amber-400 overflow-hidden flex relative shadow-md box-border print:shadow-none">
        
        {/* LADO IZQUIERDO - INFORMACIÓN */}
        <div className="flex-1 p-[2.5mm] flex flex-col justify-between relative z-10">
          
          {/* Encabezado */}
          <div className="flex items-center gap-1.5">
            <img src={logoEscuela} alt="Logo" className="w-[8mm] h-[9mm] object-contain" />
            <div className="text-[1.8mm] leading-tight">
              <p className="font-black text-slate-900 uppercase">APAFA I.E</p>
              <p className="font-black text-slate-900 uppercase">"JIMENEZ PIMENTEL"</p>
              <p className="text-slate-600">Año 2026</p>
            </div>
          </div>

          {/* Nombre del Apoderado */}
          <div className="mt-1">
            <p className="text-[1.6mm] text-slate-500 font-bold uppercase tracking-wide">Apoderado</p>
            <p className="text-[2.5mm] font-bold text-slate-900 uppercase leading-tight break-words">
              {parent.asociado_nombre ? toTitleCase(parent.asociado_nombre) : ''}
            </p>
            <p className="text-[1.8mm] text-slate-600 font-medium">DNI: {parent.asociado_dni || '---'}</p>
          </div>

          {/* Segundo Apoderado */}
          {parent.segundo_responsable && (
            <div className="mt-0.5">
              <p className="text-[1.6mm] text-slate-500 font-bold uppercase tracking-wide">2do Apoderado</p>
              <p className="text-[2.2mm] font-bold text-slate-900 uppercase leading-tight break-words">
                {toTitleCase(parent.segundo_responsable)}
              </p>
            </div>
          )}
        </div>

        {/* LADO DERECHO - QR */}
        <div className="w-[30mm] flex flex-col items-center justify-center p-[2mm] border-l-[1.2mm] border-amber-400 relative z-10">
          <p className="text-[1.5mm] font-bold text-slate-700 uppercase text-center leading-tight mb-1">
            Control de Asistencia
          </p>
          <div className={`p-[1mm] border-[1mm] border-amber-400 flex items-center justify-center w-[24mm] h-[24mm] ${hasDNI ? 'bg-white' : 'bg-slate-50'}`}>
            {hasDNI ? (
              <QRCodeSVG value={qrPayload} size={80} level="H" />
            ) : (
              <div className="text-center text-orange-600 flex flex-col items-center">
                <AlertCircle size={16} className="mb-0.5 opacity-50" />
                <span className="text-[1.8mm] font-bold uppercase text-center leading-tight">Falta DNI</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

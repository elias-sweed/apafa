import { QRCodeSVG } from 'qrcode.react';
import { AlertCircle } from 'lucide-react';
import logoEscuela from '../../assets/logo.png';
import logoApafa from '../../assets/logo_apafa.png';

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
      <div className="w-[86mm] h-[54mm] bg-white rounded-[3mm] border-[1.2mm] border-amber-400 overflow-hidden flex relative shadow-md box-border print:shadow-none">

        {/* LADO IZQUIERDO - INFORMACIÓN */}
        <div className="flex-1 p-[2.5mm] flex flex-col relative z-10">

          {/* Encabezado */}
          <div className="flex items-start justify-between">
            <img src={logoEscuela} alt="Logo I.E." className="w-[8mm] h-[9mm] object-contain" />
            <div className="text-center flex-1">
              <p className="text-[2mm] text-slate-800 font-bold uppercase leading-tight">AÑO 2026</p>
              <p className="text-[2.5mm] font-black text-slate-900 leading-tight">APAFA I.E</p>
              <p className="text-[2.5mm] font-black text-slate-900 leading-tight">"JIMENEZ PIMENTEL"</p>
            </div>
          </div>

          {/* Marca de agua */}
          <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none opacity-[0.1]">
            <img src={logoApafa} alt="" className="w-[30mm] h-[30mm] object-contain" />
          </div>

          {/* Datos */}
          <div className="flex flex-col gap-[1.5mm] z-10 relative mt-[2mm]">
            <div>
              <p className="text-[1.8mm] text-slate-900 font-medium leading-tight">Nombre del Apoderado Asociado:</p>
              <div className="border-b border-slate-800 text-[2mm] font-bold text-slate-800 leading-tight truncate uppercase">
                {parent.asociado_nombre ? toTitleCase(parent.asociado_nombre) : ''}
              </div>
            </div>

            <div className="flex gap-[1.5mm]">
              <div className="flex-1">
                <p className="text-[1.8mm] text-slate-900 font-medium leading-tight">D.N.I.:</p>
                <div className="border-b border-slate-800 h-[3.5mm]"></div>
              </div>
              <div className="flex-[1.5]">
                <p className="text-[1.8mm] text-slate-900 font-medium leading-tight">Número de Teléfono:</p>
                <div className="border-b border-slate-800 h-[3.5mm]"></div>
              </div>
            </div>

            <div>
              <p className="text-[1.8mm] text-slate-900 font-medium leading-tight">Nombre del Segundo Apoderado:</p>
              <div className="border-b border-slate-800 text-[2mm] font-bold text-slate-800 leading-tight truncate uppercase">
                {parent.segundo_responsable ? toTitleCase(parent.segundo_responsable) : ''}
              </div>
            </div>

            <div className="flex gap-[1.5mm]">
              <div className="flex-1">
                <p className="text-[1.8mm] text-slate-900 font-medium leading-tight">D.N.I.:</p>
                <div className="border-b border-slate-800 h-[3.5mm]"></div>
              </div>
              <div className="flex-[1.5]">
                <p className="text-[1.8mm] text-slate-900 font-medium leading-tight">Número de Teléfono:</p>
                <div className="border-b border-slate-800 h-[3.5mm]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* LADO DERECHO - QR */}
        <div className="w-[28mm] flex flex-col items-center justify-center p-[2mm] border-l-[1.2mm] border-amber-400 relative z-10">
          <p className="text-[1.8mm] font-black text-slate-900 text-center uppercase leading-tight mb-[3mm]">
            CONTROL DE ASISTENCIA
          </p>
          <div className={`p-[1mm] border-[1mm] border-amber-400 flex items-center justify-center w-[22mm] h-[22mm] ${hasDNI ? 'bg-white' : 'bg-slate-50'}`}>
            {hasDNI ? (
              <QRCodeSVG value={qrPayload} size={72} level="H" />
            ) : (
              <div className="text-center text-orange-600 flex flex-col items-center">
                <AlertCircle size={16} className="mb-0.5 opacity-50" />
                <span className="text-[2mm] font-bold uppercase text-center leading-tight">Falta DNI</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

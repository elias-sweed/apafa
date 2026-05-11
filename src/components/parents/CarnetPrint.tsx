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
    // A4: Se mantienen juntos con un gap pequeño. PVC: Se bloquean para ir uno debajo del otro.
    <div className={`items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200 print:bg-transparent print:border-none ${printMode === 'a4' ? 'flex gap-[2mm] print:p-2 print:break-inside-avoid' : 'flex gap-4 print:block print:p-0'}`}>
      
      {/* ANVERSO (FRENTE) */}
      <div className={`w-[54mm] h-[86mm] bg-white rounded-[4mm] border-[1.5mm] border-amber-400 overflow-hidden flex flex-col relative p-[3mm] shrink-0 shadow-md box-border print:shadow-none ${printMode === 'pvc' ? 'print:m-0 print:break-after-page' : ''}`}>
        
        {/* Encabezado */}
        <div className="flex items-start justify-between z-10 relative">
          <img src={logoEscuela} alt="Logo I.E." className="w-[12mm] h-[14mm] object-contain" />
          <div className="text-center flex-1 pt-1">
            <p className="text-[2.5mm] text-slate-800 font-bold uppercase leading-tight tracking-tight">AÑO 2026</p>
            <p className="text-[3.2mm] font-black text-slate-900 leading-tight mt-px">APAFA I.E</p>
            <p className="text-[3.2mm] font-black text-slate-900 leading-tight">"JIMENEZ PIMENTEL"</p>
            <p className="text-[2.2mm] text-slate-700 leading-tight mt-px">Tarapoto - San Martin</p>
          </div>
        </div>

        {/* Marca de agua centrada */}
        <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none opacity-[0.12] mt-4">
          <img src={logoApafa} alt="Marca de Agua" className="w-[38mm] h-[38mm] object-contain" />
        </div>

        {/* Cajas de texto */}
        <div className="flex flex-col gap-[3mm] z-10 relative mt-[4mm]">
          <div>
            <p className="text-[2.5mm] text-slate-900 font-medium leading-tight">Nombre del Apoderado Asociado:</p>
            <div className="border-b border-slate-800 h-[5mm] text-[2.2mm] font-bold text-slate-800 flex items-end pb-px truncate">
              {parent.asociado_nombre ? toTitleCase(parent.asociado_nombre) : ''}
            </div>
          </div>

          <div className="flex gap-[2mm]">
            <div className="flex-[0.8]">
              <p className="text-[2.5mm] text-slate-900 font-medium leading-tight">D.N.I.:</p>
              <div className="border-b border-slate-800 h-[5mm]"></div>
            </div>
            <div className="flex-[1.2]">
              <p className="text-[2.5mm] text-slate-900 font-medium leading-tight">Número de Teléfono:</p>
              <div className="border-b border-slate-800 h-[5mm]"></div>
            </div>
          </div>

          <div className="mt-[2mm]">
            <p className="text-[2.5mm] text-slate-900 font-medium leading-tight">Nombre del Segundo Apoderado:</p>
            <div className="border-b border-slate-800 h-[5mm] text-[2.2mm] font-bold text-slate-800 flex items-end pb-px truncate">
              {parent.segundo_responsable ? toTitleCase(parent.segundo_responsable) : ''}
            </div>
          </div>

          <div className="flex gap-[2mm]">
            <div className="flex-[0.8]">
              <p className="text-[2.5mm] text-slate-900 font-medium leading-tight">D.N.I.:</p>
              <div className="border-b border-slate-800 h-[5mm]"></div>
            </div>
            <div className="flex-[1.2]">
              <p className="text-[2.5mm] text-slate-900 font-medium leading-tight">Número de Teléfono:</p>
              <div className="border-b border-slate-800 h-[5mm]"></div>
            </div>
          </div>

        </div>
      </div>

      {/* REVERSO (ESPALDA) */}
      <div className={`w-[54mm] h-[86mm] bg-white rounded-[4mm] border-[1.5mm] border-amber-400 overflow-hidden flex flex-col items-center justify-center p-[4mm] shrink-0 relative shadow-md box-border print:shadow-none ${printMode === 'pvc' ? 'print:m-0 print:break-after-page' : ''}`}>
        <p className="text-[3.5mm] font-black text-slate-900 text-center uppercase leading-tight mb-[8mm] tracking-wide">
          CONTROL DE ASISTENCIA<br/>PARA ASAMBLEAS
        </p>

        <div className={`p-[2mm] border-[1.5mm] border-amber-400 flex items-center justify-center w-[36mm] h-[36mm] ${hasDNI ? 'bg-white' : 'bg-slate-50'}`}>
          {hasDNI ? (
            <QRCodeSVG value={qrPayload} size={110} level="H" />
          ) : (
            <div className="text-center text-orange-600 flex flex-col items-center">
              <AlertCircle size={24} className="mb-1 opacity-50" />
              <span className="text-[2.5mm] font-bold uppercase text-center leading-tight">Falta DNI<br/>para QR</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
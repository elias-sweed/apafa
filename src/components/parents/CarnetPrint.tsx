import { QRCodeSVG } from 'qrcode.react';
import { AlertCircle } from 'lucide-react';
import logoEscuela from '../../assets/logo.png';
import logoApafa from '../../assets/logo_apafa.png';

function toTitleCase(str: string) {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

export default function CarnetPrint({ parent, printMode = 'a4', numero }: { parent: any, printMode?: 'a4' | 'pvc', numero?: number }) {
  const hasDNI = Boolean(parent.asociado_dni);
  const qrPayload = JSON.stringify({
    padre_id: parent.id ?? null,
    asociado_dni: parent.asociado_dni ?? '',
  });
  const children = parent.students || [];

  return (
    <div className={`flex items-center justify-center p-2 print:p-0.5 ${printMode === 'a4' ? 'print:break-inside-avoid' : 'print:m-0'}`}>
      <div className="w-[90mm] h-[68mm] bg-white rounded-[3mm] border-[1.2mm] border-amber-400 overflow-hidden flex relative shadow-md box-border print:shadow-none">

        {/* LADO IZQUIERDO - INFORMACIÓN */}
        <div className="flex-1 p-[3mm] flex flex-col relative z-10">

          {/* Número de carnet - AMARILLO INTENSO */}
          {numero !== undefined && (
            <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[2.8mm] font-black px-[2.5mm] py-[0.8mm] shadow-sm z-20">
              N° {String(numero).padStart(4, '0')}
            </div>
          )}

          {/* Encabezado */}
          <div className="flex items-start justify-between mb-[1.5mm]">
            <img src={logoEscuela} alt="Logo I.E." className="w-[9mm] h-[10mm] object-contain" />
            <div className="text-center flex-1">
              <p className="text-[2.5mm] text-slate-800 font-bold uppercase leading-tight">AÑO 2026</p>
              <p className="text-[3mm] font-black text-slate-900 leading-tight">APAFA I.E</p>
              <p className="text-[3mm] font-black text-slate-900 leading-tight">&quot;JIMENEZ PIMENTEL&quot;</p>
            </div>
          </div>

          {/* Marca de agua */}
          <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none opacity-[0.1]">
            <img src={logoApafa} alt="" className="w-[35mm] h-[35mm] object-contain" />
          </div>

          {/* Datos del apoderado */}
          <div className="flex flex-col gap-[1.5mm] z-10 relative flex-1">
            <div>
              <p className="text-[2mm] text-slate-900 font-medium leading-tight">Apoderado Asociado:</p>
              <div className="border-b border-slate-800 text-[2.5mm] font-bold text-slate-800 leading-tight truncate uppercase">
                {parent.asociado_nombre ? toTitleCase(parent.asociado_nombre) : ''}
              </div>
            </div>

            <div className="flex gap-[1.5mm]">
              <div className="flex-1">
                <p className="text-[2mm] text-slate-900 font-medium leading-tight">D.N.I.:</p>
                <div className="border-b border-slate-800 text-[2.5mm] font-bold text-slate-800">
                  {parent.asociado_dni || ''}
                </div>
              </div>
              <div className="flex-[1.5]">
                <p className="text-[2mm] text-slate-900 font-medium leading-tight">Teléfono:</p>
                <div className="border-b border-slate-800 text-[2.5mm] font-bold text-slate-800">
                  {parent.telefono || ''}
                </div>
              </div>
            </div>

            <div>
              <p className="text-[2mm] text-slate-900 font-medium leading-tight">Segundo Apoderado:</p>
              <div className="border-b border-slate-800 text-[2.5mm] font-bold text-slate-800 leading-tight truncate uppercase">
                {parent.segundo_responsable ? toTitleCase(parent.segundo_responsable) : ''}
              </div>
            </div>

            <div className="flex gap-[1.5mm]">
              <div className="flex-1">
                <p className="text-[2mm] text-slate-900 font-medium leading-tight">D.N.I.:</p>
                <div className="border-b border-slate-800 text-[2.5mm] font-bold text-slate-800">
                  {parent.segundo_dni || ''}
                </div>
              </div>
              <div className="flex-[1.5]">
                <p className="text-[2mm] text-slate-900 font-medium leading-tight">Teléfono:</p>
                <div className="border-b border-slate-800 h-[3.5mm]"></div>
              </div>
            </div>

            {/* Hijo(s) */}
            <div className="flex-1 min-h-0">
              <p className="text-[2mm] text-slate-900 font-medium leading-tight">Hijo(s):</p>
              {children.length > 0 ? (
                <div className="mt-[0.5mm] space-y-[0.3mm]">
                  {children.map((child: any, i: number) => (
                    <div key={i} className="flex items-start gap-[0.8mm]">
                      <span className="text-amber-600 text-[2.5mm] leading-tight mt-[-0.3mm]">•</span>
                      <span className="text-[2.2mm] font-bold text-slate-800 leading-tight uppercase flex-1 truncate">
                        {child.estudiante || ''}{child.grado ? ` - ${child.grado}` : ''}{child.seccion ? ` "${child.seccion}"` : ''}{child.nivel ? ` - ${child.nivel}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* LADO DERECHO - QR */}
        <div className="w-[28mm] flex flex-col items-center justify-center p-[2.5mm] border-l-[1.2mm] border-amber-400 relative z-10">
          <p className="text-[2.2mm] font-black text-slate-900 text-center uppercase leading-tight mb-[3mm]">
            CONTROL DE <br />ASISTENCIA
          </p>
          <div className={`p-[1mm] border-[1mm] border-amber-400 flex items-center justify-center w-[22mm] h-[22mm] ${hasDNI ? 'bg-white' : 'bg-slate-50'}`}>
            {hasDNI ? (
              <QRCodeSVG value={qrPayload} size={76} level="H" />
            ) : (
              <div className="text-center text-orange-600 flex flex-col items-center">
                <AlertCircle size={18} className="mb-0.5 opacity-50" />
                <span className="text-[2.5mm] font-bold uppercase text-center leading-tight">Falta DNI</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

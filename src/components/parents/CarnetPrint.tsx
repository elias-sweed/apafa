import { QRCodeSVG } from 'qrcode.react';
import { AlertCircle } from 'lucide-react';
import logoEscuela from '../../assets/logo.png';
import logoApafa from '../../assets/logo_apafa.png';

function toTitleCase(str: string) {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function formatStudentName(fullName: string) {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length > 2) {
    // Asumimos que los 2 primeros son los apellidos y el resto nombres
    const lastNames = parts.slice(0, 2).join(' ');
    const firstNames = parts.slice(2).join(' ');
    return `${firstNames} ${lastNames}`;
  }
  return fullName;
}

function Field({ label, value, className = '', valueClassName = '' }: { label: string; value?: string | null, className?: string, valueClassName?: string }) {
  return (
    <div className={`flex flex-col ${className}`}>
      <span className="text-[1.6mm] text-slate-600 font-bold uppercase tracking-wider">{label}</span>
      <div className="border-b-[1px] border-slate-500 flex items-end pb-[0.3mm] h-[3.8mm]">
        <span className={`font-bold text-slate-900 leading-none uppercase truncate w-full ${valueClassName || 'text-[2.2mm]'}`}>
          {value || ''}
        </span>
      </div>
    </div>
  );
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
      <div className="carnet-amber-border w-[92mm] h-[68mm] bg-white rounded-[3mm] border-[1.2mm] border-amber-400 overflow-hidden flex relative shadow-md box-border print:shadow-none">

        {/* LADO IZQUIERDO - INFORMACIÓN */}
        <div className="flex-1 p-[2mm] flex flex-col relative z-10 min-w-0">

          {/* Número de carnet - AMARILLO INTENSO */}
          {numero !== undefined && (
            <div
              className="carnet-numero-badge absolute top-0 right-0 bg-amber-400 text-black text-[2.5mm] font-black px-[2.5mm] py-[0.8mm] z-20 rounded-bl-[2mm] border-0"
              style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
            >
              N° {String(numero).padStart(4, '0')}
            </div>
          )}

          {/* Encabezado */}
          <div className="flex items-start justify-between mb-[1mm]">
            <img src={logoEscuela} alt="Logo I.E." className="w-[9mm] h-[10mm] object-contain" />
            <div className="text-center flex-1 px-[2mm]">
              <p className="text-[2mm] text-slate-800 font-bold uppercase leading-tight">AÑO 2026</p>
              <p className="text-[2.6mm] font-black text-slate-900 leading-tight">APAFA I.E</p>
              <p className="text-[2.6mm] font-black text-slate-900 leading-tight">&quot;JIMENEZ PIMENTEL&quot;</p>
            </div>
          </div>

          {/* Marca de agua */}
          <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none opacity-[0.08]">
            <img src={logoApafa} alt="" className="w-[45mm] h-[45mm] object-contain" />
          </div>

          {/* Datos del apoderado */}
          <div className="flex flex-col gap-[1mm] z-10 relative flex-1">

            <Field
              label="Apoderado"
              value={parent.asociado_nombre ? toTitleCase(parent.asociado_nombre) : ''}
            />

            <div className="flex gap-[2mm]">
              <Field label="D.N.I." value={parent.asociado_dni} className="w-[16mm] shrink-0" />
              <Field label="Teléfono" value={parent.telefono} className="flex-1 min-w-0" valueClassName="text-[1.8mm]" />
            </div>

            <Field
              label="Segundo Apoderado"
              value={parent.segundo_responsable ? toTitleCase(parent.segundo_responsable) : ''}
            />

            <Field label="D.N.I." value={parent.segundo_dni} className="w-[16mm] shrink-0" />

            {/* Hijo(s) */}
            <div className="flex-1 min-h-0 mt-[0.5mm] flex flex-col">
              <div className="flex items-end mb-[0.5mm] gap-[1mm]">
                <span className="text-[1.6mm] text-slate-600 font-bold uppercase tracking-wider flex-1">Hijo(s)</span>
                <span className="text-[1.3mm] text-slate-500 font-bold uppercase w-[11mm] text-center leading-none pb-[0.2mm]">Grado</span>
                <span className="text-[1.3mm] text-slate-500 font-bold uppercase w-[6mm] text-center leading-none pb-[0.2mm]">Secc</span>
                <span className="text-[1.3mm] text-slate-500 font-bold uppercase w-[12mm] text-center leading-none pb-[0.2mm]">Nivel</span>
              </div>
              <div className="flex-1 flex flex-col gap-[0.5mm] overflow-hidden">
                {children.length > 0 ? (
                  children.map((child: any, i: number) => (
                    <div key={i} className="flex items-end gap-[1mm]">
                      <div className="flex-1 border-b-[0.8px] border-slate-500 flex items-end h-[3.2mm] pb-[0.2mm] min-w-0">
                        <span className="text-[1.8mm] font-bold text-slate-800 leading-none uppercase truncate w-full">
                          {formatStudentName(child.estudiante) || ''}
                        </span>
                      </div>
                      <div className="w-[11mm] border-b-[0.8px] border-slate-500 flex items-end h-[3.2mm] pb-[0.2mm]">
                        <span className="text-[1.8mm] font-bold text-slate-800 leading-none uppercase truncate text-center w-full">
                          {child.grado || ''}
                        </span>
                      </div>
                      <div className="w-[6mm] border-b-[0.8px] border-slate-500 flex items-end h-[3.2mm] pb-[0.2mm]">
                        <span className="text-[1.8mm] font-bold text-slate-800 leading-none uppercase truncate text-center w-full">
                          {child.seccion || ''}
                        </span>
                      </div>
                      <div className="w-[12mm] border-b-[0.8px] border-slate-500 flex items-end h-[3.2mm] pb-[0.2mm]">
                        <span className="text-[1.8mm] font-bold text-slate-800 leading-none uppercase truncate text-center w-full">
                          {child.nivel || ''}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  [1, 2].map((_, i) => (
                    <div key={i} className="flex items-end gap-[1mm]">
                      <div className="flex-1 border-b-[0.8px] border-dashed border-slate-400 h-[3.2mm]"></div>
                      <div className="w-[11mm] border-b-[0.8px] border-dashed border-slate-400 h-[3.2mm]"></div>
                      <div className="w-[6mm] border-b-[0.8px] border-dashed border-slate-400 h-[3.2mm]"></div>
                      <div className="w-[12mm] border-b-[0.8px] border-dashed border-slate-400 h-[3.2mm]"></div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* LADO DERECHO - QR */}
        <div className="carnet-amber-border w-[30mm] shrink-0 flex flex-col items-center justify-center p-[2.5mm] border-l-[1.2mm] border-amber-400 relative z-10 bg-amber-50/50">
          <div className="text-center w-full mb-[2mm]">
            <p className="text-[2.2mm] font-black text-slate-800 uppercase leading-tight">CONTROL DE</p>
            <p className="text-[2.2mm] font-black text-slate-800 uppercase leading-tight">ASISTENCIA</p>
            <div className="w-full border-b-[1px] border-slate-400 mt-[1mm]"></div>
          </div>
          
          <div className="carnet-qr-frame p-[1.5mm] border-[1mm] border-amber-500 rounded-[2mm] flex items-center justify-center bg-white shadow-sm print:shadow-none">
            {hasDNI ? (
              <QRCodeSVG value={qrPayload} size={85} level="H" className="w-[22mm] h-[22mm]" />
            ) : (
              <div className="text-center text-orange-600 flex flex-col items-center justify-center w-[22mm] h-[22mm]">
                <AlertCircle size={18} className="mb-1 opacity-60" />
                <span className="text-[2mm] font-bold uppercase text-center leading-tight">Falta<br/>DNI</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

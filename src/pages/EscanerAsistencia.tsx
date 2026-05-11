import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle2, QrCode, AlertTriangle, Info } from 'lucide-react';
import { asistenciaService } from '../services/asistenciaService';

export default function EscanerAsistencia() {
  const [resultado, setResultado] = useState<any>(null);
  const [escaneando, setEscaneando] = useState(true);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("lector-qr");
    html5QrCodeRef.current = html5QrCode;
    
    const iniciarCamara = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            if (!escaneando) return;
            setEscaneando(false);
            html5QrCode.pause();

            const res = await asistenciaService.registrarAsistencia(decodedText);

            if (res.error === 'DUPLICADO') {
              setResultado({ estado: 'duplicado', mensaje: 'Esta persona ya registró su asistencia hoy.' });
            } else if (res.error) {
              setResultado({ estado: 'error', mensaje: res.error });
            } else {
              const hijos = res.data?.hijos || [];
              const grados = [...new Set(hijos.map((h: any) => `${h.grado} "${h.seccion}" - ${h.nivel}`))].join(' | ');
              setResultado({ 
                estado: 'exito', 
                padre: res.data,
                grados,
                hora: new Date().toLocaleTimeString()
              });
            }

            setTimeout(() => {
              setResultado(null);
              setEscaneando(true);
              html5QrCode.resume();
            }, 3000);
          },
          () => {}
        );
      } catch (err) {
        console.error("Error al iniciar cámara:", err);
      }
    };

    iniciarCamara();

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [escaneando]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center p-4">
      
      {/* HEADER */}
      <div className="w-full text-center pt-8 pb-4">
        <h1 className="text-white text-xl font-bold flex items-center justify-center gap-2">
          <QrCode className="text-blue-400" />
          Escáner de Asistencia
        </h1>
      </div>

      {/* CÁMARA */}
      <div className="relative w-full max-w-sm aspect-square bg-black rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl">
        <div id="lector-qr" className="w-full h-full"></div>
        <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg z-10"></div>
        <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg z-10"></div>
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg z-10"></div>
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg z-10"></div>
      </div>

      {/* RESULTADO */}
      <div className="w-full max-w-sm mt-8">
        {!resultado && (
          <div className="text-center text-slate-400 animate-pulse">
            <p>Apunte la cámara hacia el código QR</p>
          </div>
        )}

        {resultado?.estado === 'exito' && (
          <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-5 shadow-lg animate-fade-in text-center">
            <CheckCircle2 className="text-green-600 mx-auto mb-2" size={48} />
            <h2 className="text-green-800 font-black text-2xl uppercase tracking-wide">Asistió</h2>
            <p className="text-green-600 text-sm font-medium mb-3">{resultado.hora}</p>
            <div className="bg-white rounded-xl p-3 space-y-1 border border-green-200">
              <p className="text-sm font-bold text-slate-800 uppercase">{resultado.padre?.asociado_nombre}</p>
              {resultado.grados && (
                <p className="text-xs font-bold text-blue-700">{resultado.grados}</p>
              )}
            </div>
          </div>
        )}

        {resultado?.estado === 'duplicado' && (
          <div className="bg-yellow-50 border-2 border-yellow-500 rounded-2xl p-4 shadow-lg animate-fade-in flex items-center gap-4">
            <Info className="text-yellow-600 shrink-0" size={36} />
            <div>
              <h2 className="text-yellow-800 font-bold">Ya registrado</h2>
              <p className="text-yellow-700 text-sm">{resultado.mensaje}</p>
            </div>
          </div>
        )}

        {resultado?.estado === 'error' && (
          <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-4 shadow-lg animate-fade-in flex items-center gap-4">
            <AlertTriangle className="text-red-600 shrink-0" size={36} />
            <div>
              <h2 className="text-red-800 font-bold">Error de lectura</h2>
              <p className="text-red-700 text-sm">{resultado.mensaje}</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
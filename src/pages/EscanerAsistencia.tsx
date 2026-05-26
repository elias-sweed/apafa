import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle2, QrCode, AlertTriangle, Info } from 'lucide-react';
import { asistenciaService } from '../services/asistenciaService';

export default function EscanerAsistencia() {
  const [resultado, setResultado] = useState<any>(null);
  const [escaneando, setEscaneando] = useState(true);
  const [eventos, setEventos] = useState<any[]>([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<number | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const cargarEventos = async () => {
    const res = await asistenciaService.obtenerEventos();
    if (res.data && res.data.length > 0) {
      setEventos(res.data);
      if (!eventoSeleccionado) setEventoSeleccionado(res.data[0].id);
    }
  };

  useEffect(() => { cargarEventos(); }, []);

  useEffect(() => {
    if (!eventoSeleccionado) return;
    const html5QrCode = new Html5Qrcode("lector-qr");
    html5QrCodeRef.current = html5QrCode;
    
    const iniciarCamara = async () => {
      try {
        const qrboxSize = Math.min(window.innerWidth, window.innerHeight) * 0.6;
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: qrboxSize, height: qrboxSize } },
          async (decodedText) => {
            if (!escaneando) return;
            setEscaneando(false);
            html5QrCode.pause();

            const res = await asistenciaService.registrarAsistencia(decodedText, eventoSeleccionado);

            if (res.error === 'DUPLICADO') {
              setResultado({ estado: 'duplicado', mensaje: 'Ya se registró su asistencia anteriormente.' });
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
  }, [escaneando, eventoSeleccionado]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center p-3 sm:p-4">
      
      {/* HEADER */}
      <div className="w-full text-center pt-4 sm:pt-8 pb-2 sm:pb-4">
        <h1 className="text-white text-lg sm:text-xl font-bold flex items-center justify-center gap-2">
          <QrCode className="text-blue-400" />
          Escáner de Asistencia
        </h1>
      </div>

      {/* SELECTOR DE EVENTO */}
      <div className="w-full max-w-sm mb-3 sm:mb-4">
        <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">Evento</label>
        <select
          value={eventoSeleccionado || ''}
          onChange={e => setEventoSeleccionado(Number(e.target.value))}
          className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 text-sm font-medium border border-slate-700 focus:outline-none focus:border-blue-500"
        >
          {eventos.length === 0 && <option value="">Sin eventos disponibles</option>}
          {eventos.map(ev => (
            <option key={ev.id} value={ev.id}>
              {ev.fecha?.slice(0, 10)} - {ev.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* CÁMARA */}
      {eventoSeleccionado && (
        <div className="relative w-full max-w-md aspect-square bg-black rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl mx-auto">
          <div id="lector-qr" className="w-full h-full"></div>
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 w-6 h-6 sm:w-8 sm:h-8 border-t-[3px] sm:border-t-4 border-l-[3px] sm:border-l-4 border-blue-500 rounded-tl-lg z-10"></div>
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 border-t-[3px] sm:border-t-4 border-r-[3px] sm:border-r-4 border-blue-500 rounded-tr-lg z-10"></div>
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 w-6 h-6 sm:w-8 sm:h-8 border-b-[3px] sm:border-b-4 border-l-[3px] sm:border-l-4 border-blue-500 rounded-bl-lg z-10"></div>
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 border-b-[3px] sm:border-b-4 border-r-[3px] sm:border-r-4 border-blue-500 rounded-br-lg z-10"></div>
        </div>
      )}

      {/* RESULTADO */}
      <div className="w-full max-w-sm mt-4 sm:mt-8">
        {!resultado && eventoSeleccionado && (
          <div className="text-center text-slate-400 animate-pulse text-sm sm:text-base">
            <p>Apunte la cámara hacia el código QR</p>
          </div>
        )}

        {!eventoSeleccionado && (
          <div className="text-center text-slate-500 text-sm sm:text-base">
            <p>Selecciona o crea un evento para empezar</p>
          </div>
        )}

        {resultado?.estado === 'exito' && (
          <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-4 sm:p-5 shadow-lg animate-fade-in text-center mx-2 sm:mx-0">
            <CheckCircle2 className="text-green-600 mx-auto mb-2" size={40} />
            <h2 className="text-green-800 font-black text-xl sm:text-2xl uppercase tracking-wide">Asistió</h2>
            <p className="text-green-600 text-xs sm:text-sm font-medium mb-3">{resultado.hora}</p>
            <div className="bg-white rounded-xl p-3 space-y-1 border border-green-200">
              <p className="text-xs sm:text-sm font-bold text-slate-800 uppercase">{resultado.padre?.asociado_nombre}</p>
              {resultado.grados && (
                <p className="text-xs font-bold text-blue-700">{resultado.grados}</p>
              )}
            </div>
          </div>
        )}

        {resultado?.estado === 'duplicado' && (
          <div className="bg-yellow-50 border-2 border-yellow-500 rounded-2xl p-4 sm:p-5 shadow-lg animate-fade-in text-center mx-2 sm:mx-0">
            <Info className="text-yellow-600 mx-auto mb-2" size={36} />
            <h2 className="text-yellow-800 font-black text-lg sm:text-xl uppercase">Ya escaneado</h2>
            <p className="text-yellow-700 text-sm font-medium">{resultado.mensaje}</p>
          </div>
        )}

        {resultado?.estado === 'error' && (
          <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-4 shadow-lg animate-fade-in flex items-center gap-4 mx-2 sm:mx-0">
            <AlertTriangle className="text-red-600 shrink-0" size={28} />
            <div>
              <h2 className="text-red-800 font-bold text-sm sm:text-base">Error de lectura</h2>
              <p className="text-red-700 text-xs sm:text-sm">{resultado.mensaje}</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

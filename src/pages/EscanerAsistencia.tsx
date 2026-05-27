import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode } from 'lucide-react';
import { asistenciaService } from '../services/asistenciaService';

export default function EscanerAsistencia() {
  const [resultado, setResultado] = useState<any>(null);
  const [escaneando, setEscaneando] = useState(true);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<number | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const { data: eventos } = useQuery({
    queryKey: ['eventos'],
    queryFn: async () => {
      const res = await asistenciaService.obtenerEventos();
      if (res.error) throw new Error(res.error);
      return res.data || [];
    },
  });

  useEffect(() => {
    if (eventos && eventos.length > 0 && !eventoSeleccionado) {
      setEventoSeleccionado(eventos[0].id);
    }
  }, [eventos, eventoSeleccionado]);

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
      try { html5QrCode.stop().catch(() => {}); } catch {}
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
          {eventos && eventos.length === 0 && <option value="">Sin eventos disponibles</option>}
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

      {/* PANTALLA COMPLETA DE RESULTADO */}
      {resultado && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center animate-fade-in"
          style={resultado.estado === 'exito' ? { backgroundColor: 'rgba(22, 163, 74, 0.95)' } :
                 resultado.estado === 'duplicado' ? { backgroundColor: 'rgba(234, 179, 8, 0.95)' } :
                 { backgroundColor: 'rgba(220, 38, 38, 0.95)' }}
        >
          {resultado.estado === 'exito' && (
            <>
              <svg className="text-white mb-6" width={80} height={80} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <h1 className="text-white font-black text-6xl sm:text-7xl uppercase tracking-widest mb-6">Asistió</h1>
              <p className="text-white/80 text-lg sm:text-xl font-medium mb-4">{resultado.hora}</p>
              <div className="bg-white/20 backdrop-blur rounded-2xl px-8 py-5 text-center max-w-sm w-full mx-4">
                <p className="text-white font-bold text-xl sm:text-2xl uppercase">{resultado.padre?.asociado_nombre}</p>
                {resultado.grados && (
                  <p className="text-white/80 font-semibold text-base mt-2">{resultado.grados}</p>
                )}
              </div>
            </>
          )}

          {resultado.estado === 'duplicado' && (
            <>
              <svg className="text-white mb-6" width={80} height={80} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <h1 className="text-white font-black text-5xl sm:text-6xl uppercase tracking-widest mb-4">Ya escaneado</h1>
              <p className="text-white/80 text-lg sm:text-xl font-medium">{resultado.mensaje}</p>
            </>
          )}

          {resultado.estado === 'error' && (
            <>
              <svg className="text-white mb-6" width={80} height={80} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <h1 className="text-white font-black text-4xl sm:text-5xl uppercase tracking-widest mb-4">Error</h1>
              <p className="text-white/80 text-lg font-medium">{resultado.mensaje}</p>
            </>
          )}
        </div>
      )}

    </div>
  );
}

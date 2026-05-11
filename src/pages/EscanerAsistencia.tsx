import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle2, QrCode, AlertTriangle, Info, Plus, Calendar } from 'lucide-react';
import { asistenciaService } from '../services/asistenciaService';

export default function EscanerAsistencia() {
  const [resultado, setResultado] = useState<any>(null);
  const [escaneando, setEscaneando] = useState(true);
  const [eventos, setEventos] = useState<any[]>([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<number | null>(null);
  const [showCrear, setShowCrear] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState(new Date().toISOString().slice(0, 10));
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const cargarEventos = async () => {
    const res = await asistenciaService.obtenerEventos();
    if (res.data && res.data.length > 0) {
      setEventos(res.data);
      if (!eventoSeleccionado) setEventoSeleccionado(res.data[0].id);
    }
  };

  useEffect(() => { cargarEventos(); }, []);

  const crearEvento = async () => {
    if (!nuevoNombre.trim()) return;
    const res = await asistenciaService.crearEvento(nuevoNombre.trim(), nuevaFecha);
    if (res.data) {
      setEventos(prev => [res.data, ...prev]);
      setEventoSeleccionado(res.data.id);
      setShowCrear(false);
      setNuevoNombre('');
    }
  };

  const eventoActual = eventos.find(e => e.id === eventoSeleccionado);

  useEffect(() => {
    if (!eventoSeleccionado) return;
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
    <div className="min-h-screen bg-slate-900 flex flex-col items-center p-4">
      
      {/* HEADER */}
      <div className="w-full text-center pt-8 pb-4">
        <h1 className="text-white text-xl font-bold flex items-center justify-center gap-2">
          <QrCode className="text-blue-400" />
          Escáner de Asistencia
        </h1>
      </div>

      {/* SELECTOR DE EVENTO */}
      <div className="w-full max-w-sm mb-4">
        <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">Evento / Reunión</label>
        <div className="flex gap-2">
          <select
            value={eventoSeleccionado || ''}
            onChange={e => setEventoSeleccionado(Number(e.target.value))}
            className="flex-1 bg-slate-800 text-white rounded-xl px-4 py-3 text-sm font-medium border border-slate-700 focus:outline-none focus:border-blue-500"
          >
            {eventos.length === 0 && <option value="">Sin eventos</option>}
            {eventos.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.fecha?.slice(0, 10)} - {ev.nombre}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowCrear(!showCrear)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        {showCrear && (
          <div className="mt-2 bg-slate-800 rounded-xl p-3 border border-slate-700 space-y-2">
            <input
              value={nuevoNombre}
              onChange={e => setNuevoNombre(e.target.value)}
              placeholder="Nombre del evento"
              className="w-full bg-slate-900 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:outline-none focus:border-blue-500"
            />
            <input
              type="date"
              value={nuevaFecha}
              onChange={e => setNuevaFecha(e.target.value)}
              className="w-full bg-slate-900 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={crearEvento}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg text-sm transition-colors"
            >
              Crear Evento
            </button>
          </div>
        )}

        {eventoActual && (
          <div className="mt-2 flex items-center gap-2 text-slate-400 text-xs">
            <Calendar size={14} />
            <span>{eventoActual.fecha?.slice(0, 10)} - {eventoActual.nombre}</span>
          </div>
        )}
      </div>

      {/* CÁMARA */}
      {eventoSeleccionado && (
        <div className="relative w-full max-w-sm aspect-square bg-black rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl">
          <div id="lector-qr" className="w-full h-full"></div>
          <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg z-10"></div>
          <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg z-10"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg z-10"></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg z-10"></div>
        </div>
      )}

      {/* RESULTADO */}
      <div className="w-full max-w-sm mt-8">
        {!resultado && eventoSeleccionado && (
          <div className="text-center text-slate-400 animate-pulse">
            <p>Apunte la cámara hacia el código QR</p>
          </div>
        )}

        {!eventoSeleccionado && (
          <div className="text-center text-slate-500">
            <p>Selecciona o crea un evento para empezar</p>
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
          <div className="bg-yellow-50 border-2 border-yellow-500 rounded-2xl p-5 shadow-lg animate-fade-in text-center">
            <Info className="text-yellow-600 mx-auto mb-2" size={48} />
            <h2 className="text-yellow-800 font-black text-xl uppercase">Ya escaneado</h2>
            <p className="text-yellow-700 text-sm font-medium">{resultado.mensaje}</p>
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

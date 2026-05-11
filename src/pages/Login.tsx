import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const navigate = useNavigate();

  // 1. INICIALIZAR ESTADOS DESDE LOCALSTORAGE (Persistencia a prueba de recargas)
  const [attempts, setAttempts] = useState(() => {
    return parseInt(localStorage.getItem('apafa_login_attempts') || '0');
  });
  
  const [lockUntil, setLockUntil] = useState<number | null>(() => {
    const storedLock = localStorage.getItem('apafa_lock_until');
    return storedLock ? parseInt(storedLock) : null;
  });

  // 2. VERIFICAR SI YA ESTÁ LOGUEADO (Para no pedir clave a cada rato)
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard'); // Si ya tiene sesión, lo pateamos al panel
      }
    };
    checkUser();
  }, [navigate]);

  // 3. LÓGICA DEL TEMPORIZADOR DE BLOQUEO
  useEffect(() => {
    if (!lockUntil) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= lockUntil) {
        // El castigo terminó, limpiamos todo
        setLockUntil(null);
        setAttempts(0);
        localStorage.removeItem('apafa_lock_until');
        localStorage.removeItem('apafa_login_attempts');
        clearInterval(interval);
      } else {
        // Actualizamos los segundos restantes
        setTimeLeft(Math.ceil((lockUntil - now) / 1000));
      }
    }, 1000);

    // Limpieza del intervalo al desmontar
    return () => clearInterval(interval);
  }, [lockUntil]);

  // 4. FUNCIÓN DE LOGIN BLINDADA
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación extra: Si está bloqueado, ni siquiera intentamos llamar a la BD
    if (lockUntil && Date.now() < lockUntil) {
      toast.error(`Sistema bloqueado. Espera ${Math.ceil((lockUntil - Date.now()) / 1000)} segundos.`);
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Manejo de error y aumento de intentos
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem('apafa_login_attempts', newAttempts.toString()); // Guardamos en memoria dura
      
      if (newAttempts >= 3) {
        const lockTime = Date.now() + 10 * 60 * 1000; // 10 minutos en el futuro
        setLockUntil(lockTime);
        localStorage.setItem('apafa_lock_until', lockTime.toString()); // Guardamos el castigo
        toast.error("Demasiados intentos fallidos. Sistema bloqueado por 10 minutos.");
      } else {
        // Si el error es de Supabase por Rate Limit (muchos intentos a nivel servidor)
        if (error.message.includes('rate limit')) {
           toast.error("Bloqueo de seguridad del servidor. Intente más tarde.");
        } else {
           toast.error(`Credenciales incorrectas. Intentos restantes: ${3 - newAttempts}`);
        }
      }
      setLoading(false);
      return;
    }

    // SI EL LOGIN ES EXITOSO: Limpiamos historial de errores
    localStorage.removeItem('apafa_login_attempts');
    localStorage.removeItem('apafa_lock_until');
    
    toast.success("¡Bienvenido al sistema de control!");
    navigate('/dashboard');
  };

  // Convertimos los segundos en un formato bonito (MM:SS) para el usuario
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${lockUntil ? 'bg-red-100' : 'bg-blue-100'}`}>
            <Lock className={lockUntil ? 'text-red-600' : 'text-blue-600'} size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Acceso Directiva</h1>
          <p className="text-slate-500 mt-2 font-medium">Ingrese sus credenciales de APAFA</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all focus:bg-white
                ${lockUntil ? 'border-red-300 text-slate-400 cursor-not-allowed' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'}`}
              placeholder="correo@ejemplo.com"
              required
              disabled={!!lockUntil}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full pl-11 pr-12 py-3 bg-slate-50 border rounded-xl outline-none transition-all focus:bg-white
                ${lockUntil ? 'border-red-300 text-slate-400 cursor-not-allowed' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'}`}
              placeholder="Contraseña"
              required
              disabled={!!lockUntil}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={!!lockUntil}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button 
            type="submit" 
            disabled={loading || !!lockUntil}
            className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2
              ${lockUntil 
                ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98]'}`}
          >
            {loading && !lockUntil ? <Loader2 className="animate-spin" /> : null}
            {lockUntil ? `Bloqueado por ${formatTime(timeLeft)}` : 'Entrar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}
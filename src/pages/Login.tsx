import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';
import LightRays from '../components/LightRays';
import BlurText from '../components/BlurText';
import logoSchool from '../assets/logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const navigate = useNavigate();

  // 1. PERSISTENCIA DE ESTADOS
  const [attempts, setAttempts] = useState(() => {
    return parseInt(localStorage.getItem('apafa_login_attempts') || '0');
  });
  
  const [lockUntil, setLockUntil] = useState<number | null>(() => {
    const storedLock = localStorage.getItem('apafa_lock_until');
    return storedLock ? parseInt(storedLock) : null;
  });

  // 2. VERIFICAR SESIÓN
  useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate('/dashboard');
      return session;
    },
    staleTime: 60 * 1000,
  });

  // 3. TEMPORIZADOR DE BLOQUEO
  useEffect(() => {
    if (!lockUntil) return;
    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= lockUntil) {
        setLockUntil(null);
        setAttempts(0);
        localStorage.removeItem('apafa_lock_until');
        localStorage.removeItem('apafa_login_attempts');
        clearInterval(interval);
      } else {
        setTimeLeft(Math.ceil((lockUntil - now) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockUntil]);

  // 4. MUTACIÓN DE LOGIN
  const loginMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    onSuccess: () => {
      localStorage.removeItem('apafa_login_attempts');
      localStorage.removeItem('apafa_lock_until');
      toast.success("¡Bienvenido al sistema!");
      navigate('/dashboard');
    },
    onError: (_error: any) => { 
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem('apafa_login_attempts', newAttempts.toString());
      
      if (newAttempts >= 3) {
        const lockTime = Date.now() + 10 * 60 * 1000;
        setLockUntil(lockTime);
        localStorage.setItem('apafa_lock_until', lockTime.toString());
        toast.error("Sistema bloqueado por 10 minutos.");
      } else {
        toast.error(`Credenciales incorrectas. Intentos restantes: ${3 - newAttempts}`);
      }
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockUntil && Date.now() < lockUntil) return;
    loginMutation.mutate();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Clase base para los inputs que corrige el fondo azul del navegador
  const inputStyles = `
    w-full pl-11 pr-4 py-3 bg-zinc-900/50 border rounded-xl outline-none transition-all 
    focus:bg-zinc-800 text-white placeholder:text-zinc-600
    autofill:shadow-[0_0_0_30px_#18181b_inset] 
    autofill:text-fill-white
    [color-scheme:dark]
  `;

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Fondo Animado */}
      <div className="absolute inset-0 pointer-events-none">
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={0.5}
          lightSpread={0.6}
          rayLength={2.5}
          followMouse={false}
          mouseInfluence={0.0}
          noiseAmount={0.02}
          distortion={0.1}
          pulsating={true}
          fadeDistance={0.7}
          saturation={0}
          className="w-full h-full"
        />
      </div>

      <div className="relative z-10 bg-zinc-900/70 backdrop-blur-md p-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-md border border-white/10">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 bg-zinc-800/50 shadow-inner border border-white/10 overflow-hidden p-2">
            <img src={logoSchool} alt="I.E. Jimenez Pimentel" className="w-full h-full object-contain" />
          </div>
          
          <BlurText
            text="Acceso Directiva"
            delay={50}
            animateBy="letters"
            direction="top"
            className="text-3xl font-bold text-white tracking-tight justify-center"
          />
          
          <BlurText
            text="Ingrese sus credenciales de APAFA"
            delay={150}
            animateBy="words"
            direction="bottom"
            className="text-zinc-400 mt-2 font-medium justify-center text-center"
          />
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* INPUT EMAIL */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputStyles} ${lockUntil ? 'border-red-900/50 text-zinc-500 cursor-not-allowed' : 'border-white/10 focus:ring-2 focus:ring-white/20'}`}
              placeholder="correo@ejemplo.com"
              required
              disabled={!!lockUntil}
            />
          </div>

          {/* INPUT PASSWORD */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <input 
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputStyles} ${lockUntil ? 'border-red-900/50 text-zinc-500 cursor-not-allowed' : 'border-white/10 focus:ring-2 focus:ring-white/20'}`}
              placeholder="Contraseña"
              required
              disabled={!!lockUntil}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={!!lockUntil}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* BOTÓN PRINCIPAL */}
          <button 
            type="submit" 
            disabled={loginMutation.isPending || !!lockUntil}
            className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2
              ${lockUntil 
                ? 'bg-red-950/30 text-red-400 border border-red-900/50 cursor-not-allowed' 
                : 'bg-white hover:bg-zinc-300 text-black active:scale-[0.98]'}`}
          >
            {loginMutation.isPending && !lockUntil ? <Loader2 className="animate-spin" /> : null}
            {lockUntil ? `Bloqueado: ${formatTime(timeLeft)}` : 'Entrar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}
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

  const [attempts, setAttempts] = useState(() => {
    return parseInt(localStorage.getItem('apafa_login_attempts') || '0');
  });
  
  const [lockUntil, setLockUntil] = useState<number | null>(() => {
    const storedLock = localStorage.getItem('apafa_lock_until');
    return storedLock ? parseInt(storedLock) : null;
  });

  useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate('/dashboard');
      return session;
    },
    staleTime: 60 * 1000,
  });

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

  const inputClass = `${lockUntil ? 'auth-input auth-input-locked' : 'auth-input auth-input-normal'}`;

  return (
    <div className="auth-theme">
      
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

      <div className="auth-card">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="auth-logo-ring">
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
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="correo@ejemplo.com"
              required
              disabled={!!lockUntil}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <input 
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
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

          <button 
            type="submit" 
            disabled={loginMutation.isPending || !!lockUntil}
            className={lockUntil ? 'auth-btn-locked w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2' : 'auth-btn-primary'}
          >
            {loginMutation.isPending && !lockUntil ? <Loader2 className="animate-spin" /> : null}
            {lockUntil ? `Bloqueado: ${formatTime(timeLeft)}` : 'Entrar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}

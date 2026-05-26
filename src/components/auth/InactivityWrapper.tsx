import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos
const WARNING_BEFORE = 60 * 1000; // avisar 1 minuto antes

export default function InactivityWrapper({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const warningRef = useRef<ReturnType<typeof setTimeout>>();

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    toast.error('Sesión cerrada por inactividad');
    navigate('/', { replace: true });
  }, [navigate]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    warningRef.current = setTimeout(() => {
      toast.warning('Sesión a punto de expirar por inactividad', { duration: WARNING_BEFORE / 1000 });
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE);

    timerRef.current = setTimeout(logout, INACTIVITY_TIMEOUT);
  }, [logout]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    resetTimer();
    for (const ev of events) window.addEventListener(ev, resetTimer);
    return () => {
      for (const ev of events) window.removeEventListener(ev, resetTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [resetTimer]);

  return <>{children}</>;
}
import { useState } from 'react';
import { X, ShieldAlert, Loader2 } from 'lucide-react';

const DELETE_SECRET = import.meta.env.VITE_PADRON_DELETE_SECRET?.trim() ?? '';

export function isClearDatabaseConfigured() {
  return DELETE_SECRET.length >= 4;
}

type Step = 'password' | 'confirm';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => Promise<void>;
  clearing: boolean;
};

export default function ClearDatabaseModal({ isOpen, onClose, onConfirmDelete, clearing }: Props) {
  const [step, setStep] = useState<Step>('password');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    if (clearing) return;
    setStep('password');
    setPassword('');
    setPasswordError('');
    onClose();
  };

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== DELETE_SECRET) {
      setPasswordError('Contraseña incorrecta');
      return;
    }
    setPasswordError('');
    setStep('confirm');
  };

  const handleFinalDelete = async () => {
    await onConfirmDelete();
    setStep('password');
    setPassword('');
  };

  return (
    <div className="theme-modal-overlay">
      <div className="theme-modal max-w-md">
        <div className="theme-modal-header bg-red-500/10">
          <div className="flex items-center gap-2 text-red-400">
            <ShieldAlert size={22} />
            <h3 className="font-bold">Zona de peligro</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={clearing}
            className="theme-modal-close disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        {step === 'password' ? (
          <form onSubmit={handleVerifyPassword} className="p-5 space-y-4">
            <p className="text-sm text-dash-text-muted">
              Para vaciar el padrón escribe la <strong className="text-dash-text">contraseña secreta</strong> configurada por el
              administrador.
            </p>
            <div>
              <label className="theme-label">Contraseña secreta</label>
              <input
                type="password"
                autoComplete="off"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                className="theme-input focus:ring-red-500"
                placeholder="Contraseña"
                required
                autoFocus
              />
              {passwordError && <p className="text-sm text-red-400 mt-1">{passwordError}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={handleClose} className="theme-btn-ghost">
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-dash-surface-elevated text-dash-text font-medium rounded-lg hover:bg-dash-border transition-colors"
              >
                Continuar
              </button>
            </div>
          </form>
        ) : (
          <div className="p-5 space-y-4">
            <p className="text-sm text-dash-text-muted">
              <strong className="text-dash-text">¿Estás seguro?</strong> Se eliminarán <strong className="text-dash-text">todos</strong> los registros del
              padrón. Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStep('password')}
                disabled={clearing}
                className="theme-btn-ghost disabled:opacity-50"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={handleFinalDelete}
                disabled={clearing}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {clearing ? <Loader2 size={18} className="animate-spin" /> : null}
                Sí, vaciar todo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

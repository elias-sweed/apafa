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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <ShieldAlert size={22} />
            <h3 className="font-bold">Zona de peligro</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={clearing}
            className="text-slate-400 hover:text-slate-700 disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        {step === 'password' ? (
          <form onSubmit={handleVerifyPassword} className="p-5 space-y-4">
            <p className="text-sm text-slate-600">
              Para vaciar el padrón escribe la <strong>contraseña secreta</strong> configurada por el
              administrador.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña secreta</label>
              <input
                type="password"
                autoComplete="off"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Contraseña"
                required
                autoFocus
              />
              {passwordError && <p className="text-sm text-red-600 mt-1">{passwordError}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900"
              >
                Continuar
              </button>
            </div>
          </form>
        ) : (
          <div className="p-5 space-y-4">
            <p className="text-sm text-slate-700">
              <strong>¿Estás seguro?</strong> Se eliminarán <strong>todos</strong> los registros del
              padrón. Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStep('password')}
                disabled={clearing}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
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

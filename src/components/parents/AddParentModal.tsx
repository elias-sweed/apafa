import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { parentService } from '../../services/parentService';
import { toast } from 'sonner';
import ParentFormFields, { defaultParentForm, normalizeParentPayload } from './ParentFormFields';
import { registerTodayPadronIds } from '../../utils/todayPadronIds';

export default function AddParentModal({ isOpen, onClose, onSaved }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ ...defaultParentForm });
  const [nextNumero, setNextNumero] = useState<number | undefined>();

  useEffect(() => {
    if (!isOpen) return;
    setFormData({ ...defaultParentForm });
    parentService.getNextId().then(({ nextId }) => setNextNumero(nextId));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error, id } = await parentService.addParent(normalizeParentPayload(formData));

    setLoading(false);

    if (error) {
      toast.error('Error al agregar el padre');
    } else {
      if (id != null) registerTodayPadronIds([id]);
      toast.success('Padre agregado correctamente');
      setFormData({ ...defaultParentForm });
      onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 shrink-0">
          <h3 className="font-bold text-slate-800">Agregar Nuevo Padre</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto">
          <ParentFormFields formData={formData} setFormData={setFormData} numero={nextNumero} />

          <div className="pt-4 mt-5 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Agregar Padre
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

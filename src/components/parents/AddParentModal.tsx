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
    <div className="theme-modal-overlay">
      <div className="theme-modal max-w-3xl">
        <div className="theme-modal-header">
          <h3 className="theme-modal-title">Agregar Nuevo Padre</h3>
          <button onClick={onClose} className="theme-modal-close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto">
          <ParentFormFields formData={formData} setFormData={setFormData} numero={nextNumero} />

          <div className="theme-modal-footer">
            <button type="button" onClick={onClose} className="theme-btn-ghost">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="theme-btn-primary">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Agregar Padre
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

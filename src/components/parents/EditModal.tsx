import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { parentService } from '../../services/parentService';
import { toast } from 'sonner';
import ParentFormFields, { defaultParentForm, normalizeParentPayload } from './ParentFormFields';

function parentToForm(parent: any) {
  return {
    grado: parent.grado || '',
    seccion: parent.seccion || '',
    dni_estudiante: parent.dni_estudiante || '',
    nivel: parent.nivel || '',
    estudiante: parent.estudiante || '',
    sexo: parent.sexo || '',
    asociado_nombre: parent.asociado_nombre || '',
    asociado_dni: parent.asociado_dni || '',
    segundo_responsable: parent.segundo_responsable || '',
    segundo_dni: parent.segundo_dni || '',
    telefono: parent.telefono || '',
  };
}

export default function EditModal({ isOpen, onClose, parent, onSaved }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ ...defaultParentForm });

  useEffect(() => {
    if (parent) {
      setFormData(parentToForm(parent));
    }
  }, [parent]);

  if (!isOpen || !parent) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await parentService.updateParent(parent.id, normalizeParentPayload(formData));

    setLoading(false);

    if (error) {
      toast.error('Error al guardar los datos');
    } else {
      toast.success('Datos actualizados correctamente');
      onSaved();
      onClose();
    }
  };

  return (
    <div className="theme-modal-overlay">
      <div className="theme-modal max-w-3xl">
        <div className="theme-modal-header">
          <h3 className="theme-modal-title">Editar Padre de Familia</h3>
          <button onClick={onClose} className="theme-modal-close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto">
          <ParentFormFields formData={formData} setFormData={setFormData} numero={parent.id} />

          <div className="theme-modal-footer">
            <button type="button" onClick={onClose} className="theme-btn-ghost">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="theme-btn-primary">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { parentService } from '../../services/parentService';
import { toast } from 'sonner';

const defaultForm = {
  grado: '',
  seccion: '',
  dni_estudiante: '',
  nivel: '',
  estudiante: '',
  sexo: '',
  asociado_nombre: '',
  asociado_dni: '',
  segundo_responsable: '',
  segundo_dni: '',
  telefono: ''
};

export default function AddParentModal({ isOpen, onClose, onSaved }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ ...defaultForm });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await parentService.addParent({
      ...formData,
      asociado_nombre: formData.asociado_nombre.toUpperCase(),
      estudiante: formData.estudiante.toUpperCase(),
      segundo_responsable: formData.segundo_responsable?.toUpperCase() || null,
      sexo: formData.sexo?.toLowerCase() || null,
    });

    setLoading(false);

    if (error) {
      toast.error('Error al agregar el padre');
    } else {
      toast.success('Padre agregado correctamente');
      setFormData({ ...defaultForm });
      onSaved();
      onClose();
    }
  };

  const set = (key: string) => (e: any) => setFormData({ ...formData, [key]: e.target.value });

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 shrink-0">
          <h3 className="font-bold text-slate-800">Agregar Nuevo Padre</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto">
          {/* Datos del Estudiante */}
          <div>
            <h4 className="font-semibold text-slate-800 border-b pb-2 mb-3">Datos del Estudiante</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Grado</label>
                <input type="text" value={formData.grado} onChange={set('grado')} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 uppercase text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sección</label>
                <input type="text" value={formData.seccion} onChange={set('seccion')} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 uppercase text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">DNI Estudiante</label>
                <input type="text" maxLength={8} value={formData.dni_estudiante} onChange={(e) => setFormData({...formData, dni_estudiante: e.target.value.replace(/\D/g, '')})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nivel</label>
                <select value={formData.nivel} onChange={set('nivel')} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" required>
                  <option value="">Seleccionar...</option>
                  <option value="INICIAL">INICIAL</option>
                  <option value="PRIMARIA">PRIMARIA</option>
                  <option value="SECUNDARIA">SECUNDARIA</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estudiante</label>
                <input type="text" value={formData.estudiante} onChange={set('estudiante')} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 uppercase text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sexo</label>
                <select value={formData.sexo} onChange={set('sexo')} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value="">Seleccionar...</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
            </div>
          </div>

          {/* Datos del Apoderado */}
          <div>
            <h4 className="font-semibold text-slate-800 border-b pb-2 mb-3">Apoderado</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input type="text" value={formData.asociado_nombre} onChange={set('asociado_nombre')} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 uppercase text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">DNI</label>
                <input type="text" maxLength={8} value={formData.asociado_dni} onChange={(e) => setFormData({...formData, asociado_dni: e.target.value.replace(/\D/g, '')})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input type="text" maxLength={9} value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value.replace(/\D/g, '')})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>
          </div>

          {/* Segundo Responsable */}
          <div>
            <h4 className="font-semibold text-slate-800 border-b pb-2 mb-3">Segundo Responsable (Opcional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input type="text" value={formData.segundo_responsable} onChange={set('segundo_responsable')} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 uppercase text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">DNI</label>
                <input type="text" maxLength={8} value={formData.segundo_dni} onChange={(e) => setFormData({...formData, segundo_dni: e.target.value.replace(/\D/g, '')})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Agregar Padre
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

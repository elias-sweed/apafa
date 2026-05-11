import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { parentService } from '../../services/parentService';
import { toast } from 'sonner';

export default function EditModal({ isOpen, onClose, parent, onSaved }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    asociado_nombre: '',
    asociado_dni: '',
    segundo_responsable: '',
    segundo_dni: '',
    telefono: ''
  });

  useEffect(() => {
    if (parent) {
      setFormData({
        asociado_nombre: parent.asociado_nombre || '',
        asociado_dni: parent.asociado_dni || '',
        segundo_responsable: parent.segundo_responsable || '',
        segundo_dni: parent.segundo_dni || '',
        telefono: parent.telefono || ''
      });
    }
  }, [parent]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await parentService.updateParent(parent.id, formData);
    
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800">Perfil Completo del Asociado</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          {/* Info del Estudiante (No editable aquí) */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-center">
            <div>
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Estudiante</p>
              <p className="text-sm text-blue-900 font-bold uppercase">{parent?.estudiante}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Grado / Nivel</p>
              <p className="text-sm text-blue-900 font-bold uppercase">{parent?.grado} - {parent?.seccion} ({parent?.nivel})</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Responsable Principal */}
            <div className="space-y-4 border-r border-slate-100 pr-4">
              <h4 className="font-semibold text-slate-800 border-b pb-2">Responsable Principal</h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  value={formData.asociado_nombre}
                  onChange={(e) => setFormData({...formData, asociado_nombre: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 uppercase text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">DNI</label>
                <input 
                  type="text" 
                  maxLength={8}
                  value={formData.asociado_dni}
                  onChange={(e) => setFormData({...formData, asociado_dni: e.target.value.replace(/\D/g, '')})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input 
                  type="text" 
                  maxLength={9}
                  value={formData.telefono}
                  onChange={(e) => setFormData({...formData, telefono: e.target.value.replace(/\D/g, '')})}
                  placeholder="Ej: 987654321"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Segundo Responsable */}
            <div className="space-y-4 pl-2">
              <h4 className="font-semibold text-slate-800 border-b pb-2">Segundo Responsable (Opcional)</h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  value={formData.segundo_responsable}
                  onChange={(e) => setFormData({...formData, segundo_responsable: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 uppercase text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">DNI</label>
                <input 
                  type="text" 
                  maxLength={8}
                  value={formData.segundo_dni}
                  onChange={(e) => setFormData({...formData, segundo_dni: e.target.value.replace(/\D/g, '')})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
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
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
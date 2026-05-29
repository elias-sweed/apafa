import type { ChangeEvent, Dispatch, SetStateAction } from 'react';

export const defaultParentForm = {
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
  telefono: '',
};

export type ParentFormData = typeof defaultParentForm;

type Props = {
  formData: ParentFormData;
  setFormData: Dispatch<SetStateAction<ParentFormData>>;
  numero?: number;
};

export function formatParentNumero(numero: number) {
  return `N° ${String(numero).padStart(4, '0')}`;
}

export function normalizeParentPayload(formData: ParentFormData) {
  return {
    ...formData,
    asociado_nombre: formData.asociado_nombre.toUpperCase(),
    estudiante: formData.estudiante.toUpperCase(),
    segundo_responsable: formData.segundo_responsable?.toUpperCase() || null,
    sexo: formData.sexo?.toLowerCase() || null,
  };
}

export default function ParentFormFields({ formData, setFormData, numero }: Props) {
  const set = (key: keyof ParentFormData) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData({ ...formData, [key]: e.target.value });

  return (
    <div className="space-y-5">
      {numero !== undefined && (
        <div className="flex items-center">
          <span className="bg-yellow-500 text-black text-sm font-black px-3 py-1.5 rounded-lg shadow-sm">
            {formatParentNumero(numero)}
          </span>
          <span className="ml-3 text-xs text-dash-text-muted">Número de registro en el padrón</span>
        </div>
      )}

      <div>
        <h4 className="theme-form-heading">Datos del Estudiante</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="theme-label">Grado</label>
            <input
              type="text"
              value={formData.grado}
              onChange={set('grado')}
              className="theme-input uppercase"
              required
            />
          </div>
          <div>
            <label className="theme-label">Sección</label>
            <input
              type="text"
              value={formData.seccion}
              onChange={set('seccion')}
              className="theme-input uppercase"
              required
            />
          </div>
          <div>
            <label className="theme-label">DNI Estudiante</label>
            <input
              type="text"
              maxLength={8}
              value={formData.dni_estudiante}
              onChange={(e) => setFormData({ ...formData, dni_estudiante: e.target.value.replace(/\D/g, '') })}
              className="theme-input"
            />
          </div>
          <div>
            <label className="theme-label">Nivel</label>
            <select
              value={formData.nivel}
              onChange={set('nivel')}
              className="theme-input"
              required
            >
              <option value="">Seleccionar...</option>
              <option value="INICIAL">INICIAL</option>
              <option value="PRIMARIA">PRIMARIA</option>
              <option value="SECUNDARIA">SECUNDARIA</option>
            </select>
          </div>
          <div>
            <label className="theme-label">Estudiante</label>
            <input
              type="text"
              value={formData.estudiante}
              onChange={set('estudiante')}
              className="theme-input uppercase"
              required
            />
          </div>
          <div>
            <label className="theme-label">Sexo</label>
            <select
              value={formData.sexo}
              onChange={set('sexo')}
              className="theme-input"
            >
              <option value="">Seleccionar...</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h4 className="theme-form-heading">Apoderado</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="theme-label">Nombre Completo</label>
            <input
              type="text"
              value={formData.asociado_nombre}
              onChange={set('asociado_nombre')}
              className="theme-input uppercase"
              required
            />
          </div>
          <div>
            <label className="theme-label">DNI</label>
            <input
              type="text"
              maxLength={8}
              value={formData.asociado_dni}
              onChange={(e) => setFormData({ ...formData, asociado_dni: e.target.value.replace(/\D/g, '') })}
              className="theme-input"
            />
          </div>
          <div>
            <label className="theme-label">Teléfono</label>
            <input
              type="text"
              maxLength={9}
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value.replace(/\D/g, '') })}
              className="theme-input"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="theme-form-heading">Segundo Responsable (Opcional)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="theme-label">Nombre Completo</label>
            <input
              type="text"
              value={formData.segundo_responsable}
              onChange={set('segundo_responsable')}
              className="theme-input uppercase"
            />
          </div>
          <div>
            <label className="theme-label">DNI</label>
            <input
              type="text"
              maxLength={8}
              value={formData.segundo_dni}
              onChange={(e) => setFormData({ ...formData, segundo_dni: e.target.value.replace(/\D/g, '') })}
              className="theme-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

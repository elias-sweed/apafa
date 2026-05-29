import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Database, UploadCloud, Download, ShieldAlert, Loader2, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { parentService } from '../../services/parentService';
import { downloadPadronTemplate, parsePadronFile } from '../../utils/padronImport';
import { registerTodayPadronIds, clearTodayPadronIds } from '../../utils/todayPadronIds';
import ClearDatabaseModal, { isClearDatabaseConfigured } from './ClearDatabaseModal';

export default function ConfigTab() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const deleteConfigured = isClearDatabaseConfigured();

  const handleImportFile = async (file: File) => {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls') && !name.endsWith('.csv')) {
      toast.error('Usa un archivo Excel (.xlsx, .xls) o CSV');
      return;
    }

    setImporting(true);
    try {
      const { rows, errors } = await parsePadronFile(file);

      if (errors.length > 0) {
        const preview = errors.slice(0, 5).join('\n');
        const more = errors.length > 5 ? `\n... y ${errors.length - 5} error(es) más` : '';
        toast.error(`Revisa el archivo:\n${preview}${more}`, { duration: 8000 });
        return;
      }

      if (
        !confirm(
          `Se importarán ${rows.length} registro(s) al padrón.\n\n¿Continuar?`
        )
      ) {
        return;
      }

      const { error, inserted, ids } = await parentService.bulkInsertParents(rows);

      if (error) {
        const msg = typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: string }).message)
          : 'Error al guardar en la base de datos';
        toast.error(
          inserted > 0
            ? `Se guardaron ${inserted} filas antes del error: ${msg}`
            : msg
        );
        return;
      }

      if (ids?.length) registerTodayPadronIds(ids);
      toast.success(`${inserted} registro(s) importados correctamente`);
      queryClient.invalidateQueries({ queryKey: ['parents'] });
    } catch {
      toast.error('No se pudo leer el archivo. Verifica que sea un Excel válido.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImportFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImportFile(file);
  };

  const executeClearDatabase = async () => {
    setClearing(true);
    const { error } = await parentService.clearAllParents();
    setClearing(false);

    if (error) {
      toast.error('No se pudo vaciar la base de datos');
      return;
    }

    clearTodayPadronIds();
    setClearModalOpen(false);
    toast.success('Base de datos vaciada');
    queryClient.invalidateQueries({ queryKey: ['parents'] });
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div className="theme-card">
        <div className="theme-card-section-header">
          <div className="p-2 bg-blue-500/15 text-blue-400 rounded-lg">
            <Database size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-dash-text">Importar padrón desde Excel</h2>
            <p className="text-sm text-dash-text-muted">
              Carga masiva de estudiantes y apoderados a la base de datos
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="theme-inner-panel">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="text-emerald-400 shrink-0 mt-0.5" size={22} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-dash-text mb-1">1. Descarga la plantilla</p>
                <p className="text-sm text-dash-text-muted mb-3">
                  El Excel trae solo los encabezados vacíos. Complétalo con tus datos: Grado,
                  Sección, DNI Estudiante, Nivel, Estudiante, Sexo, Apoderado, DNI Apoderado,
                  Segundo Responsable, DNI Segundo Responsable y Teléfono.
                </p>
                <button
                  type="button"
                  onClick={downloadPadronTemplate}
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                >
                  <Download size={18} />
                  Descargar plantilla Excel
                </button>
              </div>
            </div>
          </div>

          <div>
            <p className="font-semibold text-dash-text mb-3">2. Sube el archivo completado</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={onFileChange}
              disabled={importing}
            />
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              onClick={() => !importing && fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                importing
                  ? 'border-dash-border bg-dash-surface-muted cursor-wait'
                  : dragOver
                    ? 'border-blue-500 bg-blue-500/10 cursor-copy'
                    : 'border-dash-border hover:border-blue-500 hover:bg-blue-500/5 cursor-pointer'
              }`}
            >
              {importing ? (
                <>
                  <Loader2 size={48} className="mx-auto text-blue-400 mb-4 animate-spin" />
                  <p className="text-dash-text font-medium">Importando registros...</p>
                </>
              ) : (
                <>
                  <UploadCloud
                    size={48}
                    className={`mx-auto mb-4 ${dragOver ? 'text-blue-400' : 'text-dash-text-subtle'}`}
                  />
                  <p className="text-dash-text font-medium mb-1">
                    Haz clic o arrastra tu archivo Excel (.xlsx)
                  </p>
                  <p className="text-sm text-dash-text-muted">
                    Cada fila = un estudiante en el padrón (como al agregar uno manualmente)
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="text-xs text-dash-text-muted space-y-1 border-t border-dash-border-subtle pt-4">
            <p>
              <strong className="text-dash-text-muted">Nivel:</strong> INICIAL, PRIMARIA o SECUNDARIA (obligatorio)
            </p>
            <p>
              <strong className="text-dash-text-muted">Sexo:</strong> M o F (opcional)
            </p>
            <p>
              <strong className="text-dash-text-muted">Obligatorios:</strong> Grado, Sección, Nivel, Estudiante y Apoderado
            </p>
          </div>
        </div>
      </div>

      <div className="theme-card border-red-500/30">
        <div className="p-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/15 text-red-400 rounded-full">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-dash-text">Zona de peligro</h3>
              <p className="text-sm text-dash-text-muted">Borrar todos los registros del padrón (irreversible)</p>
              {!deleteConfigured && (
                <p className="text-xs text-amber-400 mt-2 max-w-md">
                  Falta configurar la contraseña: crea el archivo <code className="bg-amber-500/10 px-1 rounded">.env.local</code>{' '}
                  en la raíz del proyecto con <code className="bg-amber-500/10 px-1 rounded">VITE_PADRON_DELETE_SECRET=tu_clave</code>{' '}
                  y reinicia <code className="bg-amber-500/10 px-1 rounded">npm run dev</code>.
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!deleteConfigured) {
                toast.error('Configura VITE_PADRON_DELETE_SECRET en .env.local primero');
                return;
              }
              setClearModalOpen(true);
            }}
            disabled={clearing || importing || !deleteConfigured}
            className="border border-red-500/50 text-red-400 px-4 py-2 rounded-lg font-bold hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            {clearing ? 'Borrando...' : 'Vaciar base de datos'}
          </button>
        </div>
      </div>

      <ClearDatabaseModal
        isOpen={clearModalOpen}
        onClose={() => setClearModalOpen(false)}
        onConfirmDelete={executeClearDatabase}
        clearing={clearing}
      />
    </div>
  );
}

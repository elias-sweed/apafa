import * as XLSX from 'xlsx';

export type PadronInsertRow = {
  grado: string;
  seccion: string;
  dni_estudiante: string | null;
  nivel: string;
  estudiante: string;
  sexo: string | null;
  asociado_nombre: string;
  asociado_dni: string | null;
  segundo_responsable: string | null;
  segundo_dni: string | null;
  telefono: string | null;
};

/** Encabezados exactos de la plantilla Excel (fila 1) */
export const PADRON_TEMPLATE_HEADERS = [
  'Grado',
  'Sección',
  'DNI Estudiante',
  'Nivel',
  'Estudiante',
  'Sexo',
  'Apoderado',
  'DNI Apoderado',
  'Segundo Responsable',
  'DNI Segundo Responsable',
  'Teléfono',
] as const;

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

const HEADER_ALIASES: Record<string, keyof PadronInsertRow> = {
  grado: 'grado',
  seccion: 'seccion',
  dni_estudiante: 'dni_estudiante',
  nivel: 'nivel',
  estudiante: 'estudiante',
  sexo: 'sexo',
  apoderado: 'asociado_nombre',
  asociado: 'asociado_nombre',
  asociado_nombre: 'asociado_nombre',
  nombre_apoderado: 'asociado_nombre',
  padre: 'asociado_nombre',
  dni_apoderado: 'asociado_dni',
  asociado_dni: 'asociado_dni',
  dni_del_apoderado: 'asociado_dni',
  segundo_responsable: 'segundo_responsable',
  segundo_apoderado: 'segundo_responsable',
  dni_segundo_responsable: 'segundo_dni',
  dni_segundo_apoderado: 'segundo_dni',
  segundo_dni: 'segundo_dni',
  telefono: 'telefono',
};

function cellToString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'number') return String(Math.trunc(value));
  return String(value).trim();
}

function onlyDigits(value: string, maxLen?: number): string | null {
  const digits = value.replace(/\D/g, '');
  if (!digits) return null;
  return maxLen ? digits.slice(0, maxLen) : digits;
}

export function normalizePadronRow(raw: Partial<Record<keyof PadronInsertRow, unknown>>): PadronInsertRow {
  const str = (v: unknown) => cellToString(v);
  const upper = (v: unknown) => {
    const s = str(v).toUpperCase();
    return s || null;
  };

  const sexoRaw = str(raw.sexo).toLowerCase();
  const sexo = sexoRaw === 'm' || sexoRaw === 'masculino' ? 'm' : sexoRaw === 'f' || sexoRaw === 'femenino' ? 'f' : sexoRaw || null;

  return {
    grado: str(raw.grado).toUpperCase(),
    seccion: str(raw.seccion).toUpperCase(),
    dni_estudiante: onlyDigits(str(raw.dni_estudiante), 8),
    nivel: str(raw.nivel).toUpperCase(),
    estudiante: str(raw.estudiante).toUpperCase(),
    sexo,
    asociado_nombre: str(raw.asociado_nombre).toUpperCase(),
    asociado_dni: onlyDigits(str(raw.asociado_dni), 8),
    segundo_responsable: upper(raw.segundo_responsable),
    segundo_dni: onlyDigits(str(raw.segundo_dni), 8),
    telefono: onlyDigits(str(raw.telefono), 9),
  };
}

function rowIsEmpty(raw: Record<string, unknown>): boolean {
  return Object.values(raw).every((v) => !cellToString(v));
}

function mapSheetRow(row: Record<string, unknown>): Partial<Record<keyof PadronInsertRow, unknown>> {
  const mapped: Partial<Record<keyof PadronInsertRow, unknown>> = {};
  for (const [header, value] of Object.entries(row)) {
    const key = HEADER_ALIASES[normalizeHeader(header)];
    if (key) mapped[key] = value;
  }
  return mapped;
}

export function validatePadronRow(row: PadronInsertRow, lineNumber: number): string | null {
  if (!row.grado) return `Fila ${lineNumber}: falta Grado`;
  if (!row.seccion) return `Fila ${lineNumber}: falta Sección`;
  if (!row.nivel) return `Fila ${lineNumber}: falta Nivel`;
  if (!row.estudiante) return `Fila ${lineNumber}: falta Estudiante`;
  if (!row.asociado_nombre) return `Fila ${lineNumber}: falta Apoderado`;
  const niveles = ['INICIAL', 'PRIMARIA', 'SECUNDARIA'];
  if (!niveles.includes(row.nivel)) {
    return `Fila ${lineNumber}: Nivel debe ser INICIAL, PRIMARIA o SECUNDARIA`;
  }
  if (row.sexo && row.sexo !== 'm' && row.sexo !== 'f') {
    return `Fila ${lineNumber}: Sexo debe ser M o F`;
  }
  return null;
}

export function downloadPadronTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([[...PADRON_TEMPLATE_HEADERS]]);
  ws['!cols'] = PADRON_TEMPLATE_HEADERS.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Padron');
  XLSX.writeFile(wb, 'plantilla_padron_apafa.xlsx');
}

export async function parsePadronFile(file: File): Promise<{
  rows: PadronInsertRow[];
  errors: string[];
}> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { rows: [], errors: ['El archivo no tiene hojas.'] };
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  });

  const rows: PadronInsertRow[] = [];
  const errors: string[] = [];

  rawRows.forEach((raw, index) => {
    const lineNumber = index + 2;
    if (rowIsEmpty(raw)) return;

    const mapped = mapSheetRow(raw);
    const normalized = normalizePadronRow(mapped);
    const validationError = validatePadronRow(normalized, lineNumber);
    if (validationError) {
      errors.push(validationError);
      return;
    }
    rows.push(normalized);
  });

  if (rows.length === 0 && errors.length === 0) {
    errors.push('No hay filas con datos. Usa la plantilla y completa al menos una fila.');
  }

  return { rows, errors };
}

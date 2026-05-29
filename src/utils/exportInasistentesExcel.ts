import XLSX from 'xlsx-js-style';

type Hijo = { estudiante?: string; grado?: string; seccion?: string };
type Inasistente = {
  asociado_nombre?: string;
  asociado_dni?: string;
  hijos?: Hijo[];
};

type ExportParams = {
  eventoNombre: string;
  eventoFecha: string;
  inasistentes: Inasistente[];
  totalPadres: number;
  totalAsistieron: number;
};

const COLS = 5;
const HEADER_ROW = 5;

const borderThin = {
  top: { style: 'thin', color: { rgb: 'CBD5E1' } },
  bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
  left: { style: 'thin', color: { rgb: 'CBD5E1' } },
  right: { style: 'thin', color: { rgb: 'CBD5E1' } },
};

const titleStyle = {
  font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: '1D4ED8' } },
  alignment: { horizontal: 'center', vertical: 'center' },
};

const subtitleStyle = {
  font: { bold: true, sz: 12, color: { rgb: '1E3A8A' } },
  fill: { fgColor: { rgb: 'DBEAFE' } },
  alignment: { horizontal: 'center', vertical: 'center' },
};

const metaStyle = {
  font: { sz: 11, color: { rgb: '334155' } },
  fill: { fgColor: { rgb: 'F1F5F9' } },
  alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
};

const summaryStyle = {
  font: { bold: true, sz: 11, color: { rgb: '0F172A' } },
  fill: { fgColor: { rgb: 'E2E8F0' } },
  alignment: { horizontal: 'left', vertical: 'center' },
};

const theadStyle = {
  font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: '334155' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: borderThin,
};

const cellEvenStyle = {
  font: { sz: 11, color: { rgb: '1E293B' } },
  fill: { fgColor: { rgb: 'FFFFFF' } },
  alignment: { vertical: 'center', wrapText: true },
  border: borderThin,
};

const cellOddStyle = {
  ...cellEvenStyle,
  fill: { fgColor: { rgb: 'F8FAFC' } },
};

function formatHijos(hijos?: Hijo[]) {
  if (!hijos?.length) return '—';
  return hijos
    .map((h) => {
      const grado = h.grado || '?';
      const seccion = h.seccion || '?';
      const nombre = h.estudiante || 'Sin nombre';
      return `${nombre} (${grado} "${seccion}")`;
    })
    .join('\n');
}

function setCell(
  ws: XLSX.WorkSheet,
  row: number,
  col: number,
  value: string | number,
  style: object
) {
  const ref = XLSX.utils.encode_cell({ r: row, c: col });
  ws[ref] = {
    v: value,
    t: typeof value === 'number' ? 'n' : 's',
    s: style,
  };
}

function safeFileSlug(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 40) || 'evento';
}

export function exportInasistentesExcel({
  eventoNombre,
  eventoFecha,
  inasistentes,
  totalPadres,
  totalAsistieron,
}: ExportParams) {
  const fechaLabel = eventoFecha?.slice(0, 10) || new Date().toISOString().slice(0, 10);
  const ws: XLSX.WorkSheet = {};

  setCell(ws, 0, 0, 'APAFA — I.E. Jimenez Pimentel', titleStyle);
  setCell(ws, 1, 0, 'Reporte de inasistentes', subtitleStyle);
  setCell(
    ws,
    2,
    0,
    `Evento: ${eventoNombre}   |   Fecha: ${fechaLabel}   |   Generado: ${new Date().toLocaleString('es-PE')}`,
    metaStyle
  );
  setCell(
    ws,
    3,
    0,
    `Total padres: ${totalPadres}   |   Asistieron: ${totalAsistieron}   |   No asistieron: ${inasistentes.length}`,
    summaryStyle
  );

  const headers = ['N°', 'Apoderado', 'DNI', 'Hijo(s)', 'Estado'];
  headers.forEach((header, col) => {
    setCell(ws, HEADER_ROW, col, header, theadStyle);
  });

  inasistentes.forEach((p, index) => {
    const row = HEADER_ROW + 1 + index;
    const rowStyle = index % 2 === 0 ? cellEvenStyle : cellOddStyle;
    const estadoStyle = {
      ...rowStyle,
      font: { ...rowStyle.font, bold: true, color: { rgb: 'B91C1C' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };

    setCell(ws, row, 0, index + 1, { ...rowStyle, alignment: { horizontal: 'center', vertical: 'center' } });
    setCell(ws, row, 1, (p.asociado_nombre || '—').toUpperCase(), rowStyle);
    setCell(ws, row, 2, p.asociado_dni || '—', { ...rowStyle, alignment: { horizontal: 'center', vertical: 'center' } });
    setCell(ws, row, 3, formatHijos(p.hijos), rowStyle);
    setCell(ws, row, 4, 'FALTA', estadoStyle);
  });

  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: Math.max(HEADER_ROW + inasistentes.length, HEADER_ROW), c: COLS - 1 },
  });

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: COLS - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: COLS - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: COLS - 1 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: COLS - 1 } },
  ];

  ws['!cols'] = [{ wch: 6 }, { wch: 36 }, { wch: 14 }, { wch: 48 }, { wch: 12 }];
  ws['!rows'] = [
    { hpt: 28 },
    { hpt: 22 },
    { hpt: 20 },
    { hpt: 20 },
    { hpt: 8 },
    { hpt: 22 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inasistentes');
  XLSX.writeFile(wb, `inasistentes_${safeFileSlug(eventoNombre)}_${fechaLabel}.xlsx`);
}

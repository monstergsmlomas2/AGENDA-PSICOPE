import { jsPDF } from 'jspdf';

/**
 * Genera y descarga un recibo de pago en PDF.
 *
 * @param {Object} pago - Datos del pago (incluye paciente_nombre, paciente_apellido, etc.)
 * @param {Object} config - Configuración del profesional (nombre_profesional, especialidad, matricula, telefono, email)
 */
export function generarReciboPDF(pago, config) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = 20;

  // ─── Funciones auxiliares ───
  const bold = (text, size, color, align = 'left') => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    if (color) doc.setTextColor(color[0], color[1], color[2]);
    const x = align === 'center' ? pageWidth / 2 : align === 'right' ? pageWidth - marginRight : marginLeft;
    doc.text(text, x, y, { align });
    y += size * 0.45;
  };

  const normal = (text, size, color, align = 'left') => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    if (color) doc.setTextColor(color[0], color[1], color[2]);
    const x = align === 'center' ? pageWidth / 2 : align === 'right' ? pageWidth - marginRight : marginLeft;
    doc.text(text, x, y, { align });
    y += size * 0.45;
  };

  const line = (yPos) => {
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  };

  const labelValue = (label, value, size = 10) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(80, 80, 80);
    doc.text(label, marginLeft, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    const labelWidth = doc.getTextWidth(label + '  ');
    doc.text(String(value), marginLeft + labelWidth, y);
    y += size * 0.55;
  };

  // ═══════════════════════════════════════════════════
  // 1. ENCABEZADO — Datos del profesional
  // ═══════════════════════════════════════════════════
  const nombre = config?.nombre_profesional || 'Profesional';
  bold(nombre, 16, [30, 30, 30]);

  if (config?.especialidad || config?.matricula) {
    const espMat = [config.especialidad, config.matricula].filter(Boolean).join(' — ');
    normal(espMat, 10, [120, 120, 120]);
  }

  const contacto = [config?.telefono, config?.email].filter(Boolean).join(' | ');
  if (contacto) {
    normal(contacto, 10, [120, 120, 120]);
  }

  y += 3;
  line(y);
  y += 6;

  // ═══════════════════════════════════════════════════
  // 2. TÍTULO — RECIBO DE PAGO
  // ═══════════════════════════════════════════════════
  bold('RECIBO DE PAGO', 14, [50, 50, 50], 'center');
  normal(`N° ${pago.id}`, 10, [100, 100, 100], 'center');

  y += 6;
  line(y);
  y += 8;

  // ═══════════════════════════════════════════════════
  // 3. DATOS DEL PAGO
  // ═══════════════════════════════════════════════════
  const pacienteStr = `${pago.paciente_nombre || ''} ${pago.paciente_apellido || ''}`.trim();
  labelValue('Paciente:', pacienteStr || '—');

  const fechaStr = pago.fecha
    ? new Date(pago.fecha + 'T12:00:00').toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—';
  labelValue('Fecha:', fechaStr);

  labelValue('Concepto:', pago.concepto || 'Honorarios profesionales');

  const obraSocial =
    pago.tipo_pago === 'obra_social' ? pago.obra_social_nombre || 'Obra Social' : 'Particular';
  labelValue('Obra Social:', obraSocial);

  const montoStr = `$${Number(pago.monto).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  labelValue('Monto:', montoStr);

  const estadoMap = { pagado: 'Pagado', pendiente: 'Pendiente', deuda: 'Deuda' };
  labelValue('Estado:', estadoMap[pago.estado] || pago.estado || '—');

  y += 8;

  // ═══════════════════════════════════════════════════
  // 4. PIE — Firma y leyenda
  // ═══════════════════════════════════════════════════
  line(y);
  y += 10;

  normal('Firma: ___________________________', 10, [80, 80, 80], 'right');
  y += 12;

  normal(
    'Este recibo es válido como comprobante de pago.',
    8,
    [160, 160, 160],
    'center',
  );

  // ─── Descargar ───
  const apellido = (pago.paciente_apellido || 'desconocido')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
  doc.save(`recibo-${pago.id}-${apellido}.pdf`);
}

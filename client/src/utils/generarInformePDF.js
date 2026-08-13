import { seccionesPorTipo, labelTipoInforme } from '../data/seccionesInforme.js';

/**
 * Arma las secciones a renderizar a partir del contenido del informe.
 * Si no hay secciones estructuradas (la IA no devolvió JSON válido), se usa el
 * texto crudo como una única sección sin título.
 */
function armarSecciones(tipo, contenido, textoPlano) {
  if (contenido && Object.keys(contenido).length > 0) {
    return (seccionesPorTipo[tipo] || [])
      .filter(s => contenido[s.key]?.trim())
      .map(s => ({ titulo: s.label, texto: contenido[s.key].trim() }));
  }
  return textoPlano?.trim() ? [{ titulo: null, texto: textoPlano.trim() }] : [];
}

function nombrePaciente(paciente) {
  if (!paciente) return '';
  return `${paciente.apellido || ''}, ${paciente.nombre || ''}`.replace(/^, |, $/, '');
}

function fechaHoy() {
  return new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Genera y descarga el informe en PDF.
 *
 * @param {Object} opts
 * @param {string} opts.tipo - value del tipo de informe (diagnostico, evolucion, ...)
 * @param {Object} opts.paciente - datos del paciente
 * @param {Object} [opts.contenido] - secciones { clave: texto }
 * @param {string} [opts.textoPlano] - fallback cuando no hay secciones
 * @param {Object} [opts.config] - perfil del profesional
 */
export async function descargarInformePDF({ tipo, paciente, contenido, textoPlano, config = {} }) {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 20;
  const marginRight = 20;
  const marginBottom = 25;
  const anchoUtil = pageWidth - marginLeft - marginRight;
  let y = 20;

  const saltoSiHaceFalta = (alto) => {
    if (y + alto > pageHeight - marginBottom) {
      doc.addPage();
      y = 20;
    }
  };

  // ─── Encabezado: profesional ───
  if (config.nombre_profesional) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 30, 30);
    doc.text(config.nombre_profesional, marginLeft, y);
    y += 5;
  }

  const subtitulo = [config.especialidad, config.matricula && `Mat. ${config.matricula}`]
    .filter(Boolean)
    .join(' — ');
  if (subtitulo) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(subtitulo, marginLeft, y);
    y += 5;
  }

  doc.setDrawColor(200);
  doc.setLineWidth(0.4);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 9;

  // ─── Título ───
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  const titulo = doc.splitTextToSize(labelTipoInforme(tipo).toUpperCase(), anchoUtil);
  doc.text(titulo, pageWidth / 2, y, { align: 'center' });
  y += titulo.length * 6 + 4;

  // ─── Datos del paciente ───
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);

  const datos = [
    ['Paciente', nombrePaciente(paciente)],
    ['DNI', paciente?.dni],
    ['Fecha de nacimiento', paciente?.fecha_nacimiento
      ? new Date(paciente.fecha_nacimiento).toLocaleDateString('es-AR')
      : null],
    ['Obra social', paciente?.obra_social],
    ['Fecha del informe', fechaHoy()],
  ].filter(([, v]) => v);

  for (const [label, valor] of datos) {
    saltoSiHaceFalta(6);
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, marginLeft, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(valor), marginLeft + 38, y);
    y += 5.5;
  }

  y += 4;
  doc.setDrawColor(220);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 9;

  // ─── Secciones ───
  for (const seccion of armarSecciones(tipo, contenido, textoPlano)) {
    if (seccion.titulo) {
      saltoSiHaceFalta(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(20, 20, 20);
      const tituloSeccion = doc.splitTextToSize(seccion.titulo.toUpperCase(), anchoUtil);
      doc.text(tituloSeccion, marginLeft, y);
      y += tituloSeccion.length * 5 + 2;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);

    // Se imprime línea por línea para poder cortar de página en el medio
    for (const linea of doc.splitTextToSize(seccion.texto, anchoUtil)) {
      saltoSiHaceFalta(5.5);
      doc.text(linea, marginLeft, y);
      y += 5;
    }
    y += 6;
  }

  // ─── Firma ───
  saltoSiHaceFalta(32);
  y = Math.max(y + 12, pageHeight - marginBottom - 20);
  doc.setDrawColor(150);
  doc.line(pageWidth - marginRight - 65, y, pageWidth - marginRight, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text('Firma y sello del profesional', pageWidth - marginRight, y, { align: 'right' });

  const nombreArchivo = `Informe_${tipo}_${nombrePaciente(paciente).replace(/[^\w]+/g, '_') || 'paciente'}.pdf`;
  doc.save(nombreArchivo);
}

const escaparHTML = (texto) => String(texto ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

/**
 * Abre el informe en una ventana limpia y lanza el diálogo de impresión.
 * No usa window.print() sobre la app para que no salgan menús ni botones.
 */
export function imprimirInforme({ tipo, paciente, contenido, textoPlano, config = {} }) {
  const secciones = armarSecciones(tipo, contenido, textoPlano);

  const encabezadoProfesional = [
    config.nombre_profesional && `<p class="prof">${escaparHTML(config.nombre_profesional)}</p>`,
    [config.especialidad, config.matricula && `Mat. ${config.matricula}`].filter(Boolean).length
      ? `<p class="sub">${escaparHTML([config.especialidad, config.matricula && `Mat. ${config.matricula}`].filter(Boolean).join(' — '))}</p>`
      : '',
  ].filter(Boolean).join('');

  const datos = [
    ['Paciente', nombrePaciente(paciente)],
    ['DNI', paciente?.dni],
    ['Fecha de nacimiento', paciente?.fecha_nacimiento
      ? new Date(paciente.fecha_nacimiento).toLocaleDateString('es-AR')
      : null],
    ['Obra social', paciente?.obra_social],
    ['Fecha del informe', fechaHoy()],
  ]
    .filter(([, v]) => v)
    .map(([label, valor]) => `<tr><th>${escaparHTML(label)}</th><td>${escaparHTML(valor)}</td></tr>`)
    .join('');

  const cuerpo = secciones
    .map(s => `
      ${s.titulo ? `<h2>${escaparHTML(s.titulo)}</h2>` : ''}
      <p>${escaparHTML(s.texto).replace(/\n/g, '<br>')}</p>
    `)
    .join('');

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${escaparHTML(labelTipoInforme(tipo))}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: Georgia, 'Times New Roman', serif; color: #222; line-height: 1.55; font-size: 11.5pt; margin: 0; }
    .prof { font-weight: bold; font-size: 13pt; margin: 0; }
    .sub { color: #666; font-size: 9.5pt; margin: 2px 0 0; }
    hr { border: none; border-top: 1px solid #ccc; margin: 12px 0 18px; }
    h1 { font-size: 14pt; text-align: center; text-transform: uppercase; letter-spacing: .5px; margin: 0 0 18px; }
    table { border-collapse: collapse; margin-bottom: 18px; }
    th { text-align: left; padding: 2px 14px 2px 0; font-size: 10pt; white-space: nowrap; }
    td { padding: 2px 0; font-size: 10pt; }
    h2 { font-size: 11pt; text-transform: uppercase; margin: 18px 0 4px; page-break-after: avoid; }
    p { margin: 0 0 10px; text-align: justify; }
    .firma { margin-top: 55px; text-align: right; page-break-inside: avoid; }
    .firma span { display: inline-block; border-top: 1px solid #888; padding-top: 5px; color: #666; font-size: 9.5pt; min-width: 62mm; }
  </style>
</head>
<body>
  ${encabezadoProfesional}
  <hr>
  <h1>${escaparHTML(labelTipoInforme(tipo))}</h1>
  <table>${datos}</table>
  ${cuerpo}
  <div class="firma"><span>Firma y sello del profesional</span></div>
</body>
</html>`;

  const ventana = window.open('', '_blank');
  if (!ventana) {
    throw new Error('El navegador bloqueó la ventana de impresión. Habilitá las ventanas emergentes para este sitio.');
  }
  ventana.document.write(html);
  ventana.document.close();
  ventana.focus();
  // Se espera al render antes de abrir el diálogo del sistema
  ventana.onload = () => ventana.print();
  setTimeout(() => { try { ventana.print(); } catch { /* ya se disparó en onload */ } }, 400);
}

const check = (val) => val ? '☑' : '☐';

const field = (label, value) =>
  `<div class="field">
    <span class="label">${label}</span>
    <span class="value">${value || '—'}</span>
  </div>`;

const textarea = (label, value) =>
  `<div class="field-block">
    <span class="label">${label}</span>
    <div class="text-block">${value || ''}</div>
  </div>`;

export function generarHtmlEntrevista(paciente, entrevista = {}) {
  const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const e = entrevista || {};

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Entrevista de Admisión — ${paciente.apellido}, ${paciente.nombre}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Arial', sans-serif;
      font-size: 11pt;
      color: #111;
      background: white;
      padding: 0;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 18mm 16mm 14mm;
    }

    /* ENCABEZADO */
    .header {
      border-bottom: 2px solid #4a1d96;
      padding-bottom: 10px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .header-title {
      font-size: 18pt;
      font-weight: bold;
      color: #4a1d96;
      letter-spacing: 0.5px;
    }
    .header-sub {
      font-size: 10pt;
      color: #555;
      margin-top: 3px;
    }
    .header-date {
      font-size: 9pt;
      color: #666;
      text-align: right;
    }

    /* FICHA PACIENTE */
    .patient-box {
      background: #f3f0ff;
      border: 1px solid #c4b5fd;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 20px;
      display: flex;
      gap: 40px;
      flex-wrap: wrap;
    }
    .patient-box .pfield { display: flex; flex-direction: column; }
    .patient-box .plabel { font-size: 7.5pt; text-transform: uppercase; color: #7c3aed; font-weight: bold; letter-spacing: 0.5px; }
    .patient-box .pvalue { font-size: 11pt; font-weight: bold; color: #1e1b4b; }

    /* SECCIONES */
    section {
      margin-bottom: 18px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .section-title {
      font-size: 10.5pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #4a1d96;
      border-bottom: 1px solid #c4b5fd;
      padding-bottom: 4px;
      margin-bottom: 10px;
    }

    /* GRILLAS */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px 16px; }
    .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px 12px; }

    /* CAMPO SIMPLE */
    .field { display: flex; flex-direction: column; margin-bottom: 6px; }
    .label { font-size: 7.5pt; text-transform: uppercase; color: #555; font-weight: bold; letter-spacing: 0.4px; }
    .value {
      border-bottom: 1px solid #aaa;
      min-height: 18px;
      padding: 1px 0 2px;
      font-size: 10.5pt;
    }

    /* CAMPO CON BLOQUE DE TEXTO */
    .field-block { margin-bottom: 8px; }
    .text-block {
      border: 1px solid #ccc;
      border-radius: 4px;
      min-height: 48px;
      padding: 5px 8px;
      font-size: 10.5pt;
      line-height: 1.5;
      white-space: pre-wrap;
    }

    /* CHECKBOXES */
    .checks-row { display: flex; flex-wrap: wrap; gap: 6px 24px; margin-top: 4px; }
    .check-item { font-size: 10.5pt; display: flex; align-items: center; gap: 5px; }
    .check-symbol { font-size: 13pt; line-height: 1; }

    /* BLOQUE FAMILIA */
    .family-box {
      border: 1px solid #c4b5fd;
      border-radius: 6px;
      padding: 10px 12px;
    }
    .family-title { font-size: 9pt; font-weight: bold; color: #6d28d9; margin-bottom: 8px; text-transform: uppercase; }

    /* ENCUADRE */
    .encuadre-box {
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 6px;
      padding: 10px 14px;
    }
    .encuadre-box .section-title { color: #166534; border-color: #86efac; }

    /* PIE */
    .footer {
      margin-top: 30px;
      border-top: 1px solid #c4b5fd;
      padding-top: 10px;
      display: flex;
      justify-content: space-between;
      gap: 60px;
    }
    .firma { text-align: center; }
    .firma-line { border-bottom: 1px solid #555; width: 160px; margin-bottom: 5px; height: 32px; }
    .firma-label { font-size: 8.5pt; color: #555; }

    @media print {
      body { padding: 0; }
      .page { padding: 12mm 14mm 10mm; }
      @page { size: A4; margin: 0; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- ENCABEZADO -->
  <div class="header">
    <div>
      <div class="header-title">Entrevista de Admisión</div>
      <div class="header-sub">Evaluación Psicopedagógica</div>
    </div>
    <div class="header-date">Fecha: ${fecha}</div>
  </div>

  <!-- FICHA PACIENTE -->
  <div class="patient-box">
    <div class="pfield">
      <span class="plabel">Paciente</span>
      <span class="pvalue">${(paciente.apellido || '').toUpperCase()}, ${paciente.nombre || ''}</span>
    </div>
    ${paciente.fecha_nacimiento ? `<div class="pfield"><span class="plabel">Fecha de nacimiento</span><span class="pvalue">${new Date(paciente.fecha_nacimiento).toLocaleDateString('es-AR')}</span></div>` : ''}
    ${paciente.dni ? `<div class="pfield"><span class="plabel">DNI</span><span class="pvalue">${paciente.dni}</span></div>` : ''}
    ${paciente.obra_social_nombre ? `<div class="pfield"><span class="plabel">Obra Social</span><span class="pvalue">${paciente.obra_social_nombre}</span></div>` : ''}
  </div>

  <!-- DATOS ESCOLARES -->
  <section>
    <div class="section-title">Datos Escolares</div>
    <div class="grid-3">
      ${field('Escuela', e.escuela)}
      ${field('Cursa', e.cursa)}
      ${field('Turno', e.turno)}
    </div>
  </section>

  <!-- DATOS DE LA FAMILIA -->
  <section>
    <div class="section-title">Datos de la Familia</div>
    <div class="grid-2" style="margin-bottom:10px">
      <div class="family-box">
        <div class="family-title">Madre</div>
        ${field('Nombre', e.madre_nombre)}
        <div class="grid-2">${field('Edad', e.madre_edad)}${field('Trabajo', e.madre_trabajo)}</div>
        ${field('Estudios', e.madre_estudios)}
      </div>
      <div class="family-box">
        <div class="family-title">Padre</div>
        ${field('Nombre', e.padre_nombre)}
        <div class="grid-2">${field('Edad', e.padre_edad)}${field('Trabajo', e.padre_trabajo)}</div>
        ${field('Estudios', e.padre_estudios)}
      </div>
    </div>
    <div class="grid-2">
      ${textarea('Hermanos (nombres y edades)', e.hermanos)}
      ${textarea('¿Viven solos o con otros familiares?', e.viven_con)}
    </div>
  </section>

  <!-- ANTECEDENTES -->
  <section>
    <div class="section-title">Antecedentes e Hitos del Desarrollo</div>
    <div class="grid-2" style="margin-bottom:10px">
      ${textarea('Perinatales / Parto / Posnatales', e.perinatales)}
      ${textarea('Antecedentes Familiares', e.antecedentes_familiares)}
    </div>
    <div class="grid-4">
      ${field('Sostén cefálico', e.sosten_cefalico ?? e.balbuceos)}
      ${field('Se sentó a', e.sento)}
      ${field('Caminó a', e.camino)}
      ${field('Tomó pecho hasta', e.pecho)}
      ${field('Control esfínteres a', e.esfinteres)}
      ${field('Comida sólida a', e.comida_solida)}
    </div>
    <div style="margin-top:8px">${field('Primeras palabras (y cuáles)', e.primeras_palabras)}</div>
  </section>

  <!-- TRAYECTORIA ESCOLAR -->
  <section>
    <div class="section-title">Trayectoria Escolar y Apoyos</div>
    ${textarea('Detalle de escolaridad', e.trayectoria)}
    <div class="checks-row" style="margin-top:8px">
      <span class="check-item"><span class="check-symbol">${check(e.apoyo_acompanante)}</span> Acompañante Terapéutico</span>
      <span class="check-item"><span class="check-symbol">${check(e.apoyo_maestra)}</span> Maestra de Inclusión</span>
      <span class="check-item"><span class="check-symbol">${check(e.apoyo_die)}</span> Dispositivo (DIE)</span>
      <span class="check-item"><span class="check-symbol">${check(e.apoyo_adaptaciones)}</span> Adaptaciones Curriculares</span>
      <span class="check-item"><span class="check-symbol">${check(e.apoyo_cud)}</span> Posee CUD</span>
    </div>
  </section>

  <!-- HÁBITOS Y PROCESAMIENTO SENSORIAL -->
  <section>
    <div class="section-title">Hábitos y Procesamiento Sensorial</div>
    <div class="grid-2">
      <div>
        <div class="family-title" style="color:#555;font-size:9pt;margin-bottom:6px">Hábitos Diarios</div>
        ${field('Alimentación', e.habito_alimentacion)}
        ${field('Sueño', e.habito_sueno)}
        ${field('Aseo y Vestido', e.habito_aseo)}
      </div>
      <div>
        <div class="family-title" style="color:#555;font-size:9pt;margin-bottom:6px">Procesamiento Sensorial</div>
        ${field('Táctil / Auditivo / Visual', e.sensorial_tactil_auditivo_visual)}
        ${field('Olfatorio', e.sensorial_olfatorio)}
        ${field('Vestibular (Vértigo)', e.sensorial_vestibular)}
      </div>
    </div>
  </section>

  <!-- MOTRICIDAD -->
  <section>
    <div class="section-title">Motricidad</div>
    <div class="grid-2">
      <div>
        <div class="family-title" style="color:#555;font-size:9pt;margin-bottom:6px">Motricidad Gruesa</div>
        <div class="checks-row" style="flex-direction:column;gap:5px">
          <span class="check-item">¿Es acorde a la edad? <strong>${e.motricidad_acorde_edad === 'si' ? 'Sí' : e.motricidad_acorde_edad === 'no' ? 'No' : '—'}</strong></span>
          <span class="check-item"><span class="check-symbol">${check(e.motricidad_dificultad_peso)}</span> Dificultad para agarrar objetos pesados</span>
          <span class="check-item"><span class="check-symbol">${check(e.motricidad_coordinado)}</span> Movimientos coordinados</span>
        </div>
      </div>
      <div>
        <div class="family-title" style="color:#555;font-size:9pt;margin-bottom:6px">Motricidad Fina</div>
        <div class="checks-row" style="flex-direction:column;gap:5px">
          <span class="check-item"><span class="check-symbol">${check(e.motricidad_pinza)}</span> Pinza fina / Toma el lápiz en pinza</span>
          <span class="check-item"><span class="check-symbol">${check(e.motricidad_pinta_bien)}</span> Pinta bien / Sin salirse del contorno</span>
          <span class="check-item"><span class="check-symbol">${check(e.motricidad_tijera)}</span> Dificultad para cortar con tijera</span>
          <span class="check-item"><span class="check-symbol">${check(e.motricidad_botones)}</span> Abrocha botones</span>
          <span class="check-item"><span class="check-symbol">${check(e.motricidad_cierres)}</span> Cierra y abre cierres</span>
          <span class="check-item"><span class="check-symbol">${check(e.motricidad_cordones)}</span> Ata cordones</span>
        </div>
      </div>
    </div>
  </section>

  <!-- SOCIALIZACIÓN -->
  <section>
    <div class="section-title">Socialización, Juego y Rutina</div>
    <div class="grid-2">
      ${textarea('Socialización y Juego', e.socializacion)}
      ${textarea('Uso de pantallas (Celular/PC)', e.pantallas)}
      ${field('Miedos', e.miedos)}
      ${field('¿Qué le gusta hacer?', e.gusta_hacer)}
      ${field('¿Qué le disgusta?', e.disgusta)}
    </div>
    ${field('Tareas escolares (¿Solo o con ayuda? ¿Lugar propio?)', e.tareas_escolares)}
    ${textarea('Describir cómo es un día de su vida', e.dia_de_vida)}
  </section>

  <!-- CONDUCTA Y OBSERVACIONES -->
  <section>
    <div class="section-title">Conducta y Observaciones Clínicas</div>
    <div class="grid-2">
      <div>
        <div class="field-label">Conducta</div>
        <div class="checks-row" style="flex-direction:column;gap:5px;margin-top:4px">
          <span class="check-item"><span class="check-symbol">${check(e.conducta_desafiante)}</span> Desafiante</span>
          <span class="check-item"><span class="check-symbol">${check(e.conducta_tranquilo)}</span> Tranquilo/a</span>
          <span class="check-item"><span class="check-symbol">${check(e.conducta_inquieto)}</span> Inquieto/a</span>
          <span class="check-item"><span class="check-symbol">${check(e.conducta_desobediente)}</span> Desobediente</span>
          <span class="check-item"><span class="check-symbol">${check(e.conducta_ansioso)}</span> Ansioso/a</span>
          <span class="check-item"><span class="check-symbol">${check(e.conducta_autolesiona)}</span> Se auto lesiona</span>
        </div>
      </div>
      ${textarea('Observaciones', e.observaciones)}
      ${textarea('Intervenciones y Hospitalizaciones', e.intervenciones)}
      <div>
        ${textarea('Controles de Salud', e.controles_salud)}
        ${textarea('Tratamientos Anteriores', e.tratamientos_anteriores)}
      </div>
    </div>
  </section>

  <!-- LENGUAJE Y COMUNICACIÓN -->
  <section>
    <div class="section-title">Lenguaje y Comunicación</div>
    <div class="grid-2">
      ${field('Primeras palabras', e.lenguaje_primeras_palabras)}
      ${textarea('Dificultades', e.lenguaje_dificultades)}
    </div>
  </section>

  <!-- ENCUADRE PROFESIONAL -->
  <section>
    <div class="encuadre-box">
      <div class="section-title">Encuadre Profesional</div>
      <div class="grid-2">
        ${field('Día de sesión pautado', e.encuadre_dia)}
        ${field('Horario pautado', e.encuadre_horario)}
      </div>
    </div>
  </section>

  <!-- FIRMA -->
  <div class="footer">
    <div class="firma">
      <div class="firma-line"></div>
      <div class="firma-label">Firma Padre / Madre / Tutor</div>
    </div>
    <div class="firma">
      <div class="firma-line"></div>
      <div class="firma-label">Firma y Sello Profesional</div>
    </div>
  </div>

</div>
</body>
</html>`;
}

export function abrirVentanaImpresion(paciente, entrevista) {
  const html = generarHtmlEntrevista(paciente, entrevista);
  const ventana = window.open('', '_blank', 'width=900,height=700');
  ventana.document.write(html);
  ventana.document.close();
  ventana.focus();
  // Dar tiempo al navegador para renderizar antes de imprimir
  setTimeout(() => {
    ventana.print();
  }, 500);
}

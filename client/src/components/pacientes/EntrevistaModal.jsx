import { useState } from 'react';
import { FileText, Printer, Upload, Loader2 } from 'lucide-react';
import { subirArchivo } from '../../services/driveService';
import { abrirVentanaImpresion, generarHtmlEntrevista } from '../../utils/entrevistaDocument';
import FolderPickerDialog from '../ui/FolderPickerDialog';

export default function EntrevistaModal({ paciente, onClose, onSave }) {
  if (!paciente) return null;

  const entrevista = paciente?.entrevista;
  const [uploadingDrive, setUploadingDrive] = useState(false);
  const [driveMsg, setDriveMsg] = useState(null);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [tieneCud, setTieneCud] = useState(!!entrevista?.apoyo_cud);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const entrevistaData = Object.fromEntries(formData.entries());
    const checkboxes = e.target.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => { entrevistaData[cb.name] = cb.checked; });
    onSave(entrevistaData);
  };

  const handlePrint = () => abrirVentanaImpresion(paciente, entrevista);

  const generarPdfBlob = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');

    // Renderizar el HTML limpio en un iframe oculto para capturarlo
    const html = generarHtmlEntrevista(paciente, entrevista);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:900px;height:1px;border:none;';
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();

    await new Promise(r => setTimeout(r, 600));

    const el = iframe.contentDocument.querySelector('.page');
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: 900,
      scrollY: 0,
    });
    document.body.removeChild(iframe);

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 0;
    const usableW = pageW - margin * 2;
    const imgH = (canvas.height * usableW) / canvas.width;

    let yOffset = 0;
    let remaining = imgH;
    while (remaining > 0) {
      const sliceH = Math.min(remaining, pageH - margin * 2);
      const srcY = (yOffset / imgH) * canvas.height;
      const srcH = (sliceH / imgH) * canvas.height;
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = Math.ceil(srcH);
      sliceCanvas.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
      if (yOffset > 0) pdf.addPage();
      pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', margin, margin, usableW, sliceH);
      yOffset += sliceH;
      remaining -= sliceH;
    }
    return pdf.output('blob');
  };

  const handleSubirDrive = () => {
    setDriveMsg(null);
    setShowFolderPicker(true);
  };

  const handleFolderSelected = async (folderId) => {
    setShowFolderPicker(false);
    setUploadingDrive(true);
    try {
      const blob = await generarPdfBlob();
      if (!blob) {
        setDriveMsg({ tipo: 'error', texto: 'No se pudo generar el PDF.' });
        return;
      }
      const nombreArchivo = `Entrevista_${paciente.apellido}_${paciente.nombre}_${new Date().toISOString().slice(0, 10)}.pdf`;
      const result = await subirArchivo(paciente.id, new File([blob], nombreArchivo, { type: 'application/pdf' }), { seccion: 'Entrevista de Admisión' });
      setDriveMsg(result
        ? { tipo: 'ok', texto: `Subido a Drive: ${nombreArchivo}` }
        : { tipo: 'error', texto: 'Error al subir el archivo a Drive.' }
      );
    } finally {
      setUploadingDrive(false);
    }
  };

  return (
    <>
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-950 w-full max-w-5xl max-h-[90vh] rounded-2xl border border-purple-300 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">

        <div className="bg-purple-100/50 dark:bg-slate-900 border-b border-purple-300 dark:border-slate-800 px-8 py-5 flex items-center justify-between shrink-0 print:hidden">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-teal-400 flex items-center gap-3">
              <FileText size={26} /> Entrevista de Admisión
            </h2>
            <p className="text-slate-900 dark:text-white text-sm mt-1">
              Paciente: <span className="capitalize font-semibold">{paciente.nombre} {paciente.apellido}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-900 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 p-2 rounded-lg">
            ✕
          </button>
        </div>

        {/* FORMULARIO */}
        <form id="entrevistaForm" onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar flex-1 text-sm text-slate-900 dark:text-white space-y-10">
          <div>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-purple-300 dark:border-slate-800 pb-2">Datos Escolares</h3>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-slate-900 dark:text-white text-xs uppercase font-semibold">Escuela</label><input type="text" name="escuela" defaultValue={entrevista?.escuela} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 dark:text-white text-xs uppercase font-semibold">Cursa</label><input type="text" name="cursa" defaultValue={entrevista?.cursa} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 dark:text-white text-xs uppercase font-semibold">Turno</label><input type="text" name="turno" defaultValue={entrevista?.turno} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-purple-300 dark:border-slate-800 pb-2">Datos de la Familia</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-purple-100/50 dark:bg-slate-900 p-5 rounded-xl border border-purple-300 dark:border-slate-800 space-y-4">
                <h4 className="text-teal-600 dark:text-teal-500 font-bold">Datos de la Madre</h4>
                <input type="text" name="madre_nombre" defaultValue={entrevista?.madre_nombre} placeholder="Nombre completo" className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" name="madre_edad" defaultValue={entrevista?.madre_edad} placeholder="Edad" className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" />
                  <input type="text" name="madre_trabajo" defaultValue={entrevista?.madre_trabajo} placeholder="Trabajo" className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" />
                </div>
                <input type="text" name="madre_estudios" defaultValue={entrevista?.madre_estudios} placeholder="Estudios Cursados" className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" />
              </div>
              <div className="bg-purple-100/50 dark:bg-slate-900 p-5 rounded-xl border border-purple-300 dark:border-slate-800 space-y-4">
                <h4 className="text-teal-600 dark:text-teal-500 font-bold">Datos del Padre</h4>
                <input type="text" name="padre_nombre" defaultValue={entrevista?.padre_nombre} placeholder="Nombre completo" className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" name="padre_edad" defaultValue={entrevista?.padre_edad} placeholder="Edad" className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" />
                  <input type="text" name="padre_trabajo" defaultValue={entrevista?.padre_trabajo} placeholder="Trabajo" className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" />
                </div>
                <input type="text" name="padre_estudios" defaultValue={entrevista?.padre_estudios} placeholder="Estudios Cursados" className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-slate-900 dark:text-white text-xs uppercase font-semibold">Hermanos (Nombres y Edades)</label><textarea name="hermanos" defaultValue={entrevista?.hermanos} rows="2" className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white"></textarea></div>
              <div><label className="text-slate-900 dark:text-white text-xs uppercase font-semibold">¿Viven solos o con otros familiares?</label><textarea name="viven_con" defaultValue={entrevista?.viven_con} rows="2" className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white"></textarea></div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-purple-300 dark:border-slate-800 pb-2">Antecedentes e Hitos del Desarrollo</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-slate-900 dark:text-white text-xs uppercase font-semibold">Perinatales / Parto / Posnatales</label><textarea name="perinatales" defaultValue={entrevista?.perinatales} rows="2" className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white"></textarea></div>
              <div><label className="text-slate-900 dark:text-white text-xs uppercase font-semibold">Antecedentes Familiares</label><textarea name="antecedentes_familiares" defaultValue={entrevista?.antecedentes_familiares} rows="2" className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white"></textarea></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div><label className="text-slate-900 dark:text-white text-xs font-semibold">Sostén cefálico</label><input type="text" name="sosten_cefalico" defaultValue={entrevista?.sosten_cefalico ?? entrevista?.balbuceos} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 dark:text-white text-xs font-semibold">Se sentó a:</label><input type="text" name="sento" defaultValue={entrevista?.sento} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 dark:text-white text-xs font-semibold">Caminó a:</label><input type="text" name="camino" defaultValue={entrevista?.camino} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 dark:text-white text-xs font-semibold">Tomó pecho hasta:</label><input type="text" name="pecho" defaultValue={entrevista?.pecho} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 dark:text-white text-xs font-semibold">Control esfínteres a:</label><input type="text" name="esfinteres" defaultValue={entrevista?.esfinteres} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 dark:text-white text-xs font-semibold">Comida sólida a:</label><input type="text" name="comida_solida" defaultValue={entrevista?.comida_solida} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div className="col-span-2"><label className="text-slate-900 dark:text-white text-xs font-semibold">Primeras palabras (y cuáles):</label><input type="text" name="primeras_palabras" defaultValue={entrevista?.primeras_palabras} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-purple-300 dark:border-slate-800 pb-2">Trayectoria Escolar y Apoyos</h3>
            <textarea name="trayectoria" defaultValue={entrevista?.trayectoria} rows="2" placeholder="Detalle de escolaridad..." className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-3 outline-none focus:border-teal-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white"></textarea>
            <div className="flex flex-wrap gap-6 bg-purple-100/50 dark:bg-slate-900 p-4 rounded-xl border border-purple-300 dark:border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer font-medium"><input type="checkbox" name="apoyo_acompanante" defaultChecked={entrevista?.apoyo_acompanante} className="accent-teal-600 dark:accent-teal-500 w-4 h-4" /> Acompañante Terapéutico</label>
              <label className="flex items-center gap-2 cursor-pointer font-medium"><input type="checkbox" name="apoyo_maestra" defaultChecked={entrevista?.apoyo_maestra} className="accent-teal-600 dark:accent-teal-500 w-4 h-4" /> Maestra de Inclusión</label>
              <label className="flex items-center gap-2 cursor-pointer font-medium"><input type="checkbox" name="apoyo_die" defaultChecked={entrevista?.apoyo_die} className="accent-teal-600 dark:accent-teal-500 w-4 h-4" /> Dispositivo (DIE)</label>
              <label className="flex items-center gap-2 cursor-pointer font-medium"><input type="checkbox" name="apoyo_adaptaciones" defaultChecked={entrevista?.apoyo_adaptaciones} className="accent-teal-600 dark:accent-teal-500 w-4 h-4" /> Adaptaciones Curriculares</label>
              <label className="flex items-center gap-2 cursor-pointer font-medium"><input type="checkbox" name="apoyo_cud" checked={tieneCud} onChange={(e) => setTieneCud(e.target.checked)} className="accent-teal-600 dark:accent-teal-500 w-4 h-4" /> Posee CUD</label>
            </div>
            {tieneCud && (
              <div>
                <label className="text-slate-900 dark:text-white text-xs uppercase font-semibold">Diagnóstico del CUD</label>
                <input type="text" name="cud_diagnostico" defaultValue={entrevista?.cud_diagnostico} placeholder="Indique el diagnóstico que figura en el Certificado Único de Discapacidad" className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" />
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-purple-300 dark:border-slate-800 pb-2">Hábitos y Procesamiento Sensorial</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-teal-600 dark:text-teal-500 font-bold">Hábitos Diarios</h4>
                <div><label className="text-slate-900 dark:text-white text-xs font-semibold">Alimentación</label><input type="text" name="habito_alimentacion" defaultValue={entrevista?.habito_alimentacion} className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
                <div><label className="text-slate-900 dark:text-white text-xs font-semibold">Sueño</label><input type="text" name="habito_sueno" defaultValue={entrevista?.habito_sueno} className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
                <div><label className="text-slate-900 dark:text-white text-xs font-semibold">Aseo y Vestido</label><input type="text" name="habito_aseo" defaultValue={entrevista?.habito_aseo} className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              </div>
              <div className="space-y-4">
                <h4 className="text-teal-600 dark:text-teal-500 font-bold">Procesamiento Sensorial</h4>
                <div><label className="text-slate-900 dark:text-white text-xs font-semibold">Táctil / Auditivo / Visual</label><input type="text" name="sensorial_tactil_auditivo_visual" defaultValue={entrevista?.sensorial_tactil_auditivo_visual} className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
                <div><label className="text-slate-900 dark:text-white text-xs font-semibold">Olfatorio</label><input type="text" name="sensorial_olfatorio" defaultValue={entrevista?.sensorial_olfatorio} className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
                <div><label className="text-slate-900 dark:text-white text-xs font-semibold">Vestibular (Vértigo)</label><input type="text" name="sensorial_vestibular" defaultValue={entrevista?.sensorial_vestibular} className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-purple-300 dark:border-slate-800 pb-2">Motricidad</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-purple-100/50 dark:bg-slate-900 p-5 rounded-xl border border-purple-300 dark:border-slate-800">
              <div className="space-y-3">
                <p className="text-slate-900 dark:text-white text-sm font-bold mb-2">Motricidad Gruesa</p>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">¿Es acorde a la edad?</span>
                  <label className="flex items-center gap-1.5 text-sm font-medium"><input type="radio" name="motricidad_acorde_edad" value="si" defaultChecked={entrevista?.motricidad_acorde_edad === 'si'} className="accent-teal-600 dark:accent-teal-500 w-4 h-4" /> Sí</label>
                  <label className="flex items-center gap-1.5 text-sm font-medium"><input type="radio" name="motricidad_acorde_edad" value="no" defaultChecked={entrevista?.motricidad_acorde_edad === 'no'} className="accent-teal-600 dark:accent-teal-500 w-4 h-4" /> No</label>
                </div>
                {[
                  ['motricidad_dificultad_peso', 'Dificultad para agarrar objetos pesados'],
                  ['motricidad_coordinado', 'Movimientos coordinados'],
                ].map(([name, label]) => (
                  <div key={name} className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{label}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <label className="flex items-center gap-1.5 text-sm font-medium"><input type="radio" name={name} value="si" defaultChecked={entrevista?.[name] === 'si' || entrevista?.[name] === true} className="accent-teal-600 dark:accent-teal-500 w-4 h-4" /> Sí</label>
                      <label className="flex items-center gap-1.5 text-sm font-medium"><input type="radio" name={name} value="no" defaultChecked={entrevista?.[name] === 'no' || entrevista?.[name] === false} className="accent-teal-600 dark:accent-teal-500 w-4 h-4" /> No</label>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <p className="text-slate-900 dark:text-white text-sm font-bold mb-2">Motricidad Fina</p>
                {[
                  ['motricidad_pinza', 'Pinza fina / Toma el lápiz en pinza'],
                  ['motricidad_pinta_bien', 'Pinta bien / Sin salirse del contorno'],
                  ['motricidad_tijera', 'Dificultad para cortar con tijera'],
                  ['motricidad_botones', 'Abrocha botones'],
                  ['motricidad_cierres', 'Cierra y abre cierres'],
                  ['motricidad_cordones', 'Ata cordones'],
                ].map(([name, label]) => (
                  <div key={name} className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{label}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <label className="flex items-center gap-1.5 text-sm font-medium"><input type="radio" name={name} value="si" defaultChecked={entrevista?.[name] === 'si' || entrevista?.[name] === true} className="accent-teal-600 dark:accent-teal-500 w-4 h-4" /> Sí</label>
                      <label className="flex items-center gap-1.5 text-sm font-medium"><input type="radio" name={name} value="no" defaultChecked={entrevista?.[name] === 'no' || entrevista?.[name] === false} className="accent-teal-600 dark:accent-teal-500 w-4 h-4" /> No</label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-purple-300 dark:border-slate-800 pb-2">Socialización, Juego y Rutina</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-slate-900 dark:text-white text-xs uppercase font-semibold">Socialización y Juego</label><textarea name="socializacion" defaultValue={entrevista?.socializacion} rows="2" className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white"></textarea></div>
              <div><label className="text-slate-900 dark:text-white text-xs uppercase font-semibold">Uso de pantallas (Celular/PC)</label><textarea name="pantallas" defaultValue={entrevista?.pantallas} rows="2" className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white"></textarea></div>
              <div><label className="text-slate-900 dark:text-white text-xs uppercase font-semibold">Miedos</label><input type="text" name="miedos" defaultValue={entrevista?.miedos} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 dark:text-white text-xs uppercase font-semibold">¿Qué le gusta hacer?</label><input type="text" name="gusta_hacer" defaultValue={entrevista?.gusta_hacer} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 dark:text-white text-xs uppercase font-semibold">¿Qué le disgusta?</label><input type="text" name="disgusta" defaultValue={entrevista?.disgusta} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div className="col-span-2"><label className="text-slate-900 dark:text-white text-xs uppercase font-semibold">Tareas escolares (¿Solo o con ayuda? ¿Lugar propio?)</label><input type="text" name="tareas_escolares" defaultValue={entrevista?.tareas_escolares} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div className="col-span-2"><label className="text-slate-900 dark:text-white text-xs uppercase font-semibold">Describir cómo es un día de su vida</label><textarea name="dia_de_vida" defaultValue={entrevista?.dia_de_vida} rows="2" className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white"></textarea></div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-purple-300 dark:border-slate-800 pb-2">Conducta y Observaciones Clínicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-purple-100/50 dark:bg-slate-900 p-4 rounded-xl border border-purple-300 dark:border-slate-800">
                <label className="text-slate-900 dark:text-white text-xs uppercase font-semibold block mb-3">Conducta</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['conducta_desafiante', 'Desafiante'],
                    ['conducta_tranquilo', 'Tranquilo/a'],
                    ['conducta_inquieto', 'Inquieto/a'],
                    ['conducta_desobediente', 'Desobediente'],
                    ['conducta_ansioso', 'Ansioso/a'],
                    ['conducta_impulsivo', 'Impulsivo/a'],
                    ['conducta_autolesiona', 'Se auto lesiona'],
                  ].map(([name, label]) => (
                    <label key={name} className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                      <input type="checkbox" name={name} defaultChecked={entrevista?.[name]} className="accent-teal-600 dark:accent-teal-500 w-4 h-4" /> {label}
                    </label>
                  ))}
                </div>
              </div>
              <div><label className="text-slate-900 dark:text-white text-xs uppercase font-semibold">Observaciones</label><textarea name="observaciones" defaultValue={entrevista?.observaciones} rows="4" placeholder="Observaciones generales del profesional..." className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white"></textarea></div>
              <div><label className="text-slate-900 dark:text-white text-xs uppercase font-semibold">Intervenciones y Hospitalizaciones</label><textarea name="intervenciones" defaultValue={entrevista?.intervenciones} rows="4" placeholder="Cirugías, internaciones, intervenciones previas..." className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white"></textarea></div>
              <div className="space-y-2">
                <div><label className="text-slate-900 dark:text-white text-xs uppercase font-semibold">Controles de Salud</label><textarea name="controles_salud" defaultValue={entrevista?.controles_salud} rows="2" placeholder="Médico de cabecera, especialistas, controles periódicos..." className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white"></textarea></div>
                <div><label className="text-slate-900 dark:text-white text-xs uppercase font-semibold">Tratamientos Anteriores</label><textarea name="tratamientos_anteriores" defaultValue={entrevista?.tratamientos_anteriores} rows="2" placeholder="Tratamientos previos, profesionales, duración..." className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white"></textarea></div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-purple-300 dark:border-slate-800 pb-2">Lenguaje y Comunicación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-slate-900 dark:text-white text-xs uppercase font-semibold">Primeras palabras</label><input type="text" name="lenguaje_primeras_palabras" defaultValue={entrevista?.lenguaje_primeras_palabras} placeholder="Ej: alrededor de los 12 meses..." className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 dark:text-white text-xs uppercase font-semibold">Dificultades</label><textarea name="lenguaje_dificultades" defaultValue={entrevista?.lenguaje_dificultades} rows="3" placeholder="Dificultades en la comunicación y el lenguaje..." className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white"></textarea></div>
            </div>
          </section>

          <section className="space-y-4 bg-teal-50 dark:bg-teal-900/10 p-5 rounded-xl border border-teal-200 dark:border-teal-900/30">
            <h3 className="text-lg font-bold text-teal-700 dark:text-teal-400 border-b border-teal-200 dark:border-teal-900/30 pb-2">Encuadre Profesional</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-slate-900 dark:text-white text-xs font-semibold">Día de sesión pautado</label><input type="text" name="encuadre_dia" defaultValue={entrevista?.encuadre_dia} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 dark:text-white text-xs font-semibold">Horario pautado</label><input type="text" name="encuadre_horario" defaultValue={entrevista?.encuadre_horario} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
            </div>
          </section>

          </div>{/* fin printRef */}
        </form>

        {/* Mensaje Drive */}
        {driveMsg && (
          <div className={`mx-8 mb-2 px-4 py-2 rounded-lg text-sm font-medium print:hidden ${driveMsg.tipo === 'ok' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
            {driveMsg.texto}
          </div>
        )}

        <div className="bg-purple-100/50 dark:bg-slate-900 border-t border-purple-300 dark:border-slate-800 px-8 py-5 flex items-center justify-between gap-4 shrink-0 print:hidden">
          {/* Acciones secundarias */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-purple-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-purple-50 dark:hover:bg-slate-700 font-semibold text-sm transition-all"
            >
              <Printer size={16} /> Imprimir
            </button>
            <button
              type="button"
              onClick={handleSubirDrive}
              disabled={uploadingDrive}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-purple-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-purple-50 dark:hover:bg-slate-700 font-semibold text-sm transition-all disabled:opacity-60"
            >
              {uploadingDrive ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploadingDrive ? 'Subiendo...' : 'Subir a Drive'}
            </button>
          </div>

          {/* Acciones principales */}
          <div className="flex gap-4">
            <button onClick={onClose} className="px-6 py-2.5 text-slate-900 hover:text-slate-700 dark:text-white dark:hover:text-white font-bold transition-colors">
              Cerrar Planilla
            </button>
            <button type="submit" form="entrevistaForm" className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-teal-500/20 transition-all hover:-translate-y-0.5">
              Guardar Entrevista
            </button>
          </div>
        </div>

      </div>
    </div>

    {showFolderPicker && (
      <FolderPickerDialog
        onSelect={handleFolderSelected}
        onCancel={() => setShowFolderPicker(false)}
      />
    )}
    </>
  );
}

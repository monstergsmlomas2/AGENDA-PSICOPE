import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPacienteById, guardarEntrevista } from '../services/pacientesService';
import { subirArchivo } from '../services/driveService';
import { abrirVentanaImpresion, generarHtmlEntrevista } from '../utils/entrevistaDocument';
import FolderPickerDialog from '../components/ui/FolderPickerDialog';
import { ArrowLeft, FileText, Printer, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '../components/ui';

export default function EntrevistaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDrive, setUploadingDrive] = useState(false);
  const [driveMsg, setDriveMsg] = useState(null);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState(null);
  const autoSaveTimer = useRef(null);
  const formRef = useRef(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    getPacienteById(id)
      .then(setPaciente)
      .catch(() => toast.error('Error', 'No se pudo cargar el paciente.'))
      .finally(() => {
        setLoading(false);
        setTimeout(() => { isFirstLoad.current = false; }, 300);
      });
  }, [id]);

  const recogerDatosFormulario = (formEl) => {
    const formData = new FormData(formEl);
    const data = Object.fromEntries(formData.entries());
    formEl.querySelectorAll('input[type="checkbox"]').forEach(cb => { data[cb.name] = cb.checked; });
    return data;
  };

  const handleFormChange = () => {
    if (isFirstLoad.current || !formRef.current) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setAutoSaveStatus('saving');
    autoSaveTimer.current = setTimeout(async () => {
      try {
        const data = recogerDatosFormulario(formRef.current);
        await guardarEntrevista(id, data);
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus(null), 3000);
      } catch {
        setAutoSaveStatus(null);
      }
    }, 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setSubmitting(true);
    try {
      const entrevistaData = recogerDatosFormulario(e.target);
      await guardarEntrevista(id, entrevistaData);
      toast.success('Entrevista guardada', '¡Entrevista de Admisión guardada exitosamente!');
      navigate(`/pacientes/${id}`);
    } catch {
      toast.error('Error', 'No se pudo guardar la entrevista.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse max-w-5xl mx-auto">
        <div className="h-8 w-40 bg-pink-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-96 bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="text-center py-20 text-slate-900 dark:text-slate-400">
        <p className="text-lg font-bold">Paciente no encontrado</p>
        <button onClick={() => navigate('/pacientes')} className="mt-4 text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 hover:underline font-medium">Volver</button>
      </div>
    );
  }

  const entrevista = paciente?.entrevista;

  const handlePrint = () => abrirVentanaImpresion(paciente, entrevista);

  const generarPdfBlob = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');

    const html = generarHtmlEntrevista(paciente, entrevista);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:900px;height:1px;border:none;';
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();

    await new Promise(r => setTimeout(r, 600));

    const el = iframe.contentDocument.querySelector('.page');
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 900, scrollY: 0 });
    document.body.removeChild(iframe);

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const usableW = pageW;
    const imgH = (canvas.height * usableW) / canvas.width;
    let yOffset = 0;
    let remaining = imgH;
    while (remaining > 0) {
      const sliceH = Math.min(remaining, pageH);
      const srcY = (yOffset / imgH) * canvas.height;
      const srcH = (sliceH / imgH) * canvas.height;
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = Math.ceil(srcH);
      sliceCanvas.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
      if (yOffset > 0) pdf.addPage();
      pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, usableW, sliceH);
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
      if (!blob) { setDriveMsg({ tipo: 'error', texto: 'No se pudo generar el PDF.' }); return; }
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
    <div className="space-y-6 text-slate-900 dark:text-slate-200 animate-fade-in max-w-5xl mx-auto">
      <button
        onClick={() => navigate(`/pacientes/${id}`)}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-slate-700 dark:text-white transition-colors"
      >
        <ArrowLeft size={18} /> Volver a {paciente.nombre} {paciente.apellido}
      </button>

      <div className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="bg-purple-100/50 dark:bg-slate-950 border-b border-purple-300 dark:border-slate-800 px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 flex items-center gap-3">
              <FileText size={24} /> Entrevista de Admisión
            </h1>
            <p className="text-sm text-slate-900 mt-1 capitalize">
              {paciente.nombre} {paciente.apellido}
            </p>
          </div>
          {autoSaveStatus && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${autoSaveStatus === 'saved' ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
              {autoSaveStatus === 'saving' ? (
                <><Loader2 size={12} className="animate-spin" /> Guardando...</>
              ) : (
                <><CheckCircle2 size={12} /> Guardado automáticamente</>
              )}
            </span>
          )}
        </div>

        <form id="entrevistaForm" ref={formRef} onSubmit={handleSubmit} onChange={handleFormChange} className="p-8 text-sm text-slate-900 dark:text-slate-300 space-y-10 overflow-y-auto">
          <div>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-purple-300 dark:border-slate-800 pb-2">Datos Escolares</h3>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs uppercase font-semibold">Escuela</label><input type="text" name="escuela" defaultValue={entrevista?.escuela} className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs uppercase font-semibold">Cursa</label><input type="text" name="cursa" defaultValue={entrevista?.cursa} className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs uppercase font-semibold">Turno</label><input type="text" name="turno" defaultValue={entrevista?.turno} className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-purple-300 dark:border-slate-800 pb-2">Datos de la Familia</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-purple-100/50 dark:bg-slate-950 p-5 rounded-xl border border-purple-300 dark:border-slate-800 space-y-4">
                <h4 className="text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 font-bold">Datos de la Madre</h4>
                <input type="text" name="madre_nombre" defaultValue={entrevista?.madre_nombre} placeholder="Nombre completo" className="w-full bg-transparent border-b border-purple-300 dark:border-b-slate-700 p-2 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" name="madre_edad" defaultValue={entrevista?.madre_edad} placeholder="Edad" className="w-full bg-transparent border-b border-purple-300 dark:border-b-slate-700 p-2 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" />
                  <input type="text" name="madre_trabajo" defaultValue={entrevista?.madre_trabajo} placeholder="Trabajo" className="w-full bg-transparent border-b border-purple-300 dark:border-b-slate-700 p-2 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" />
                </div>
                <input type="text" name="madre_estudios" defaultValue={entrevista?.madre_estudios} placeholder="Estudios Cursados" className="w-full bg-transparent border-b border-purple-300 dark:border-b-slate-700 p-2 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" />
              </div>
              <div className="bg-purple-100/50 dark:bg-slate-950 p-5 rounded-xl border border-purple-300 dark:border-slate-800 space-y-4">
                <h4 className="text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 font-bold">Datos del Padre</h4>
                <input type="text" name="padre_nombre" defaultValue={entrevista?.padre_nombre} placeholder="Nombre completo" className="w-full bg-transparent border-b border-purple-300 dark:border-b-slate-700 p-2 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" name="padre_edad" defaultValue={entrevista?.padre_edad} placeholder="Edad" className="w-full bg-transparent border-b border-purple-300 dark:border-b-slate-700 p-2 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" />
                  <input type="text" name="padre_trabajo" defaultValue={entrevista?.padre_trabajo} placeholder="Trabajo" className="w-full bg-transparent border-b border-purple-300 dark:border-b-slate-700 p-2 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" />
                </div>
                <input type="text" name="padre_estudios" defaultValue={entrevista?.padre_estudios} placeholder="Estudios Cursados" className="w-full bg-transparent border-b border-purple-300 dark:border-b-slate-700 p-2 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs uppercase font-semibold">Hermanos (Nombres y Edades)</label><textarea name="hermanos" defaultValue={entrevista?.hermanos} rows="2" className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs uppercase font-semibold">¿Viven solos o con otros familiares?</label><textarea name="viven_con" defaultValue={entrevista?.viven_con} rows="2" className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white" /></div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-purple-300 dark:border-slate-800 pb-2">Antecedentes e Hitos del Desarrollo</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs uppercase font-semibold">Perinatales / Parto / Posnatales</label><textarea name="perinatales" defaultValue={entrevista?.perinatales} rows="2" className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs uppercase font-semibold">Antecedentes Familiares</label><textarea name="antecedentes_familiares" defaultValue={entrevista?.antecedentes_familiares} rows="2" className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white" /></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs font-semibold">Sostén cefálico</label><input type="text" name="sosten_cefalico" defaultValue={entrevista?.sosten_cefalico ?? entrevista?.balbuceos} className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs font-semibold">Se sentó a:</label><input type="text" name="sento" defaultValue={entrevista?.sento} className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs font-semibold">Caminó a:</label><input type="text" name="camino" defaultValue={entrevista?.camino} className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs font-semibold">Tomó pecho hasta:</label><input type="text" name="pecho" defaultValue={entrevista?.pecho} className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs font-semibold">Control esfínteres a:</label><input type="text" name="esfinteres" defaultValue={entrevista?.esfinteres} className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs font-semibold">Comida sólida a:</label><input type="text" name="comida_solida" defaultValue={entrevista?.comida_solida} className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div className="col-span-2"><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs font-semibold">Primeras palabras (y cuáles):</label><input type="text" name="primeras_palabras" defaultValue={entrevista?.primeras_palabras} className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-purple-300 dark:border-slate-800 pb-2">Trayectoria Escolar y Apoyos</h3>
            <textarea name="trayectoria" defaultValue={entrevista?.trayectoria} rows="2" placeholder="Detalle de escolaridad..." className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-3 outline-none focus:border-pink-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white" />
            <div className="flex flex-wrap gap-6 bg-purple-100/50 dark:bg-slate-950 p-4 rounded-xl border border-purple-300 dark:border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer font-medium"><input type="checkbox" name="apoyo_acompanante" defaultChecked={entrevista?.apoyo_acompanante} className="accent-pink-500 dark:accent-teal-500 w-4 h-4" /> Acompañante Terapéutico</label>
              <label className="flex items-center gap-2 cursor-pointer font-medium"><input type="checkbox" name="apoyo_maestra" defaultChecked={entrevista?.apoyo_maestra} className="accent-pink-500 dark:accent-teal-500 w-4 h-4" /> Maestra de Inclusión</label>
              <label className="flex items-center gap-2 cursor-pointer font-medium"><input type="checkbox" name="apoyo_die" defaultChecked={entrevista?.apoyo_die} className="accent-pink-500 dark:accent-teal-500 w-4 h-4" /> Dispositivo (DIE)</label>
              <label className="flex items-center gap-2 cursor-pointer font-medium"><input type="checkbox" name="apoyo_adaptaciones" defaultChecked={entrevista?.apoyo_adaptaciones} className="accent-pink-500 dark:accent-teal-500 w-4 h-4" /> Adaptaciones Curriculares</label>
              <label className="flex items-center gap-2 cursor-pointer font-medium"><input type="checkbox" name="apoyo_cud" defaultChecked={entrevista?.apoyo_cud} className="accent-pink-500 dark:accent-teal-500 w-4 h-4" /> Posee CUD</label>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-purple-300 dark:border-slate-800 pb-2">Hábitos y Procesamiento Sensorial</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 font-bold">Hábitos Diarios</h4>
                <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs font-semibold">Alimentación</label><input type="text" name="habito_alimentacion" defaultValue={entrevista?.habito_alimentacion} className="w-full bg-transparent border-b border-purple-300 dark:border-b-slate-700 p-2 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
                <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs font-semibold">Sueño</label><input type="text" name="habito_sueno" defaultValue={entrevista?.habito_sueno} className="w-full bg-transparent border-b border-purple-300 dark:border-b-slate-700 p-2 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
                <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs font-semibold">Aseo y Vestido</label><input type="text" name="habito_aseo" defaultValue={entrevista?.habito_aseo} className="w-full bg-transparent border-b border-purple-300 dark:border-b-slate-700 p-2 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              </div>
              <div className="space-y-4">
                <h4 className="text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 font-bold">Procesamiento Sensorial</h4>
                <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs font-semibold">Táctil / Auditivo / Visual</label><input type="text" name="sensorial_tactil_auditivo_visual" defaultValue={entrevista?.sensorial_tactil_auditivo_visual} className="w-full bg-transparent border-b border-purple-300 dark:border-b-slate-700 p-2 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
                <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs font-semibold">Olfatorio</label><input type="text" name="sensorial_olfatorio" defaultValue={entrevista?.sensorial_olfatorio} className="w-full bg-transparent border-b border-purple-300 dark:border-b-slate-700 p-2 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
                <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs font-semibold">Vestibular (Vértigo)</label><input type="text" name="sensorial_vestibular" defaultValue={entrevista?.sensorial_vestibular} className="w-full bg-transparent border-b border-purple-300 dark:border-b-slate-700 p-2 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-purple-300 dark:border-slate-800 pb-2">Motricidad</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-purple-100/50 dark:bg-slate-950 p-5 rounded-xl border border-purple-300 dark:border-slate-800">
              <div className="space-y-3">
                <p className="text-slate-900 dark:text-slate-400 text-sm font-bold mb-2">Motricidad Gruesa</p>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-300">¿Es acorde a la edad?</span>
                  <label className="flex items-center gap-1.5 text-sm font-medium"><input type="radio" name="motricidad_acorde_edad" value="si" defaultChecked={entrevista?.motricidad_acorde_edad === 'si'} className="accent-pink-500 dark:accent-teal-500 w-4 h-4" /> Sí</label>
                  <label className="flex items-center gap-1.5 text-sm font-medium"><input type="radio" name="motricidad_acorde_edad" value="no" defaultChecked={entrevista?.motricidad_acorde_edad === 'no'} className="accent-pink-500 dark:accent-teal-500 w-4 h-4" /> No</label>
                </div>
                <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" name="motricidad_dificultad_peso" defaultChecked={entrevista?.motricidad_dificultad_peso} className="accent-pink-500 dark:accent-teal-500 w-4 h-4" /> Dificultad para agarrar objetos pesados</label>
                <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" name="motricidad_coordinado" defaultChecked={entrevista?.motricidad_coordinado} className="accent-pink-500 dark:accent-teal-500 w-4 h-4" /> Movimientos coordinados</label>
              </div>
              <div className="space-y-3">
                <p className="text-slate-900 dark:text-slate-400 text-sm font-bold mb-2">Motricidad Fina</p>
                <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" name="motricidad_pinza" defaultChecked={entrevista?.motricidad_pinza} className="accent-pink-500 dark:accent-teal-500 w-4 h-4" /> Pinza fina / Toma el lápiz en pinza</label>
                <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" name="motricidad_pinta_bien" defaultChecked={entrevista?.motricidad_pinta_bien} className="accent-pink-500 dark:accent-teal-500 w-4 h-4" /> Pinta bien / Sin salirse del contorno</label>
                <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" name="motricidad_tijera" defaultChecked={entrevista?.motricidad_tijera} className="accent-pink-500 dark:accent-teal-500 w-4 h-4" /> Dificultad para cortar con tijera</label>
                <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" name="motricidad_botones" defaultChecked={entrevista?.motricidad_botones} className="accent-pink-500 dark:accent-teal-500 w-4 h-4" /> Abrocha botones</label>
                <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" name="motricidad_cierres" defaultChecked={entrevista?.motricidad_cierres} className="accent-pink-500 dark:accent-teal-500 w-4 h-4" /> Cierra y abre cierres</label>
                <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" name="motricidad_cordones" defaultChecked={entrevista?.motricidad_cordones} className="accent-pink-500 dark:accent-teal-500 w-4 h-4" /> Ata cordones</label>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-purple-300 dark:border-slate-800 pb-2">Socialización, Juego y Rutina</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs uppercase font-semibold">Socialización y Juego</label><textarea name="socializacion" defaultValue={entrevista?.socializacion} rows="2" className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs uppercase font-semibold">Uso de pantallas (Celular/PC)</label><textarea name="pantallas" defaultValue={entrevista?.pantallas} rows="2" className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs uppercase font-semibold">Miedos</label><input type="text" name="miedos" defaultValue={entrevista?.miedos} className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs uppercase font-semibold">¿Qué le gusta hacer?</label><input type="text" name="gusta_hacer" defaultValue={entrevista?.gusta_hacer} className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs uppercase font-semibold">¿Qué le disgusta?</label><input type="text" name="disgusta" defaultValue={entrevista?.disgusta} className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div className="col-span-2"><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs uppercase font-semibold">Tareas escolares (¿Solo o con ayuda? ¿Lugar propio?)</label><input type="text" name="tareas_escolares" defaultValue={entrevista?.tareas_escolares} className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div className="col-span-2"><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs uppercase font-semibold">Describir cómo es un día de su vida</label><textarea name="dia_de_vida" defaultValue={entrevista?.dia_de_vida} rows="2" className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white" /></div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-purple-300 dark:border-slate-800 pb-2">Conducta y Observaciones Clínicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-purple-100/50 dark:bg-slate-950 p-4 rounded-xl border border-purple-300 dark:border-slate-800">
                <label className="text-slate-900 font-bold dark:text-slate-500 text-xs uppercase font-semibold block mb-3">Conducta</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['conducta_desafiante', 'Desafiante'],
                    ['conducta_tranquilo', 'Tranquilo/a'],
                    ['conducta_inquieto', 'Inquieto/a'],
                    ['conducta_desobediente', 'Desobediente'],
                    ['conducta_ansioso', 'Ansioso/a'],
                    ['conducta_autolesiona', 'Se auto lesiona'],
                  ].map(([name, label]) => (
                    <label key={name} className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-300">
                      <input type="checkbox" name={name} defaultChecked={entrevista?.[name]} className="accent-pink-500 dark:accent-teal-500 w-4 h-4" /> {label}
                    </label>
                  ))}
                </div>
              </div>
              <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs uppercase font-semibold">Observaciones</label><textarea name="observaciones" defaultValue={entrevista?.observaciones} rows="4" placeholder="Observaciones generales del profesional..." className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs uppercase font-semibold">Intervenciones y Hospitalizaciones</label><textarea name="intervenciones" defaultValue={entrevista?.intervenciones} rows="4" placeholder="Cirugías, internaciones, intervenciones previas..." className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white" /></div>
              <div className="space-y-2">
                <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs uppercase font-semibold">Controles de Salud</label><textarea name="controles_salud" defaultValue={entrevista?.controles_salud} rows="2" placeholder="Médico de cabecera, especialistas, controles periódicos..." className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white" /></div>
                <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs uppercase font-semibold">Tratamientos Anteriores</label><textarea name="tratamientos_anteriores" defaultValue={entrevista?.tratamientos_anteriores} rows="2" placeholder="Tratamientos previos, profesionales, duración..." className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white" /></div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-purple-300 dark:border-slate-800 pb-2">Lenguaje y Comunicación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs uppercase font-semibold">Primeras palabras</label><input type="text" name="lenguaje_primeras_palabras" defaultValue={entrevista?.lenguaje_primeras_palabras} placeholder="Ej: alrededor de los 12 meses..." className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 font-bold dark:text-pink-600 dark:text-slate-500 text-xs uppercase font-semibold">Dificultades</label><textarea name="lenguaje_dificultades" defaultValue={entrevista?.lenguaje_dificultades} rows="3" placeholder="Dificultades en la comunicación y el lenguaje..." className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white" /></div>
            </div>
          </section>

          <section className="space-y-4 bg-pink-100/50 dark:bg-teal-900/10 p-5 rounded-xl border border-purple-300 dark:border-teal-900/30">
            <h3 className="text-lg font-bold text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 border-b border-purple-300 dark:border-teal-900/30 pb-2">Encuadre Profesional</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-slate-900 dark:text-slate-400 text-xs font-semibold">Día de sesión pautado</label><input type="text" name="encuadre_dia" defaultValue={entrevista?.encuadre_dia} className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 dark:text-slate-400 text-xs font-semibold">Horario pautado</label><input type="text" name="encuadre_horario" defaultValue={entrevista?.encuadre_horario} className="w-full border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-pink-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
            </div>
          </section>

          </div>{/* fin printRef */}
        </form>

        {driveMsg && (
          <div className={`mx-8 mb-2 px-4 py-2 rounded-lg text-sm font-medium print:hidden ${driveMsg.tipo === 'ok' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
            {driveMsg.texto}
          </div>
        )}

        <div className="border-t border-purple-300 dark:border-slate-800 bg-purple-100/50 dark:bg-slate-950 px-8 py-5 flex items-center justify-between gap-4 print:hidden">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-purple-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-700 font-semibold text-sm transition-all"
            >
              <Printer size={16} /> Imprimir
            </button>
            <button
              type="button"
              onClick={handleSubirDrive}
              disabled={uploadingDrive}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-purple-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-700 font-semibold text-sm transition-all disabled:opacity-60"
            >
              {uploadingDrive ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploadingDrive ? 'Subiendo...' : 'Subir a Drive'}
            </button>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(`/pacientes/${id}`)}
              disabled={submitting}
              className="px-6 py-2.5 font-bold text-slate-900 hover:text-slate-700 dark:text-white transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="entrevistaForm"
              disabled={submitting}
              className="bg-pink-500 dark:bg-teal-600 hover:bg-pink-400 dark:hover:bg-teal-500 text-slate-900 dark:text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-pink-500/20 dark:shadow-teal-500/20 transition-all disabled:opacity-50"
            >
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









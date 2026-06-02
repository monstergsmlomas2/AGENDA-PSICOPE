import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TimePicker from '../components/ui/TimePicker';
import { getPacienteById, actualizarPaciente, getSesiones } from '../services/pacientesService';
import { getEvaluaciones, eliminarEvaluacion } from '../services/evaluacionesService';
import { getInformes, getInforme, crearInforme, actualizarInforme, eliminarInforme } from '../services/informesService';
import { getObrasSociales } from '../services/obrasSocialesService';
import { getTurnos, crearTurno, actualizarTurno, eliminarTurno } from '../services/turnosService';
import { getConsultorios } from '../services/consultoriosService';
import {
  ArrowLeft, FileText, ClipboardList, ClipboardCheck, User, Phone, Mail, MapPin,
  Calendar, ShieldCheck, Trash2, Edit, Eye, Plus, Star, Check, X, Clock, CalendarPlus,
  Paperclip, Upload, ExternalLink, File, Image, Loader2, CheckCircle, Printer, AlertTriangle, BookOpen
} from 'lucide-react';
import { getDriveStatus, getDriveAuthUrl, disconnectDrive, getArchivos, subirArchivo, eliminarArchivo } from '../services/driveService';
import { getTestsFiltrados } from '../data/testsEstandarizados';
import TestModal from '../components/TestModal';
import { useToast, Button } from '../components/ui';
import { useConfirm } from '../hooks/useConfirm';

const calcularEdad = (fechaNac) => {
  if (!fechaNac) return null;
  const hoy = new Date();
  const nac = new Date(fechaNac);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad >= 0 ? edad : null;
};

const avatarColors = [
  'bg-teal-500/20 text-teal-400',
  'bg-blue-500/20 text-blue-400',
  'bg-purple-500/20 text-purple-400',
  'bg-amber-500/20 text-amber-700 dark:text-amber-400',
  'bg-pink-500/20 text-pink-400',
  'bg-emerald-500/20 text-emerald-400',
];


const getAvatarColor = (str) => {
  if (!str) return avatarColors[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

const getIniciales = (nombre, apellido) =>
  ((nombre || '')[0] || '') + ((apellido || '')[0] || '');

function EditarPacienteModal({ show, onClose, paciente, onSaved }) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, setDni] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [sexo, setSexo] = useState("");
  const [domicilio, setDomicilio] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [obraSocial, setObraSocial] = useState("");
  const [nroAfiliado, setNroAfiliado] = useState("");
  const [motivo, setMotivo] = useState("");
  const [derivadaPor, setDerivadaPor] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [cud, setCud] = useState("");
  const [contactoEmergencia, setContactoEmergencia] = useState("");
  const [obrasSocialesList, setObrasSocialesList] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  useEffect(() => {
    if (show && paciente) {
      setNombre(paciente.nombre || "");
      setApellido(paciente.apellido || "");
      setDni(paciente.dni || "");
      setFechaNacimiento(paciente.fecha_nacimiento ? paciente.fecha_nacimiento.split('T')[0] : "");
      setSexo(paciente.sexo || "");
      setDomicilio(paciente.domicilio || "");
      setTelefono(paciente.telefono || "");
      setEmail(paciente.email || "");
      setObraSocial(paciente.obra_social || "");
      setNroAfiliado(paciente.nro_afiliado || "");
      setMotivo(paciente.motivo_consulta || paciente.motivo || "");
      setDerivadaPor(paciente.derivada_por || "");
      setDiagnostico(paciente.diagnostico || "");
      setCud(paciente.cud || "");
      setContactoEmergencia(paciente.contacto_emergencia || "");
    }
  }, [show, paciente]);

  useEffect(() => {
    getObrasSociales().then(data => setObrasSocialesList(Array.isArray(data) ? data : []));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await actualizarPaciente(paciente.id, {
        nombre, apellido, dni, telefono, motivo,
        derivada_por: derivadaPor, diagnostico, cud,
        fecha_nacimiento: fechaNacimiento, sexo, domicilio, email,
        obra_social: obraSocial, nro_afiliado: nroAfiliado,
        contacto_emergencia: contactoEmergencia,
      });
      toast.success('Paciente actualizado', 'Los datos se guardaron correctamente.');
      onClose();
      onSaved();
    } catch {
      toast.error('Error', 'No se pudieron guardar los datos.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg mx-auto max-h-screen sm:max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-300 dark:border-slate-800">
            <div className="border-b border-purple-300 dark:border-slate-800 bg-purple-100/50 dark:bg-slate-950 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0 gap-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Editar Paciente</h2>
            <p className="text-sm mt-1 text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400">Datos de identificación y administrativos.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-pink-200 dark:bg-slate-800 text-slate-900 dark:text-slate-400 transition-colors">✕</button>
        </div>
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 text-sm">
          <form id="editPacienteForm" onSubmit={handleSubmit} className="space-y-8">
            <section>
              <h3 className="text-lg font-bold text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 flex items-center gap-2 mb-6 border-b border-teal-100 dark:border-teal-900/30 pb-2">
                <User size={20} /> Datos Administrativos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2 font-semibold text-slate-900 dark:text-slate-400">Nombre Completo</label>
                  <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required
                    className="w-full rounded-xl p-3 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500" />
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-slate-900 dark:text-slate-400">Apellidos</label>
                  <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} required
                    className="w-full rounded-xl p-3 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500" />
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-slate-900 dark:text-slate-400">Documento (DNI)</label>
                  <input type="text" value={dni} onChange={(e) => setDni(e.target.value)} required
                    className="w-full rounded-xl p-3 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500" />
                </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-2 font-semibold text-slate-900 dark:text-slate-400">Nacimiento</label>
                    <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)}
                      className="w-full rounded-xl p-3 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500 dark:[&::-webkit-calendar-picker-indicator]:invert" />
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold text-slate-900 dark:text-slate-400">Edad</label>
                    <div className="w-full rounded-xl p-3 border border-purple-300 dark:border-slate-800 bg-purple-100/50 dark:bg-slate-900 text-slate-900 dark:text-slate-300 min-h-[46px]">
                      {calcularEdad(fechaNacimiento) !== null ? `${calcularEdad(fechaNacimiento)} años` : <span className="text-slate-900 dark:text-slate-600 text-xs">—</span>}
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold text-slate-900 dark:text-slate-400">Sexo</label>
                    <select value={sexo} onChange={(e) => setSexo(e.target.value)}
                      className="w-full rounded-xl p-3 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500">
                      <option value="">Seleccionar</option>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                      <option value="X">Otro</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-slate-900 dark:text-slate-400">Domicilio Actual</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500 dark:text-slate-500" size={18} />
                    <input type="text" value={domicilio} onChange={(e) => setDomicilio(e.target.value)}
                      className="w-full rounded-xl p-3 pl-10 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-semibold text-slate-900 dark:text-slate-400">Teléfono</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500 dark:text-slate-500" size={18} />
                      <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)}
                        className="w-full rounded-xl p-3 pl-10 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold text-slate-900 dark:text-slate-400">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500 dark:text-slate-500" size={18} />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl p-3 pl-10 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-slate-900 dark:text-slate-400">Cobertura Médica</label>
                  <select value={obraSocial} onChange={(e) => setObraSocial(e.target.value)}
                    className="w-full rounded-xl p-3 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500">
                    <option value="">Particular</option>
                    <option value="Obra Social">Obra Social</option>
                    {obrasSocialesList.filter(os => os.nombre !== 'Obra Social').map(os => (
                      <option key={os.id} value={os.nombre}>{os.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-slate-900 dark:text-slate-400">Nº de Afiliado</label>
                  <input type="text" value={nroAfiliado} onChange={(e) => setNroAfiliado(e.target.value)} disabled={!obraSocial}
                    className="w-full rounded-xl p-3 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500 disabled:opacity-50" />
                </div>
                <div className="md:col-span-2 mt-2">
                  <label className="block mb-2 font-semibold text-slate-900 dark:text-slate-400">Motivo de Consulta Breve</label>
                  <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows="2"
                    className="w-full rounded-xl p-3 outline-none transition-colors resize-none border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500" />
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-slate-900 dark:text-slate-400">Derivada por</label>
                  <input type="text" value={derivadaPor} onChange={(e) => setDerivadaPor(e.target.value)}
                    className="w-full rounded-xl p-3 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500" />
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-slate-900 dark:text-slate-400">CUD</label>
                  <input type="text" value={cud} onChange={(e) => setCud(e.target.value)}
                    className="w-full rounded-xl p-3 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-2 font-semibold text-slate-900 dark:text-slate-400">Diagnóstico</label>
                  <textarea value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} rows="2"
                    className="w-full rounded-xl p-3 outline-none transition-colors resize-none border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500" />
                </div>
                <div className="md:col-span-2 p-4 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20">
                  <label className="block mb-2 font-semibold text-red-600 dark:text-red-500">Contacto de Emergencia</label>
                  <input type="text" value={contactoEmergencia} onChange={(e) => setContactoEmergencia(e.target.value)}
                    placeholder="Nombre y teléfono..." className="w-full rounded-xl p-3 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500" />
                </div>
              </div>
            </section>
          </form>
        </div>
        <div className="border-t border-purple-300 dark:border-slate-800 bg-purple-100/50 dark:bg-slate-950 px-4 sm:px-6 py-4 flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose}
            className="px-6 py-2.5 font-bold rounded-xl transition-colors text-slate-900 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-pink-200 dark:bg-slate-800"
            disabled={submitting}>Cancelar</button>
          <Button type="submit" form="editPacienteForm" loading={submitting}>Guardar Cambios</Button>
        </div>
      </div>
    </div>
  );
}
const tiposInforme = [
  { value: 'diagnostico', label: 'Informe Diagnóstico Psicopedagógico' },
  { value: 'evolucion', label: 'Informe de Evolución (periódico)' },
  { value: 'escolar', label: 'Informe Escolar (para docentes/directivos)' },
  { value: 'obra_social', label: 'Informe para Obra Social' },
  { value: 'derivacion', label: 'Derivación a otro profesional' },
  { value: 'asistencia', label: 'Certificado de Asistencia' },
];

const seccionesPorTipo = {
  diagnostico: [
    { key: 'motivo_consulta', label: 'Motivo de Consulta' },
    { key: 'tecnicas_administradas', label: 'Técnicas Administradas' },
    { key: 'resultados_obtenidos', label: 'Resultados Obtenidos' },
    { key: 'diagnostico_presuntivo', label: 'Diagnóstico Presuntivo' },
    { key: 'orientaciones', label: 'Orientaciones y Sugerencias' },
  ],
  evolucion: [
    { key: 'periodo', label: 'Período' },
    { key: 'objetivos_trabajados', label: 'Objetivos Trabajados' },
    { key: 'logros_alcanzados', label: 'Logros Alcanzados' },
    { key: 'aspectos_continuar', label: 'Aspectos a Continuar Trabajando' },
    { key: 'conclusiones', label: 'Conclusiones' },
  ],
  escolar: [
    { key: 'datos_institucionales', label: 'Datos Institucionales' },
    { key: 'desempenio_academico', label: 'Desempeño Académico' },
    { key: 'aspectos_conductuales', label: 'Aspectos Conductuales' },
    { key: 'recomendaciones', label: 'Recomendaciones Pedagógicas' },
  ],
  obra_social: [
    { key: 'diagnostico', label: 'Diagnóstico / CIE' },
    { key: 'justificacion', label: 'Justificación de Sesiones' },
    { key: 'frecuencia', label: 'Frecuencia y Duración' },
    { key: 'objetivos_terapeuticos', label: 'Objetivos Terapéuticos' },
  ],
  derivacion: [
    { key: 'motivo_derivacion', label: 'Motivo de Derivación' },
    { key: 'profesional_sugerido', label: 'Profesional Sugerido' },
    { key: 'antecedentes', label: 'Antecedentes Relevantes' },
  ],
  asistencia: [
    { key: 'periodo_asistencia', label: 'Período de Asistencia' },
    { key: 'frecuencia_asistencia', label: 'Frecuencia' },
    { key: 'observaciones_asistencia', label: 'Observaciones' },
  ],
};

export default function PacienteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm, ConfirmModal } = useConfirm();

  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tab activo: 'sesiones' | 'evaluaciones' | null
  const [tabActivo, setTabActivo] = useState(null);

  // Editar paciente modal
  const [showEditPaciente, setShowEditPaciente] = useState(false);

  // Sesiones
  const [sesiones, setSesiones] = useState([]);
  const [loadingSesiones, setLoadingSesiones] = useState(false);

  // Evaluaciones
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loadingEvaluaciones, setLoadingEvaluaciones] = useState(false);

  // Turnos
  const [turnos, setTurnos] = useState([]);
  const [loadingTurnos, setLoadingTurnos] = useState(false);
  const [consultorios, setConsultorios] = useState([]);
  const [editandoTurno, setEditandoTurno] = useState(null);
  const [turnoForm, setTurnoForm] = useState({});
  const [showNuevoTurno, setShowNuevoTurno] = useState(false);
  const [nuevoTurnoForm, setNuevoTurnoForm] = useState({ fecha: '', hora: '', consultorio: '', observaciones: '', estado: 'pendiente' });
  const [recurrenciaTurno, setRecurrenciaTurno] = useState('');
  const [submittingTurno, setSubmittingTurno] = useState(false);
  const [turnoFormErrors, setTurnoFormErrors] = useState({});
  const [modoSeleccionTurnos, setModoSeleccionTurnos] = useState(false);
  const [turnosSeleccionados, setTurnosSeleccionados] = useState(new Set());

  // Turno rápido (Próximo turno)
  const [showTurnoRapido, setShowTurnoRapido] = useState(false);
  const [turnoRapidoForm, setTurnoRapidoForm] = useState({ fecha: '', hora: '', consultorio: '', notas: '' });
  const [submittingTurnoRapido, setSubmittingTurnoRapido] = useState(false);

  // Informes
  const [showInformes, setShowInformes] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [testsFiltroEdad, setTestsFiltroEdad] = useState(true);
  const [testsFiltroMotivo, setTestsFiltroMotivo] = useState(true);
  const [testModal, setTestModal] = useState(null);
  const [testModalColor, setTestModalColor] = useState('blue');
  const [informesPaciente, setInformesPaciente] = useState([]);
  const [loadingInformes, setLoadingInformes] = useState(false);
  const [showInformeModal, setShowInformeModal] = useState(false);
  const [editandoInforme, setEditandoInforme] = useState(null);
  const [viewingInforme, setViewingInforme] = useState(null);
  const [informeTipo, setInformeTipo] = useState('diagnostico');
  const [informeFecha, setInformeFecha] = useState(new Date().toISOString().split('T')[0]);
  const [informeContenido, setInformeContenido] = useState({});
  const [informeEstado, setInformeEstado] = useState('borrador');
  const [submittingInforme, setSubmittingInforme] = useState(false);

  // Archivos adjuntos (Google Drive) — compartido entre secciones
  const [showAdjuntos, setShowAdjuntos] = useState(false);
  const [driveConnected, setDriveConnected] = useState(null);
  // Estado por sección: { 'Archivos': [], 'Sesiones': [], 'Evaluaciones': [], 'Informes': [] }
  const [archivosPorSeccion, setArchivosPorSeccion] = useState({});
  const [cargandoPorSeccion, setCargandoPorSeccion] = useState({});
  const [subiendoPorSeccion, setSubiendoPorSeccion] = useState({});
  const [dragOverSeccion, setDragOverSeccion] = useState({});
  const fileInputRefs = useRef({});

  const estadoTurnoConfig = {
    pendiente:    { label: 'Pendiente',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/30' },
    confirmado:   { label: 'Confirmado',   color: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-200 dark:border-green-500/30' },
    inasistencia: { label: 'Inasistencia', color: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/30' },
    cancelado:    { label: 'Cancelado',    color: 'bg-slate-100 text-slate-900 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-500/30' },
  };

  const cargarPaciente = async () => {
    setLoading(true);
    try {
      const data = await getPacienteById(id);
      setPaciente(data);
    } catch {
      toast.error('Error', 'No se pudo cargar el paciente.');
    } finally {
      setLoading(false);
    }
  };

  const cargarSesiones = async () => {
    setLoadingSesiones(true);
    try {
      const data = await getSesiones(id);
      setSesiones(Array.isArray(data) ? data : []);
    } catch {
      // silent
    } finally {
      setLoadingSesiones(false);
    }
  };

  const cargarEvaluaciones = async () => {
    setLoadingEvaluaciones(true);
    try {
      const data = await getEvaluaciones(id);
      setEvaluaciones(Array.isArray(data) ? data : []);
    } catch {
      // silent
    } finally {
      setLoadingEvaluaciones(false);
    }
  };

  useEffect(() => {
    cargarPaciente();
    cargarSesiones();
  }, [id]);

  useEffect(() => {
    if (tabActivo === 'sesiones') { cargarSesiones(); cargarArchivosPorSeccion('Sesiones'); }
  }, [tabActivo]);

  useEffect(() => {
    if (tabActivo === 'evaluaciones') { cargarEvaluaciones(); cargarArchivosPorSeccion('Evaluaciones'); }
  }, [tabActivo]);

  const cargarInformes = async () => {
    setLoadingInformes(true);
    try {
      const data = await getInformes(id);
      setInformesPaciente(Array.isArray(data) ? data : []);
    } catch {
      // silent
    } finally {
      setLoadingInformes(false);
    }
  };

  useEffect(() => {
    if (showInformes) { cargarInformes(); cargarArchivosPorSeccion('Informes'); }
  }, [showInformes]);

  const cargarTurnos = async () => {
    setLoadingTurnos(true);
    try {
      const [dataTurnos, dataConsultorios] = await Promise.all([
        getTurnos({ paciente_id: id }),
        getConsultorios(),
      ]);
      setTurnos(Array.isArray(dataTurnos) ? dataTurnos : []);
      setConsultorios(Array.isArray(dataConsultorios) ? dataConsultorios : []);
    } finally {
      setLoadingTurnos(false);
    }
  };

  useEffect(() => {
    if (tabActivo === 'turnos' || tabActivo === 'sesiones') cargarTurnos();
  }, [tabActivo]);

  const handleGuardarTurno = async () => {
    if (!turnoForm.fecha || !turnoForm.hora || !turnoForm.consultorio) {
      toast.error('Error', 'Fecha, hora y consultorio son obligatorios.');
      return;
    }
    setSubmittingTurno(true);
    try {
      const base = {
        paciente_id: id,
        hora: turnoForm.hora,
        consultorio: turnoForm.consultorio,
        observaciones: turnoForm.observaciones || '',
        estado: turnoForm.estado,
        tipo_cobertura: editandoTurno.tipo_cobertura,
      };
      await actualizarTurno(editandoTurno.id, { ...base, fecha: turnoForm.fecha });
      if (recurrenciaTurno) {
        const meses = parseInt(recurrenciaTurno);
        const fechaBase = new Date(turnoForm.fecha + 'T12:00:00Z');
        const fechaLimite = new Date(fechaBase);
        fechaLimite.setMonth(fechaLimite.getMonth() + meses);
        const fechas = [];
        const cur = new Date(fechaBase);
        cur.setDate(cur.getDate() + 7);
        while (cur <= fechaLimite) {
          fechas.push(cur.toISOString().slice(0, 10));
          cur.setDate(cur.getDate() + 7);
        }
        await Promise.all(fechas.map(f => crearTurno({ ...base, fecha: f })));
        toast.success('Turno actualizado y repetido', `Se guardó el turno y se crearon ${fechas.length} turnos adicionales.`);
      } else {
        toast.success('Turno actualizado', '');
      }
      setEditandoTurno(null);
      setRecurrenciaTurno('');
      await cargarTurnos();
    } catch {
      toast.error('Error', 'No se pudo actualizar el turno.');
    } finally {
      setSubmittingTurno(false);
    }
  };

  const handleEliminarTurno = async (turno) => {
    const ok = await confirm({
      title: 'Eliminar turno',
      message: `¿Eliminás el turno del ${new Date(turno.fecha + 'T12:00:00').toLocaleDateString('es-AR')} a las ${turno.hora?.slice(0, 5)}?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    await eliminarTurno(turno.id);
    await cargarTurnos();
    toast.success('Turno eliminado', '');
  };

  const handleEliminarTurnosSeleccionados = async () => {
    const cantidad = turnosSeleccionados.size;
    const ok = await confirm({
      title: 'Eliminar turnos',
      message: `¿Estás segura de que querés eliminar ${cantidad} turno${cantidad > 1 ? 's' : ''}? Esta acción no se puede deshacer.`,
      confirmLabel: `Eliminar ${cantidad} turno${cantidad > 1 ? 's' : ''}`,
      variant: 'danger',
    });
    if (!ok) return;
    await Promise.all([...turnosSeleccionados].map(tid => eliminarTurno(tid)));
    setTurnosSeleccionados(new Set());
    setModoSeleccionTurnos(false);
    await cargarTurnos();
    toast.success('Turnos eliminados', `Se eliminaron ${cantidad} turno${cantidad > 1 ? 's' : ''}.`);
  };

  const handleCrearTurno = async () => {
    const errors = {};
    if (!nuevoTurnoForm.fecha) errors.fecha = true;
    if (!nuevoTurnoForm.hora) errors.hora = true;
    if (!nuevoTurnoForm.consultorio) errors.consultorio = true;
    if (Object.keys(errors).length > 0) { setTurnoFormErrors(errors); return; }
    setSubmittingTurno(true);
    try {
      const tipo_cobertura = paciente?.obra_social ? 'obra_social' : 'particular';
      const base = {
        paciente_id: id,
        hora: nuevoTurnoForm.hora,
        consultorio: nuevoTurnoForm.consultorio,
        observaciones: nuevoTurnoForm.observaciones || '',
        estado: nuevoTurnoForm.estado,
        tipo_cobertura,
      };
      if (recurrenciaTurno) {
        const meses = parseInt(recurrenciaTurno);
        const fechaBase = new Date(nuevoTurnoForm.fecha + 'T12:00:00Z');
        const fechaLimite = new Date(fechaBase);
        fechaLimite.setMonth(fechaLimite.getMonth() + meses);
        const fechas = [];
        const cur = new Date(fechaBase);
        while (cur <= fechaLimite) {
          fechas.push(cur.toISOString().slice(0, 10));
          cur.setDate(cur.getDate() + 7);
        }
        await Promise.all(fechas.map(f => crearTurno({ ...base, fecha: f })));
        toast.success('Turnos recurrentes creados', `Se agendaron ${fechas.length} turnos semanales.`);
      } else {
        await crearTurno({ ...base, fecha: nuevoTurnoForm.fecha });
        toast.success('Turno creado', '');
      }
      setShowNuevoTurno(false);
      setNuevoTurnoForm({ fecha: '', hora: '', consultorio: '', observaciones: '', estado: 'pendiente' });
      setRecurrenciaTurno('');
      setTurnoFormErrors({});
      await cargarTurnos();
    } catch {
      toast.error('Error', 'No se pudo crear el turno.');
    } finally {
      setSubmittingTurno(false);
    }
  };

  const handleAbrirTurnoRapido = () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let ultimoTurno = null;
    if (turnos.length > 0) {
      const sorted = [...turnos].sort((a, b) => new Date(b.fecha + 'T12:00:00') - new Date(a.fecha + 'T12:00:00'));
      ultimoTurno = sorted[0];
    }

    const fechaBase = ultimoTurno ? new Date(ultimoTurno.fecha + 'T12:00:00') : new Date();
    fechaBase.setDate(fechaBase.getDate() + 7);
    const fechaStr = fechaBase.toISOString().slice(0, 10);

    const horaDefault = ultimoTurno?.hora?.slice(0, 5) || '09:00';
    const consultorioDefault = ultimoTurno?.consultorio || (consultorios.length > 0 ? consultorios[0].nombre : '');

    setTurnoRapidoForm({
      fecha: fechaStr,
      hora: horaDefault,
      consultorio: consultorioDefault,
      notas: '',
    });
    setShowTurnoRapido(true);
  };

  const handleGuardarTurnoRapido = async () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaIngresada = new Date(turnoRapidoForm.fecha + 'T12:00:00');

    if (!turnoRapidoForm.fecha || fechaIngresada < hoy) {
      toast.error('Error', 'La fecha no puede ser anterior a hoy.');
      return;
    }
    if (!turnoRapidoForm.hora) {
      toast.error('Error', 'La hora es obligatoria.');
      return;
    }
    if (!turnoRapidoForm.consultorio) {
      toast.error('Error', 'El consultorio es obligatorio.');
      return;
    }

    setSubmittingTurnoRapido(true);
    try {
      const tipo_cobertura = paciente?.obra_social ? 'obra_social' : 'particular';
      await crearTurno({
        paciente_id: id,
        fecha: turnoRapidoForm.fecha,
        hora: turnoRapidoForm.hora,
        consultorio: turnoRapidoForm.consultorio,
        observaciones: turnoRapidoForm.notas || '',
        estado: 'pendiente',
        tipo_cobertura,
      });
      toast.success('Turno creado', `Turno creado para ${new Date(turnoRapidoForm.fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}`);
      setShowTurnoRapido(false);
      await cargarTurnos();
    } catch {
      toast.error('Error', 'No se pudo crear el turno rápido.');
    } finally {
      setSubmittingTurnoRapido(false);
    }
  };


  const verificarDrive = async () => {
    if (driveConnected !== null) return driveConnected;
    const status = await getDriveStatus();
    const connected = status?.connected ?? false;
    setDriveConnected(connected);
    return connected;
  };

  // Abre el panel "Archivos" legacy
  const handleAbrirAdjuntos = async () => {
    const next = !showAdjuntos;
    setShowAdjuntos(next);
    if (next) await cargarArchivosPorSeccion('Archivos');
  };

  const handleConectarDrive = async () => {
    const data = await getDriveAuthUrl();
    if (data?.url) window.location.href = data.url;
  };

  const cargarArchivosPorSeccion = async (seccion) => {
    const connected = await verificarDrive();
    if (!connected) return;
    setCargandoPorSeccion(prev => ({ ...prev, [seccion]: true }));
    const data = await getArchivos(id, seccion);
    setArchivosPorSeccion(prev => ({ ...prev, [seccion]: Array.isArray(data) ? data : [] }));
    setCargandoPorSeccion(prev => ({ ...prev, [seccion]: false }));
  };

  const handleSeleccionarArchivoSeccion = async (seccion, file) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Error', 'El archivo supera los 10 MB.');
      return;
    }
    setSubiendoPorSeccion(prev => ({ ...prev, [seccion]: true }));
    try {
      const resultado = await subirArchivo(id, file, { seccion });
      if (resultado) {
        await cargarArchivosPorSeccion(seccion);
        toast.success('Archivo subido', resultado.name);
      } else {
        toast.error('Error', 'No se pudo subir el archivo.');
      }
    } finally {
      setSubiendoPorSeccion(prev => ({ ...prev, [seccion]: false }));
    }
  };

  const handleSubirArchivo = (file) => handleSeleccionarArchivoSeccion('Archivos', file);

  const handleEliminarArchivoSeccion = async (seccion, archivo) => {
    const ok = await confirm({
      title: 'Eliminar archivo',
      message: `¿Eliminás "${archivo.name}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    await eliminarArchivo(id, archivo.id);
    setArchivosPorSeccion(prev => ({
      ...prev,
      [seccion]: (prev[seccion] || []).filter(a => a.id !== archivo.id),
    }));
    toast.success('Archivo eliminado', '');
  };

  const handlePickerDriveSeccion = async (seccion) => {
    const data = await getDriveToken();
    if (!data?.access_token) {
      toast.error('Error', 'No se pudo obtener el token de Drive.');
      return;
    }
    const accessToken = data.access_token;
    const loadPicker = () => {
      window.gapi.load('picker', () => {
        const picker = new window.google.picker.PickerBuilder()
          .addView(new window.google.picker.DocsView()
            .setIncludeFolders(false)
            .setSelectFolderEnabled(false))
          .setOAuthToken(accessToken)
          .setCallback(async (pickerData) => {
            if (pickerData.action === window.google.picker.Action.PICKED) {
              const doc = pickerData.docs[0];
              try {
                const res = await fetch(`/drive/vincular/${id}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await import('../services/authService.js')).getToken()}`,
                  },
                  body: JSON.stringify({ fileId: doc.id, fileName: doc.name, mimeType: doc.mimeType, seccion }),
                });
                if (res.ok) {
                  toast.success('Archivo vinculado', doc.name);
                  await cargarArchivosPorSeccion(seccion);
                } else {
                  toast.error('Error', 'No se pudo vincular el archivo.');
                }
              } catch {
                toast.error('Error', 'No se pudo vincular el archivo.');
              }
            }
          })
          .build();
        picker.setVisible(true);
      });
    };
    if (window.gapi) loadPicker();
    else toast.error('Error', 'La API de Google no está disponible. Recargá la página.');
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return <FileText size={18} className="text-red-500" />;
    if (mimeType?.includes('image')) return <Image size={18} className="text-green-500" />;
    if (mimeType?.includes('word') || mimeType?.includes('document')) return <FileText size={18} className="text-blue-500" />;
    return <File size={18} className="text-slate-400" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderDrivePanel = (seccion) => {
    const archivosSeccion = archivosPorSeccion[seccion] || [];
    const cargando = cargandoPorSeccion[seccion] || false;
    const subiendo = subiendoPorSeccion[seccion] || false;
    const dragOverActivo = dragOverSeccion[seccion] || false;
    if (!fileInputRefs.current[seccion]) fileInputRefs.current[seccion] = null;

    if (driveConnected === false) {
      return (
        <div className="mt-4 flex flex-col items-center gap-2 py-5 px-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl text-center">
          <Paperclip size={22} className="text-blue-400" />
          <p className="text-blue-700 dark:text-blue-300 font-semibold text-sm">Conectá Google Drive para adjuntar archivos</p>
          <button onClick={handleConectarDrive} className="mt-1 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-sm">
            Conectar Drive
          </button>
        </div>
      );
    }

    if (driveConnected === null) return null;

    return (
      <div className="mt-4 border-t border-dashed border-purple-200 dark:border-slate-700 pt-4 space-y-3">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Paperclip size={13} /> Archivos en Drive — {seccion}
        </p>

        {/* Zona de subida */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOverSeccion(prev => ({ ...prev, [seccion]: true })); }}
          onDragLeave={() => setDragOverSeccion(prev => ({ ...prev, [seccion]: false }))}
          onDrop={e => {
            e.preventDefault();
            setDragOverSeccion(prev => ({ ...prev, [seccion]: false }));
            const file = e.dataTransfer.files[0];
            if (file) handleSeleccionarArchivoSeccion(seccion, file);
          }}
          className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
            dragOverActivo
              ? 'border-pink-500 dark:border-teal-500 bg-pink-50/50 dark:bg-teal-500/5'
              : 'border-purple-200 dark:border-slate-700 bg-purple-50/20 dark:bg-slate-950/20'
          }`}
        >
          <input
            type="file"
            ref={el => fileInputRefs.current[seccion] = el}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) handleSeleccionarArchivoSeccion(seccion, f);
              e.target.value = '';
            }}
          />
          {subiendo ? (
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs">Subiendo a Drive...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 justify-center flex-wrap">
              <button
                onClick={() => fileInputRefs.current[seccion]?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-700 rounded-xl hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
              >
                <Upload size={12} /> Subir archivo
              </button>
              <button
                onClick={() => handlePickerDriveSeccion(seccion)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-blue-600 dark:text-blue-400"
              >
                <ExternalLink size={12} /> Desde mi Drive
              </button>
            </div>
          )}
        </div>

        {/* Lista de archivos */}
        {cargando ? (
          <div className="space-y-1.5">
            {[1, 2].map(i => <div key={i} className="h-10 bg-purple-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
          </div>
        ) : archivosSeccion.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-2">No hay archivos en esta sección.</p>
        ) : (
          <div className="space-y-1.5">
            {archivosSeccion.map(archivo => (
              <div key={archivo.id} className="bg-purple-50 dark:bg-slate-950/50 border border-purple-200 dark:border-slate-800 rounded-xl px-3 py-2 flex items-center gap-2">
                <div className="shrink-0">{getFileIcon(archivo.mimeType)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate">{archivo.name}</p>
                  <p className="text-xs text-slate-400">{formatFileSize(archivo.size)}{archivo.createdTime ? ` · ${new Date(archivo.createdTime).toLocaleDateString('es-AR')}` : ''}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a href={archivo.webViewLink} target="_blank" rel="noopener noreferrer"
                    className="p-1 rounded-lg hover:bg-purple-200 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 transition-colors" title="Abrir en Drive">
                    <ExternalLink size={13} />
                  </a>
                  <button onClick={() => handleEliminarArchivoSeccion(seccion, archivo)}
                    className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors" title="Eliminar">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-10 w-48 bg-pink-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-32 bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-16 bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl animate-pulse" />
          <div className="h-16 bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl animate-pulse" />
          <div className="h-16 bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="text-center py-20 text-slate-900">
        <p className="text-lg font-bold">Paciente no encontrado</p>
        <button onClick={() => navigate('/pacientes')} className="mt-4 text-teal-400 hover:underline font-medium">Volver a Pacientes</button>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6 text-slate-900 dark:text-slate-200 animate-fade-in">
      <ConfirmModal />

      {/* Botón volver */}
      <button
        onClick={() => navigate('/pacientes')}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-slate-700 dark:text-white transition-colors"
      >
        <ArrowLeft size={18} /> Volver a Pacientes
      </button>

      {/* Encabezado */}
      <div className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-start gap-5">
          <div className={`w-16 h-16 rounded-2xl ${getAvatarColor(paciente.nombre + paciente.apellido)} flex items-center justify-center shrink-0 text-2xl font-black uppercase shadow-lg`}>
            {getIniciales(paciente.nombre, paciente.apellido)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white capitalize truncate">
                {paciente.nombre} {paciente.apellido}
              </h1>
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
                paciente.entrevista
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-yellow-500/10 text-orange-700 dark:text-yellow-400 border border-yellow-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${paciente.entrevista ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
                {paciente.entrevista ? 'Activo' : 'Pendiente'}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-slate-900">
              <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-teal-400" /> {paciente.obra_social || 'Particular'}</span>
              <span className="flex items-center gap-1.5"><User size={14} className="text-teal-400" /> DNI: {paciente.dni}</span>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={() => setShowEditPaciente(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl border border-pink-300 dark:border-slate-700 text-slate-900 dark:text-slate-300 hover:bg-pink-200 dark:bg-slate-800 hover:text-slate-700 dark:text-white transition-colors"
            >
              <Edit size={15} /> Editar datos
            </button>
            <button
              onClick={() => setTabActivo(tabActivo === 'turnos' ? null : 'turnos')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-colors ${
                tabActivo === 'turnos'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'border border-pink-300 dark:border-slate-700 text-slate-900 dark:text-slate-300 hover:bg-pink-200 dark:bg-slate-800 hover:text-slate-700 dark:text-white'
              }`}
            >
              <Calendar size={15} /> Turnos
            </button>
          </div>
        </div>
      </div>

      {/* Datos del paciente en grilla */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Phone, label: 'Teléfono', value: paciente.telefono || '—' },
          { icon: Mail, label: 'Email', value: paciente.email || '—' },
          { icon: MapPin, label: 'Domicilio', value: paciente.domicilio || '—' },
          { icon: Calendar, label: 'Fecha de Nacimiento', value: paciente.fecha_nacimiento ? `${new Date(paciente.fecha_nacimiento.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}${calcularEdad(paciente.fecha_nacimiento) !== null ? ` (${calcularEdad(paciente.fecha_nacimiento)} años)` : ''}` : '—' },
          { icon: User, label: 'Sexo', value: paciente.sexo === 'M' ? 'Masculino' : paciente.sexo === 'F' ? 'Femenino' : paciente.sexo === 'X' ? 'Otro' : '—' },
          { icon: ShieldCheck, label: 'Nº de Afiliado', value: paciente.nro_afiliado || '—' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-xl p-4 flex items-start gap-3">
              <div className="bg-pink-200 dark:bg-slate-800 p-2 rounded-lg text-teal-400 shrink-0"><Icon size={16} /></div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">{item.label}</p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-200 mt-0.5 truncate">{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Motivo de consulta y contacto de emergencia */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paciente.motivo && (
          <div className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Motivo de Consulta</p>
            <p className="text-sm text-slate-900 dark:text-slate-300 leading-relaxed">{paciente.motivo}</p>
          </div>
        )}
        {paciente.contacto_emergencia && (
          <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4">
            <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Contacto de Emergencia</p>
            <p className="text-sm text-slate-900 dark:text-slate-300 leading-relaxed">{paciente.contacto_emergencia}</p>
          </div>
        )}
      </div>

      {/* Botones de acción — grilla 3×2 estilo KpiCard */}
      <div className="grid grid-cols-3 gap-3">

        <button onClick={() => navigate(`/pacientes/${id}/entrevista`)}
          className="group relative overflow-hidden rounded-2xl border-2 border-amber-400 dark:border-amber-500/70 bg-gradient-to-br from-white via-white to-amber-100/60 dark:from-[#141414] dark:via-[#141414] dark:to-amber-500/10 shadow-sm hover:shadow-lg hover:border-amber-500 transition-all duration-200 flex items-center justify-center text-center py-6">
          <div className="absolute right-0 bottom-0 p-1 text-amber-500 opacity-10 group-hover:opacity-20 transition-opacity duration-200"><FileText size={72} /></div>
          <span className="relative text-lg font-black text-amber-600 dark:text-amber-400">Entrevista de Admisión</span>
        </button>

        <button onClick={() => setTabActivo(tabActivo === 'sesiones' ? null : 'sesiones')}
          className={`group relative overflow-hidden rounded-2xl border-2 shadow-sm hover:shadow-lg transition-all duration-200 flex items-center justify-center text-center py-6 ${tabActivo === 'sesiones' ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-200/60 dark:from-blue-500/20 dark:to-blue-500/20' : 'border-blue-400 dark:border-blue-500/70 bg-gradient-to-br from-white via-white to-blue-100/60 dark:from-[#141414] dark:via-[#141414] dark:to-blue-500/10 hover:border-blue-500'}`}>
          <div className="absolute right-0 bottom-0 p-1 text-blue-500 opacity-10 group-hover:opacity-20 transition-opacity duration-200"><ClipboardList size={72} /></div>
          <span className="relative text-lg font-black text-blue-600 dark:text-blue-400">
            Sesiones{sesiones.length > 0 && <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-black">{sesiones.length}</span>}
          </span>
        </button>

        <button onClick={() => setTabActivo(tabActivo === 'evaluaciones' ? null : 'evaluaciones')}
          className={`group relative overflow-hidden rounded-2xl border-2 shadow-sm hover:shadow-lg transition-all duration-200 flex items-center justify-center text-center py-6 ${tabActivo === 'evaluaciones' ? 'border-teal-500 bg-gradient-to-br from-teal-50 to-teal-200/60 dark:from-teal-500/20 dark:to-teal-500/20' : 'border-teal-400 dark:border-teal-500/70 bg-gradient-to-br from-white via-white to-teal-100/60 dark:from-[#141414] dark:via-[#141414] dark:to-teal-500/10 hover:border-teal-500'}`}>
          <div className="absolute right-0 bottom-0 p-1 text-teal-500 opacity-10 group-hover:opacity-20 transition-opacity duration-200"><ClipboardCheck size={72} /></div>
          <span className="relative text-lg font-black text-teal-600 dark:text-teal-400">
            Evaluaciones{evaluaciones.length > 0 && <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-black">{evaluaciones.length}</span>}
          </span>
        </button>

        <button onClick={handleAbrirAdjuntos}
          className={`group relative overflow-hidden rounded-2xl border-2 shadow-sm hover:shadow-lg transition-all duration-200 flex items-center justify-center text-center py-6 ${showAdjuntos ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-200/60 dark:from-purple-500/20 dark:to-purple-500/20' : 'border-purple-400 dark:border-purple-500/70 bg-gradient-to-br from-white via-white to-purple-100/60 dark:from-[#141414] dark:via-[#141414] dark:to-purple-500/10 hover:border-purple-500'}`}>
          <div className="absolute right-0 bottom-0 p-1 text-purple-500 opacity-10 group-hover:opacity-20 transition-opacity duration-200"><Paperclip size={72} /></div>
          <span className="relative text-lg font-black text-purple-600 dark:text-purple-400">Archivos</span>
        </button>

        <button onClick={() => setShowInformes(v => !v)}
          className={`group relative overflow-hidden rounded-2xl border-2 shadow-sm hover:shadow-lg transition-all duration-200 flex items-center justify-center text-center py-6 ${showInformes ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-pink-200/60 dark:from-pink-500/20 dark:to-pink-500/20' : 'border-pink-400 dark:border-pink-500/70 bg-gradient-to-br from-white via-white to-pink-100/60 dark:from-[#141414] dark:via-[#141414] dark:to-pink-500/10 hover:border-pink-500'}`}>
          <div className="absolute right-0 bottom-0 p-1 text-pink-500 opacity-10 group-hover:opacity-20 transition-opacity duration-200"><FileText size={72} /></div>
          <span className="relative text-lg font-black text-pink-600 dark:text-pink-400">Informes</span>
        </button>

        <button onClick={() => setShowTests(v => !v)}
          className={`group relative overflow-hidden rounded-2xl border-2 shadow-sm hover:shadow-lg transition-all duration-200 flex items-center justify-center text-center py-6 ${showTests ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-indigo-200/60 dark:from-indigo-500/20 dark:to-indigo-500/20' : 'border-indigo-400 dark:border-indigo-500/70 bg-gradient-to-br from-white via-white to-indigo-100/60 dark:from-[#141414] dark:via-[#141414] dark:to-indigo-500/10 hover:border-indigo-500'}`}>
          <div className="absolute right-0 bottom-0 p-1 text-indigo-500 opacity-10 group-hover:opacity-20 transition-opacity duration-200"><BookOpen size={72} /></div>
          <span className="relative text-lg font-black text-indigo-600 dark:text-indigo-400">Tests</span>
        </button>

      </div>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/* PANEL DE TURNOS */}
      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {tabActivo === 'turnos' && (
        <div className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Calendar size={22} className="text-teal-400" /> Turnos
            </h3>
            <div className="flex items-center gap-2">
              {turnos.length > 0 && (
                modoSeleccionTurnos ? (
                  <>
                    {turnosSeleccionados.size > 0 && (
                      <button
                        onClick={handleEliminarTurnosSeleccionados}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors"
                      >
                        <Trash2 size={15} /> Eliminar ({turnosSeleccionados.size})
                      </button>
                    )}
                    <button
                      onClick={() => { setModoSeleccionTurnos(false); setTurnosSeleccionados(new Set()); }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl border border-pink-300 dark:border-slate-700 text-slate-900 dark:text-slate-300 hover:bg-pink-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <X size={15} /> Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setModoSeleccionTurnos(true); setShowNuevoTurno(false); }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl border border-pink-300 dark:border-slate-700 text-slate-900 dark:text-slate-300 hover:bg-pink-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <CheckCircle size={15} /> Seleccionar
                  </button>
                )
              )}
              {!modoSeleccionTurnos && (
                <button
                  onClick={() => { setShowNuevoTurno(v => !v); setTurnoFormErrors({}); }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-slate-900 dark:text-white transition-colors"
                >
                  <Plus size={16} /> Nuevo Turno
                </button>
              )}
            </div>
          </div>

          {/* Formulario nuevo turno */}
          {showNuevoTurno && (
            <div className="mb-6 p-4 rounded-xl border border-teal-500/30 bg-teal-500/5 space-y-3">
              <p className="text-sm font-bold text-teal-400 mb-2">Nuevo Turno</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-xs font-semibold text-slate-900 uppercase tracking-wider">Fecha *</label>
                  <input type="date" value={nuevoTurnoForm.fecha} onChange={e => { setNuevoTurnoForm(f => ({ ...f, fecha: e.target.value })); setTurnoFormErrors(f => ({ ...f, fecha: false })); }} className={`w-full rounded-lg p-2.5 text-sm outline-none border ${turnoFormErrors.fecha ? 'border-red-500 bg-red-500/5' : 'border-pink-300 dark:border-slate-700 bg-pink-200 dark:bg-slate-800'} text-slate-900 dark:text-white focus:border-teal-500 dark:[&::-webkit-calendar-picker-indicator]:invert`} />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-semibold text-slate-900 uppercase tracking-wider">Hora *</label>
                  <TimePicker value={nuevoTurnoForm.hora} onChange={val => { setNuevoTurnoForm(f => ({ ...f, hora: val })); setTurnoFormErrors(f => ({ ...f, hora: false })); }} className={`w-full rounded-lg p-2.5 text-sm outline-none border ${turnoFormErrors.hora ? 'border-red-500 bg-red-500/5' : 'border-pink-300 dark:border-slate-700 bg-pink-200 dark:bg-slate-800'} text-slate-900 dark:text-white focus:border-teal-500`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-xs font-semibold text-slate-900 uppercase tracking-wider">Consultorio *</label>
                  <select value={nuevoTurnoForm.consultorio} onChange={e => { setNuevoTurnoForm(f => ({ ...f, consultorio: e.target.value })); setTurnoFormErrors(f => ({ ...f, consultorio: false })); }} className={`w-full rounded-lg p-2.5 text-sm outline-none border ${turnoFormErrors.consultorio ? 'border-red-500 bg-red-500/5' : 'border-pink-300 dark:border-slate-700 bg-pink-200 dark:bg-slate-800'} text-slate-900 dark:text-white focus:border-teal-500`}>
                    <option value="">Seleccionar...</option>
                    {consultorios.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-xs font-semibold text-slate-900 uppercase tracking-wider">Estado</label>
                  <select value={nuevoTurnoForm.estado} onChange={e => setNuevoTurnoForm(f => ({ ...f, estado: e.target.value }))} className="w-full rounded-lg p-2.5 text-sm outline-none border border-pink-300 dark:border-slate-700 bg-pink-200 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-teal-500">
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="inasistencia">Inasistencia</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block mb-1 text-xs font-semibold text-slate-900 uppercase tracking-wider">Observaciones</label>
                <input type="text" value={nuevoTurnoForm.observaciones} onChange={e => setNuevoTurnoForm(f => ({ ...f, observaciones: e.target.value }))} className="w-full rounded-lg p-2.5 text-sm outline-none border border-pink-300 dark:border-slate-700 bg-pink-200 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-teal-500" placeholder="Opcional..." />
              </div>
              <div className="border border-teal-500/30 bg-teal-500/5 rounded-xl p-3 space-y-1.5">
                <label className="block font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Repetir semanalmente</label>
                <p className="text-xs text-slate-900">Se creará un turno por semana, el mismo día y horario, durante el período elegido.</p>
                <select
                  value={recurrenciaTurno}
                  onChange={e => setRecurrenciaTurno(e.target.value)}
                  className="w-full rounded-lg p-2.5 text-sm outline-none border border-pink-300 dark:border-slate-700 bg-pink-200 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-teal-500"
                >
                  <option value="">Sin repetición (turno único)</option>
                  <option value="1">Durante 1 mes</option>
                  <option value="2">Durante 2 meses</option>
                  <option value="3">Durante 3 meses</option>
                  <option value="4">Durante 4 meses</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button type="button" onClick={() => { setShowNuevoTurno(false); setTurnoFormErrors({}); setRecurrenciaTurno(''); }} className="px-4 py-1.5 text-sm font-bold rounded-lg text-slate-900 dark:text-slate-300 hover:bg-pink-200 dark:bg-slate-800 transition-colors">Cancelar</button>
                <button type="button" onClick={handleCrearTurno} disabled={submittingTurno} className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-slate-900 dark:text-white transition-colors disabled:opacity-60">
                  <Check size={14} /> Guardar Turno
                </button>
              </div>
            </div>
          )}

          {/* Lista de turnos */}
          {loadingTurnos ? (
            <p className="text-sm text-slate-900 py-4 text-center">Cargando turnos...</p>
          ) : turnos.length === 0 ? (
            <p className="text-sm text-slate-900 py-4 text-center">No hay turnos registrados.</p>
          ) : (
            <div className="space-y-2">
              {turnos.map(t => (
                <div key={t.id} className="rounded-xl border border-purple-300 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
                  {editandoTurno?.id === t.id ? (
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block mb-1 text-xs font-semibold text-slate-900 uppercase tracking-wider">Fecha</label>
                          <input type="date" value={turnoForm.fecha} onChange={e => setTurnoForm(f => ({ ...f, fecha: e.target.value }))} className="w-full rounded-lg p-2.5 text-sm outline-none border border-pink-300 dark:border-slate-700 bg-pink-200 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-teal-500 dark:[&::-webkit-calendar-picker-indicator]:invert" />
                        </div>
                        <div>
                          <label className="block mb-1 text-xs font-semibold text-slate-900 uppercase tracking-wider">Hora</label>
                          <TimePicker value={turnoForm.hora} onChange={val => setTurnoForm(f => ({ ...f, hora: val }))} className="w-full rounded-lg p-2.5 text-sm outline-none border border-pink-300 dark:border-slate-700 bg-pink-200 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-teal-500" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block mb-1 text-xs font-semibold text-slate-900 uppercase tracking-wider">Consultorio</label>
                          <select value={turnoForm.consultorio} onChange={e => setTurnoForm(f => ({ ...f, consultorio: e.target.value }))} className="w-full rounded-lg p-2.5 text-sm outline-none border border-pink-300 dark:border-slate-700 bg-pink-200 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-teal-500">
                            <option value="">Seleccionar...</option>
                            {consultorios.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block mb-1 text-xs font-semibold text-slate-900 uppercase tracking-wider">Estado</label>
                          <select value={turnoForm.estado} onChange={e => setTurnoForm(f => ({ ...f, estado: e.target.value }))} className="w-full rounded-lg p-2.5 text-sm outline-none border border-pink-300 dark:border-slate-700 bg-pink-200 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-teal-500">
                            <option value="pendiente">Pendiente</option>
                            <option value="confirmado">Confirmado</option>
                            <option value="inasistencia">Inasistencia</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block mb-1 text-xs font-semibold text-slate-900 uppercase tracking-wider">Observaciones</label>
                        <input type="text" value={turnoForm.observaciones || ''} onChange={e => setTurnoForm(f => ({ ...f, observaciones: e.target.value }))} className="w-full rounded-lg p-2.5 text-sm outline-none border border-pink-300 dark:border-slate-700 bg-pink-200 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-teal-500" />
                      </div>
                      <div className="border border-teal-500/30 bg-teal-500/5 rounded-xl p-3 space-y-1.5">
                        <label className="block font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Repetir semanalmente</label>
                        <p className="text-xs text-slate-900">Se creará un turno por semana, el mismo día y horario, durante el período elegido.</p>
                        <select
                          value={recurrenciaTurno}
                          onChange={e => setRecurrenciaTurno(e.target.value)}
                          className="w-full rounded-lg p-2.5 text-sm outline-none border border-pink-300 dark:border-slate-700 bg-pink-200 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-teal-500"
                        >
                          <option value="">Sin repetición (turno único)</option>
                          <option value="1">Durante 1 mes</option>
                          <option value="2">Durante 2 meses</option>
                          <option value="3">Durante 3 meses</option>
                          <option value="4">Durante 4 meses</option>
                        </select>
                      </div>
                      <div className="flex gap-2 justify-end pt-1">
                        <button type="button" onClick={() => { setEditandoTurno(null); setRecurrenciaTurno(''); }} className="px-4 py-1.5 text-sm font-bold rounded-lg text-slate-900 dark:text-slate-300 hover:bg-pink-200 dark:bg-slate-800 transition-colors">Cancelar</button>
                        <button type="button" onClick={handleGuardarTurno} disabled={submittingTurno} className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-slate-900 dark:text-white transition-colors disabled:opacity-60">
                          <Check size={14} /> Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`flex items-center justify-between gap-3 px-4 py-3 transition-colors ${modoSeleccionTurnos ? 'cursor-pointer hover:bg-pink-50 dark:hover:bg-slate-800/50' : ''} ${turnosSeleccionados.has(t.id) ? 'bg-pink-50 dark:bg-slate-800/50' : ''}`}
                      onClick={modoSeleccionTurnos ? () => setTurnosSeleccionados(prev => {
                        const next = new Set(prev);
                        next.has(t.id) ? next.delete(t.id) : next.add(t.id);
                        return next;
                      }) : undefined}
                    >
                      {modoSeleccionTurnos && (
                        <input
                          type="checkbox"
                          readOnly
                          checked={turnosSeleccionados.has(t.id)}
                          className="w-4 h-4 accent-pink-500 shrink-0 pointer-events-none"
                        />
                      )}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Clock size={15} className="text-teal-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-slate-200 text-sm">
                            {new Date(t.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            <span className="ml-2 text-teal-400 font-bold">{t.hora?.slice(0, 5)}</span>
                          </p>
                          <p className="text-xs text-slate-900 truncate">{t.consultorio}{t.observaciones ? ` · ${t.observaciones}` : ''}</p>
                        </div>
                      </div>
                      {!modoSeleccionTurnos && (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${(estadoTurnoConfig[t.estado] || estadoTurnoConfig.pendiente).color}`}>
                            {(estadoTurnoConfig[t.estado] || estadoTurnoConfig.pendiente).label}
                          </span>
                          <button type="button" onClick={() => { setEditandoTurno(t); setTurnoForm({ fecha: t.fecha?.slice(0, 10), hora: t.hora?.slice(0, 5), consultorio: t.consultorio, observaciones: t.observaciones || '', estado: t.estado }); }} className="p-1.5 rounded-lg hover:bg-pink-200 dark:bg-slate-800 text-slate-900 hover:text-slate-700 dark:text-white transition-colors">
                            <Edit size={14} />
                          </button>
                          <button type="button" onClick={() => handleEliminarTurno(t)} className="p-1.5 rounded-lg hover:bg-red-900/30 text-slate-900 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                      {modoSeleccionTurnos && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${(estadoTurnoConfig[t.estado] || estadoTurnoConfig.pendiente).color}`}>
                          {(estadoTurnoConfig[t.estado] || estadoTurnoConfig.pendiente).label}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/* PANEL DE SESIONES */}
      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {tabActivo === 'sesiones' && (
        <div className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <ClipboardList size={22} className="text-blue-400" /> Sesiones
            </h3>
            <div className="flex items-center gap-2">
              {!loadingTurnos && (
                <button
                  onClick={handleAbrirTurnoRapido}
                  className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-pink-300 dark:border-slate-700 text-pink-600 dark:text-teal-400 hover:bg-pink-50 dark:hover:bg-slate-800 px-3 py-1.5 rounded-xl text-sm font-bold transition-colors"
                >
                  <CalendarPlus size={16} /> Próximo turno
                </button>
              )}
              <button
                onClick={() => navigate(`/pacientes/${id}/sesiones/nueva`)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
              >
                <Plus size={16} /> Nueva Sesión
              </button>
            </div>
          </div>
          {loadingSesiones ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-pink-200 dark:bg-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : sesiones.length === 0 ? (
            <div className="text-center py-12 rounded-xl border-2 border-dashed border-pink-300 dark:border-slate-800 bg-white dark:bg-slate-950">
              <ClipboardList size={40} className="mx-auto text-slate-900 mb-2" />
              <p className="text-slate-900 font-medium">No hay sesiones registradas aún.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sesiones.map((s, idx) => (
                <div
                  key={s.id}
                  onClick={() => navigate(`/pacientes/${id}/sesiones/${s.id}`)}
                  className="p-4 rounded-xl border border-purple-300 dark:border-slate-800 bg-white dark:bg-slate-950/50 hover:border-blue-500/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-blue-400">Sesión #{idx + 1}</span>
                    <span className="text-xs text-slate-900 font-medium">
                      {new Date((s.fecha || '').split('T')[0] + 'T12:00:00Z').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-900 line-clamp-2 leading-relaxed">
                    {s.actividades_realizadas || 'Sin actividades registradas'}
                  </p>
                </div>
              ))}
            </div>
          )}
          {renderDrivePanel('Sesiones')}
        </div>
      )}

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/* PANEL DE EVALUACIONES */}
      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {tabActivo === 'evaluaciones' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <ClipboardCheck size={22} className="text-teal-400" /> Evaluaciones
            </h3>
            <button
              onClick={() => navigate(`/pacientes/${id}/evaluaciones/nueva`)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30 hover:bg-teal-500/20 transition-colors"
            >
              <Plus size={16} /> Nueva Evaluación
            </button>
          </div>

          {loadingEvaluaciones ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-pink-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-3/4 bg-pink-200 dark:bg-slate-800 rounded animate-pulse" />
                      <div className="h-4 w-1/2 bg-pink-200 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : evaluaciones.length === 0 ? (
            <div className="text-center py-12 rounded-xl border-2 border-dashed border-pink-300 dark:border-slate-800 bg-white dark:bg-slate-950">
              <ClipboardCheck size={40} className="mx-auto text-slate-900 mb-2" />
              <p className="text-slate-900 font-medium">No hay evaluaciones registradas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {evaluaciones.map((ev) => (
                <div key={ev.id} className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-teal-500/50 shadow-sm group relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEliminarEvaluacion(ev); }}
                    className="absolute top-4 right-4 text-slate-900 hover:text-red-400 bg-pink-200 dark:bg-slate-800 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-pink-300 dark:border-slate-700"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="bg-teal-500/10 p-3 rounded-xl text-teal-400 shrink-0">
                      <ClipboardCheck size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-teal-400 font-medium mt-0.5">
                        {ev.tipo_test}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm text-slate-900 font-medium border-t border-purple-300 dark:border-slate-800 pt-4">
                    {ev.fecha_administracion && (
                      <div className="flex items-center gap-3">
                        <div className="bg-pink-200 dark:bg-slate-800 p-1.5 rounded-lg text-slate-900"><Calendar size={14} /></div>
                        <span>{new Date((ev.fecha_administracion || '').split('T')[0] + 'T12:00:00Z').toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                      </div>
                    )}
                    {ev.puntaje_obtenido && (
                      <div className="flex items-center gap-3">
                        <div className="bg-pink-200 dark:bg-slate-800 p-1.5 rounded-lg text-slate-900"><Star size={14} /></div>
                        <span className="font-bold text-slate-900 dark:text-white">{ev.puntaje_obtenido}</span>
                      </div>
                    )}
                    {ev.resultados && (
                      <p className="text-slate-900 text-xs leading-relaxed line-clamp-3 mt-1">{ev.resultados}</p>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-purple-300 dark:border-slate-800 flex justify-between items-center">
                    <button onClick={() => navigate(`/pacientes/${id}/evaluaciones/${ev.id}`)} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-teal-400 transition-colors">
                      <Eye size={14} /> Ver detalle
                    </button>
                    <button onClick={() => navigate(`/pacientes/${id}/evaluaciones/${ev.id}/editar`)} className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors">
                      <Edit size={14} /> Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {renderDrivePanel('Evaluaciones')}
        </div>
      )}

      {/* ─────────────────────────────────────── */}
      {/* PANEL DE TESTS ESTANDARIZADOS          */}
      {/* ─────────────────────────────────────── */}
      {showTests && (() => {
        const edadPaciente = calcularEdad(paciente.fecha_nacimiento);
        const motivoPaciente = paciente.motivo || '';
        const categorias = getTestsFiltrados({
          edad: edadPaciente,
          motivo: motivoPaciente,
          filtroEdad: testsFiltroEdad,
          filtroMotivo: testsFiltroMotivo,
        });

        const colorMap = {
          blue:   { bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-200 dark:border-blue-800/40', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', title: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
          green:  { bg: 'bg-green-50 dark:bg-green-900/10', border: 'border-green-200 dark:border-green-800/40', badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', title: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
          purple: { bg: 'bg-purple-50 dark:bg-purple-900/10', border: 'border-purple-200 dark:border-purple-800/40', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', title: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
          orange: { bg: 'bg-orange-50 dark:bg-orange-900/10', border: 'border-orange-200 dark:border-orange-800/40', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', title: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
          red:    { bg: 'bg-red-50 dark:bg-red-900/10', border: 'border-red-200 dark:border-red-800/40', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', title: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
          pink:   { bg: 'bg-pink-50 dark:bg-pink-900/10', border: 'border-pink-200 dark:border-pink-800/40', badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300', title: 'text-pink-700 dark:text-pink-300', dot: 'bg-pink-500' },
          teal:   { bg: 'bg-teal-50 dark:bg-teal-900/10', border: 'border-teal-200 dark:border-teal-800/40', badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300', title: 'text-teal-700 dark:text-teal-300', dot: 'bg-teal-500' },
          yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/10', border: 'border-yellow-200 dark:border-yellow-800/40', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', title: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
          indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/10', border: 'border-indigo-200 dark:border-indigo-800/40', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300', title: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
        };

        return (
          <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/40 rounded-2xl p-6 shadow-lg space-y-5">
            {/* Cabecera */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <BookOpen size={22} className="text-indigo-500 dark:text-indigo-400" /> Tests Estandarizados Aplicables
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                {motivoPaciente && (
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={testsFiltroMotivo}
                      onChange={e => setTestsFiltroMotivo(e.target.checked)}
                      className="accent-indigo-500 w-4 h-4"
                    />
                    Por motivo de consulta
                  </label>
                )}
                {edadPaciente !== null && (
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={testsFiltroEdad}
                      onChange={e => setTestsFiltroEdad(e.target.checked)}
                      className="accent-indigo-500 w-4 h-4"
                    />
                    Por edad ({edadPaciente} años)
                  </label>
                )}
              </div>
            </div>

            {/* Info banners */}
            {((testsFiltroMotivo && motivoPaciente) || (testsFiltroEdad && edadPaciente !== null)) && (
              <div className="flex flex-col gap-2">
                {testsFiltroMotivo && motivoPaciente && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/40 rounded-xl px-4 py-2">
                    Filtrando por motivo de consulta: <strong className="italic">"{motivoPaciente.length > 80 ? motivoPaciente.slice(0, 80) + '…' : motivoPaciente}"</strong>
                  </p>
                )}
                {testsFiltroEdad && edadPaciente !== null && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/40 rounded-xl px-4 py-2">
                    Filtrando por edad: tests aplicables a <strong>{edadPaciente} años</strong>.
                  </p>
                )}
              </div>
            )}

            {(!categorias || categorias.length === 0) ? (
              <div className="text-center py-10 text-slate-400 dark:text-slate-600">
                <BookOpen size={36} className="mx-auto mb-2 opacity-40" />
                <p className="font-medium text-sm">No hay tests que coincidan con los filtros aplicados.</p>
                <p className="text-xs mt-1">Desactivá algún filtro para ver más opciones.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {categorias.map(cat => {
                  const c = colorMap[cat.color] || colorMap.blue;
                  return (
                    <div key={cat.id} className={`rounded-xl border ${c.border} overflow-hidden`}>
                      <div className={`flex items-center gap-3 px-4 py-3 ${c.bg}`}>
                        <span className={`w-2 h-2 rounded-full ${c.dot} shrink-0`} />
                        <span className={`font-bold text-sm ${c.title}`}>{cat.label}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge} ml-1`}>{cat.tests.length}</span>
                      </div>
                      <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3 bg-white dark:bg-slate-950/40">
                        {cat.tests.map(test => (
                          <button
                            key={test.id}
                            onClick={() => { setTestModal(test); setTestModalColor(cat.color); }}
                            className={`w-full text-left rounded-xl border ${c.border} ${c.bg} p-3 space-y-1.5 hover:shadow-md hover:scale-[1.01] transition-all duration-150`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className={`font-bold text-sm ${c.title}`}>{test.nombre}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{test.nombreCompleto}</p>
                              </div>
                              <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
                                {test.edadMax >= 80 ? `${test.edadMin}a+` : `${test.edadMin}–${test.edadMax}a`}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">{test.descripcion}</p>
                            <p className={`text-xs font-semibold ${c.title} opacity-60`}>Ver detalle →</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {testModal && (
        <TestModal
          test={testModal}
          colorKey={testModalColor}
          onClose={() => setTestModal(null)}
        />
      )}

      {/* Editar paciente modal */}
      <EditarPacienteModal
        show={showEditPaciente}
        onClose={() => setShowEditPaciente(false)}
        paciente={paciente}
        onSaved={cargarPaciente}
      />

      {/* ─────────────────────────────────────── */}
      {/* PANEL DE ARCHIVOS ADJUNTOS (GOOGLE DRIVE) */}
      {/* ─────────────────────────────────────── */}
      {showAdjuntos && (
        <div className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Paperclip size={20} className="text-purple-500" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Archivos adjuntos</h3>
          </div>
          {driveConnected === null ? (
            <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
          ) : renderDrivePanel('Archivos')}
        </div>
      )}

      {/* ─────────────────────────────────────── */}
      {/* PANEL DE INFORMES */}
      {/* ─────────────────────────────────────── */}
      {showInformes && (
        <div className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <FileText size={20} className="text-pink-500" /> Informes
            </h3>
            <button
              onClick={() => {
                setEditandoInforme(null);
                setInformeTipo('diagnostico');
                setInformeFecha(new Date().toISOString().split('T')[0]);
                setInformeContenido({});
                setInformeEstado('borrador');
                setShowInformeModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-pink-500 hover:bg-pink-600 text-white transition-colors"
            >
              <Plus size={16} /> Nuevo Informe
            </button>
          </div>

          {loadingInformes ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-14 bg-pink-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
            </div>
          ) : informesPaciente.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-6">No hay informes para este paciente. Creá el primero.</p>
          ) : viewingInforme ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button onClick={() => setViewingInforme(null)} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-400 hover:text-pink-500 transition-colors">
                  <ArrowLeft size={16} /> Volver a la lista
                </button>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-xl border border-purple-300 dark:border-slate-700 text-slate-900 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors">
                    <Printer size={15} /> Imprimir
                  </button>
                  <button onClick={() => { setViewingInforme(null); setEditandoInforme(viewingInforme.id); setInformeTipo(viewingInforme.tipo); setInformeFecha(viewingInforme.fecha); setInformeContenido(typeof viewingInforme.contenido === 'object' ? viewingInforme.contenido : {}); setInformeEstado(viewingInforme.estado); setShowInformeModal(true); }} className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white transition-colors">
                    <Edit size={15} /> Editar
                  </button>
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-slate-950 border border-purple-300 dark:border-slate-800 rounded-xl p-6 space-y-4">
                <div className="border-b border-purple-300 dark:border-slate-800 pb-4">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">{tiposInforme.find(t => t.value === viewingInforme.tipo)?.label}</h4>
                  <p className="text-sm text-slate-500 mt-1">
                    {new Date(viewingInforme.fecha + 'T12:00:00Z').toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    {' · '}
                    <span className={`font-bold ${viewingInforme.estado === 'finalizado' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                      {viewingInforme.estado === 'finalizado' ? 'Finalizado' : 'Borrador'}
                    </span>
                  </p>
                </div>
                {(seccionesPorTipo[viewingInforme.tipo] || []).map(sec => {
                  const valor = viewingInforme.contenido?.[sec.key];
                  if (!valor) return null;
                  return (
                    <div key={sec.key}>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-400 uppercase tracking-wider mb-1">{sec.label}</p>
                      <p className="text-sm text-slate-900 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{valor}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {informesPaciente.map(inf => (
                <div key={inf.id} className="flex items-center justify-between bg-purple-50 dark:bg-slate-950 border border-purple-300 dark:border-slate-800 rounded-xl px-4 py-3 hover:bg-pink-50 dark:hover:bg-slate-900 transition-colors cursor-pointer" onClick={() => setViewingInforme(inf)}>
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-pink-500 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{tiposInforme.find(t => t.value === inf.tipo)?.label || inf.tipo}</p>
                      <p className="text-xs text-slate-500">{new Date(inf.fecha + 'T12:00:00Z').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${inf.estado === 'finalizado' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-200 dark:border-green-500/30' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30'}`}>
                      {inf.estado === 'finalizado' ? <CheckCircle size={11} /> : <Clock size={11} />}
                      {inf.estado === 'finalizado' ? 'Finalizado' : 'Borrador'}
                    </span>
                    <button onClick={e => { e.stopPropagation(); confirm({ title: 'Eliminar informe', message: '¿Eliminar este informe? No se puede deshacer.', confirmLabel: 'Eliminar', variant: 'danger' }).then(ok => { if (ok) eliminarInforme(inf.id).then(() => cargarInformes()); }); }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {renderDrivePanel('Informes')}
        </div>
      )}

      {/* Modal Nuevo/Editar Informe */}
      {showInformeModal && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#141414] w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-300 dark:border-[#333]">
            <div className="border-b border-purple-300 dark:border-[#262626] bg-purple-100/50 dark:bg-[#0f1115] px-6 py-4 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">{editandoInforme ? 'Editar Informe' : 'Nuevo Informe'}</h2>
              <button onClick={() => setShowInformeModal(false)} className="p-2 rounded-xl border border-purple-300 dark:border-[#333] bg-white dark:bg-[#1a1c23] hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-900 dark:text-slate-400 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 text-sm space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Tipo de Informe *</label>
                  <select value={informeTipo} onChange={e => setInformeTipo(e.target.value)} className="w-full rounded-xl p-3 outline-none border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-pink-500">
                    {tiposInforme.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1.5 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Fecha *</label>
                  <input type="date" value={informeFecha} onChange={e => setInformeFecha(e.target.value)} className="w-full rounded-xl p-3 outline-none border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-pink-500 dark:[&::-webkit-calendar-picker-indicator]:invert" />
                </div>
              </div>
              <div>
                <label className="block mb-1.5 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Estado</label>
                <select value={informeEstado} onChange={e => setInformeEstado(e.target.value)} className="w-full rounded-xl p-3 outline-none border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-pink-500">
                  <option value="borrador">Borrador</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </div>
              <div className="border-t border-purple-300 dark:border-[#333] pt-4 space-y-4">
                <p className="font-bold text-pink-600 dark:text-pink-400 text-sm uppercase tracking-wider">Contenido del informe</p>
                {(seccionesPorTipo[informeTipo] || []).map(sec => (
                  <div key={sec.key}>
                    <label className="block mb-1.5 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">{sec.label}</label>
                    <textarea
                      value={informeContenido[sec.key] || ''}
                      onChange={e => setInformeContenido(prev => ({ ...prev, [sec.key]: e.target.value }))}
                      rows={3}
                      className="w-full rounded-xl p-3 outline-none resize-none border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-pink-500"
                      placeholder={`${sec.label}...`}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-purple-300 dark:border-[#262626] bg-purple-100/50 dark:bg-[#0f1115] px-6 py-4 flex justify-end gap-3 shrink-0">
              <button onClick={() => setShowInformeModal(false)} disabled={submittingInforme} className="px-5 py-2 font-bold rounded-xl text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white disabled:opacity-50 transition-colors">Cancelar</button>
              <button
                onClick={async () => {
                  setSubmittingInforme(true);
                  try {
                    const data = { paciente_id: Number(id), tipo: informeTipo, fecha: informeFecha, contenido: informeContenido, estado: informeEstado };
                    if (editandoInforme) {
                      await actualizarInforme(editandoInforme, data);
                    } else {
                      await crearInforme(data);
                    }
                    setShowInformeModal(false);
                    setEditandoInforme(null);
                    await cargarInformes();
                  } finally {
                    setSubmittingInforme(false);
                  }
                }}
                disabled={submittingInforme}
                className="inline-flex items-center gap-2 px-6 py-2 font-bold rounded-xl bg-pink-500 hover:bg-pink-600 text-white transition-colors disabled:opacity-60"
              >
                {submittingInforme ? <Loader2 size={16} className="animate-spin" /> : null}
                {editandoInforme ? 'Guardar Cambios' : 'Crear Informe'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal turno rápido */}
      {showTurnoRapido && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md mx-auto max-h-screen sm:max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-pink-300 dark:border-slate-800">
            <div className="border-b border-pink-300 dark:border-slate-800 bg-pink-100/50 dark:bg-slate-950 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0 gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Nuevo turno — {paciente?.nombre} {paciente?.apellido}
              </h2>
              <button onClick={() => setShowTurnoRapido(false)} className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-pink-200 dark:bg-slate-800 text-slate-900 dark:text-slate-400 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              <div>
                <label className="block mb-1 text-sm font-semibold text-slate-900 dark:text-slate-300">Fecha *</label>
                <input
                  type="date"
                  value={turnoRapidoForm.fecha}
                  onChange={e => setTurnoRapidoForm(f => ({ ...f, fecha: e.target.value }))}
                  className="w-full rounded-xl p-3 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500 dark:[&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-slate-900 dark:text-slate-300">Hora *</label>
                <TimePicker
                  value={turnoRapidoForm.hora}
                  onChange={val => setTurnoRapidoForm(f => ({ ...f, hora: val }))}
                  className="w-full rounded-xl p-3 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-slate-900 dark:text-slate-300">Consultorio *</label>
                <select
                  value={turnoRapidoForm.consultorio}
                  onChange={e => setTurnoRapidoForm(f => ({ ...f, consultorio: e.target.value }))}
                  className="w-full rounded-xl p-3 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500"
                >
                  <option value="">Seleccionar...</option>
                  {consultorios.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-slate-900 dark:text-slate-300">Notas</label>
                <textarea
                  value={turnoRapidoForm.notas}
                  onChange={e => setTurnoRapidoForm(f => ({ ...f, notas: e.target.value }))}
                  rows={3}
                  placeholder="Opcional..."
                  className="w-full rounded-xl p-3 outline-none transition-colors resize-none border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500"
                />
              </div>
            </div>
            <div className="border-t border-pink-300 dark:border-slate-800 bg-pink-100/50 dark:bg-slate-950 px-4 sm:px-6 py-4 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowTurnoRapido(false)}
                disabled={submittingTurnoRapido}
                className="px-6 py-2.5 font-bold rounded-xl transition-colors text-slate-900 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-pink-200 dark:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarTurnoRapido}
                disabled={submittingTurnoRapido}
                className="inline-flex items-center gap-2 px-6 py-2.5 font-bold rounded-xl bg-pink-500 hover:bg-pink-600 text-white transition-colors disabled:opacity-60"
              >
                {submittingTurnoRapido ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  'Guardar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

    </>
  );
}








import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TimePicker from '../components/ui/TimePicker';
import { getPacientes, crearPaciente, actualizarPaciente, eliminarPaciente, getPacientesSinSesion } from '../services/pacientesService';
import { getObrasSociales } from '../services/obrasSocialesService';
import { getTurnos, actualizarTurno, eliminarTurno } from '../services/turnosService';
import { getConsultorios } from '../services/consultoriosService';
import {
  Search, Plus, Phone, MapPin, Trash2, User, Users, ShieldCheck, Mail, Calendar,
  AlertTriangle, Clock, SearchX, AlertCircle, Pencil, Check, X, ChevronDown, ChevronUp, Printer
} from 'lucide-react';
import { useToast, SkeletonCard, ErrorState, EmptyState, Button } from '../components/ui';
import { useConfirm } from '../hooks/useConfirm';

/* Niña: silueta con colitas y vestido, brazos abiertos, fill sólido */
const IconaNina = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 100 120" fill={color} xmlns="http://www.w3.org/2000/svg">
    {/* Colitas */}
    <ellipse cx="36" cy="8" rx="9" ry="6" transform="rotate(-30 36 8)" />
    <ellipse cx="64" cy="8" rx="9" ry="6" transform="rotate(30 64 8)" />
    {/* Cabeza */}
    <circle cx="50" cy="22" r="16" />
    {/* Cuerpo / vestido triángulo */}
    <path d="M34 42 Q50 38 66 42 L74 80 Q50 88 26 80 Z" />
    {/* Brazo izquierdo */}
    <path d="M34 48 Q18 44 8 52" stroke={color} strokeWidth="9" strokeLinecap="round" fill="none" />
    {/* Brazo derecho */}
    <path d="M66 48 Q82 44 92 52" stroke={color} strokeWidth="9" strokeLinecap="round" fill="none" />
    {/* Pierna izquierda */}
    <path d="M40 79 Q37 95 34 112" stroke={color} strokeWidth="9" strokeLinecap="round" fill="none" />
    {/* Pierna derecha */}
    <path d="M60 79 Q63 95 66 112" stroke={color} strokeWidth="9" strokeLinecap="round" fill="none" />
  </svg>
);

/* Niño: silueta simple con brazos abiertos, fill sólido */
const IconaNino = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 100 120" fill={color} xmlns="http://www.w3.org/2000/svg">
    {/* Cabeza */}
    <circle cx="50" cy="20" r="16" />
    {/* Cuerpo */}
    <rect x="36" y="40" width="28" height="34" rx="8" />
    {/* Brazo izquierdo */}
    <path d="M36 46 Q20 42 8 50" stroke={color} strokeWidth="9" strokeLinecap="round" fill="none" />
    {/* Brazo derecho */}
    <path d="M64 46 Q80 42 92 50" stroke={color} strokeWidth="9" strokeLinecap="round" fill="none" />
    {/* Pierna izquierda */}
    <path d="M42 74 Q39 93 36 112" stroke={color} strokeWidth="9" strokeLinecap="round" fill="none" />
    {/* Pierna derecha */}
    <path d="M58 74 Q61 93 64 112" stroke={color} strokeWidth="9" strokeLinecap="round" fill="none" />
  </svg>
);

const calcularEdad = (fechaNac) => {
  if (!fechaNac) return null;
  const hoy = new Date();
  const nac = new Date(fechaNac);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad >= 0 ? edad : null;
};

const imprimirConsentimiento = ({ nombre, apellido, dni, fechaNacimiento }) => {
  const hoy = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const edad = calcularEdad(fechaNacimiento);
  const pacienteTexto = [apellido, nombre].filter(Boolean).join(', ') || '___________________________';
  const dniTexto = dni || '_______________';
  const edadTexto = edad != null ? `${edad} años` : '______';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Consentimiento Informado</title>
  <style>
    @page { size: A4; margin: 2.5cm 2cm; }
    body { font-family: Arial, sans-serif; font-size: 12pt; color: #111; line-height: 1.6; }
    h1 { font-size: 16pt; text-align: center; margin-bottom: 4px; }
    .subtitle { text-align: center; font-size: 10pt; color: #555; margin-bottom: 24px; }
    .section { margin-bottom: 18px; }
    .section h2 { font-size: 13pt; border-bottom: 1px solid #aaa; padding-bottom: 4px; margin-bottom: 8px; }
    p { margin: 6px 0; text-align: justify; }
    .field { display: inline-block; border-bottom: 1px solid #333; min-width: 180px; }
    .firma-area { margin-top: 60px; display: flex; gap: 60px; justify-content: space-around; }
    .firma-box { text-align: center; width: 200px; }
    .firma-line { border-top: 1px solid #333; margin-bottom: 6px; }
    .firma-label { font-size: 10pt; color: #444; }
    @media print { body { -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <h1>Consentimiento Informado y Confidencialidad</h1>
  <p class="subtitle">Ley 26.529 — Derechos del Paciente en su Relación con los Profesionales e Instituciones de la Salud</p>

  <div class="section">
    <h2>Datos del Paciente</h2>
    <p><strong>Apellido y Nombre:</strong> <span class="field">${pacienteTexto}</span></p>
    <p><strong>DNI:</strong> <span class="field">${dniTexto}</span> &nbsp;&nbsp;&nbsp; <strong>Edad:</strong> <span class="field">${edadTexto}</span></p>
  </div>

  <div class="section">
    <h2>Información y Consentimiento</h2>
    <p>
      En cumplimiento de la Ley 26.529 de Derechos del Paciente, el presente documento certifica que el
      paciente o su representante legal ha sido debidamente informado/a sobre:
    </p>
    <ul>
      <li>El diagnóstico, los procedimientos terapéuticos propuestos y sus objetivos.</li>
      <li>Los beneficios esperados del tratamiento psicopedagógico.</li>
      <li>Los alcances y limitaciones del proceso de evaluación e intervención.</li>
      <li>El derecho a revocar este consentimiento en cualquier momento sin que ello genere perjuicio alguno.</li>
    </ul>
  </div>

  <div class="section">
    <h2>Confidencialidad</h2>
    <p>
      Toda la información obtenida en el marco del tratamiento — incluyendo datos personales, resultados de
      evaluaciones, registros de sesiones e informes — será tratada con estricta confidencialidad, en
      conformidad con la Ley 26.529 y la Ley 25.326 de Protección de Datos Personales.
    </p>
    <p>
      La información únicamente podrá ser compartida con terceros mediando autorización expresa del paciente
      o su representante legal, o por requerimiento judicial.
    </p>
  </div>

  <div class="section">
    <h2>Declaración de Consentimiento</h2>
    <p>
      Habiendo leído y comprendido la información precedente, el/la firmante presta libre y voluntariamente
      su consentimiento para el inicio y desarrollo del tratamiento psicopedagógico del menor indicado.
    </p>
    <p><strong>Lugar y fecha:</strong> <span class="field">___________________, ${hoy}</span></p>
  </div>

  <div class="firma-area">
    <div class="firma-box">
      <div style="height:70px;"></div>
      <div class="firma-line"></div>
      <div class="firma-label">Firma del Padre / Madre / Tutor Legal</div>
      <div class="firma-label" style="margin-top:4px;">Aclaración: ___________________________</div>
      <div class="firma-label" style="margin-top:4px;">DNI: _______________</div>
      <div class="firma-label" style="margin-top:4px;">Vínculo: _______________</div>
    </div>
    <div class="firma-box">
      <div style="height:70px;"></div>
      <div class="firma-line"></div>
      <div class="firma-label">Firma del Profesional</div>
      <div class="firma-label" style="margin-top:4px;">Sello / Matrícula: ___________________</div>
    </div>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=800,height=700');
  win.document.write(html);
  win.document.close();
  win.onload = () => win.print();
};

export default function Pacientes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pacientes, setPacientes] = useState([]);
  const [obrasSocialesList, setObrasSocialesList] = useState([]);
  const [pacientesSinSesion, setPacientesSinSesion] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Navegación y modales
  const [showNewModal, setShowNewModal] = useState(false);
  const [editandoPaciente, setEditandoPaciente] = useState(null); // null = crear, number = ID del paciente a editar

  // Estados del Formulario (Alta/Edición)
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
  const [inicioSesiones, setInicioSesiones] = useState("");
  const [consentimiento, setConsentimiento] = useState(false);

  // Turnos del paciente en edición
  const [turnosPaciente, setTurnosPaciente] = useState([]);
  const [loadingTurnos, setLoadingTurnos] = useState(false);
  const [consultorios, setConsultorios] = useState([]);
  const [editandoTurno, setEditandoTurno] = useState(null); // turno completo siendo editado
  const [turnoForm, setTurnoForm] = useState({});
  const [submittingTurno, setSubmittingTurno] = useState(false);
  const [turnosExpandido, setTurnosExpandido] = useState(true);

  // Errores de validación
  const [formErrors, setFormErrors] = useState({});

  const { confirm, ConfirmModal } = useConfirm();
  const toast = useToast();

  const validatePacienteForm = () => {
    const errors = {};
    if (!nombre.trim() || nombre.trim().length < 2) errors.nombre = 'El nombre debe tener al menos 2 caracteres.';
    if (!apellido.trim() || apellido.trim().length < 2) errors.apellido = 'El apellido debe tener al menos 2 caracteres.';
    if (!dni.trim()) errors.dni = 'El DNI es obligatorio.';
    if (telefono && !/^[\d\s\-().+]+$/.test(telefono)) errors.telefono = 'Formato de teléfono inválido.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const cargarPacientes = async () => {
    const data = await getPacientes();
    setPacientes(Array.isArray(data) ? data : []);
  };

  const cargarObrasSociales = async () => {
    const data = await getObrasSociales();
    setObrasSocialesList(Array.isArray(data) ? data : []);
  };

  const cargarTurnosPaciente = async (pacienteId) => {
    setLoadingTurnos(true);
    const [dataTurnos, dataConsultorios] = await Promise.all([
      getTurnos({ paciente_id: pacienteId }),
      getConsultorios(),
    ]);
    setTurnosPaciente(Array.isArray(dataTurnos) ? dataTurnos : []);
    setConsultorios(Array.isArray(dataConsultorios) ? dataConsultorios : []);
    setLoadingTurnos(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          cargarPacientes(),
          cargarObrasSociales(),
          getPacientesSinSesion().then(data => setPacientesSinSesion(Array.isArray(data) ? data : [])),
        ]);
      } catch {
        setError('No se pudieron cargar los pacientes.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const resetForm = () => {
    setNombre(""); setApellido(""); setDni(""); setFechaNacimiento(""); setSexo("");
    setDomicilio(""); setTelefono(""); setEmail(""); setObraSocial(""); setNroAfiliado("");
    setMotivo(""); setDerivadaPor(""); setDiagnostico(""); setCud(""); setContactoEmergencia(""); setInicioSesiones(""); setConsentimiento(false);
    setEditandoPaciente(null);
    setFormErrors({});
    setTurnosPaciente([]); setEditandoTurno(null); setTurnoForm({});
  };

  const openNewPaciente = () => {
    resetForm();
    setShowNewModal(true);
  };

  useEffect(() => {
    if (location.state?.openNew) {
      openNewPaciente();
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const openEditPaciente = (p) => {
    setNombre(p.nombre || "");
    setApellido(p.apellido || "");
    setDni(p.dni || "");
    setFechaNacimiento(p.fecha_nacimiento ? p.fecha_nacimiento.split('T')[0] : "");
    setSexo(p.sexo || "");
    setDomicilio(p.domicilio || "");
    setTelefono(p.telefono || "");
    setEmail(p.email || "");
    setObraSocial(p.obra_social || "");
    setNroAfiliado(p.nro_afiliado || "");
    setMotivo(p.motivo_consulta || p.motivo || "");
    setDerivadaPor(p.derivada_por || "");
    setDiagnostico(p.diagnostico || "");
    setCud(p.cud || "");
    setContactoEmergencia(p.contacto_emergencia || "");
    setInicioSesiones(p.inicio_sesiones ? p.inicio_sesiones.split('T')[0] : "");
    setConsentimiento(true);
    setEditandoPaciente(p.id);
    setShowNewModal(true);
    cargarTurnosPaciente(p.id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePacienteForm()) return;
    setSubmitting(true);
    const datos = { nombre, apellido, dni, telefono, motivo, derivada_por: derivadaPor, diagnostico, cud, fecha_nacimiento: fechaNacimiento, sexo, domicilio, email, obra_social: obraSocial, nro_afiliado: nroAfiliado, contacto_emergencia: contactoEmergencia, inicio_sesiones: inicioSesiones || null };

    try {
      if (editandoPaciente) {
        await actualizarPaciente(editandoPaciente, datos);
        toast.success('Paciente actualizado', 'Los datos se guardaron correctamente.');
        resetForm();
        setShowNewModal(false);
        await cargarPacientes();
      } else {
        const nuevo = await crearPaciente({ ...datos, consentimiento });
        toast.success('Paciente creado', 'El paciente fue registrado correctamente.');
        resetForm();
        setShowNewModal(false);
        if (location.state?.returnTo === 'turnos' && nuevo?.id) {
          navigate('/turnos', { state: { pacienteId: nuevo.id } });
          return;
        }
        await cargarPacientes();
      }
    } catch (err) {
      toast.error('Error', err?.message || 'No se pudieron guardar los datos del paciente.');
    } finally {
      setSubmitting(false);
    }
  };

  const estadoTurnoConfig = {
    pendiente:    { label: 'Pendiente',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/30' },
    confirmado:   { label: 'Confirmado',   color: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-200 dark:border-green-500/30' },
    inasistencia: { label: 'Inasistencia', color: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/30' },
    cancelado:    { label: 'Cancelado',    color: 'bg-slate-100 text-slate-900 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-500/30' },
  };

  const handleGuardarTurno = async () => {
    if (!turnoForm.fecha || !turnoForm.hora || !turnoForm.consultorio) {
      toast.error('Error', 'Fecha, hora y consultorio son obligatorios.');
      return;
    }
    setSubmittingTurno(true);
    try {
      await actualizarTurno(editandoTurno.id, {
        paciente_id: editandoTurno.paciente_id,
        fecha: turnoForm.fecha,
        hora: turnoForm.hora,
        consultorio: turnoForm.consultorio,
        observaciones: turnoForm.observaciones || '',
        estado: turnoForm.estado,
        tipo_cobertura: editandoTurno.tipo_cobertura,
      });
      toast.success('Turno actualizado', 'Los cambios se guardaron correctamente.');
      setEditandoTurno(null);
      await cargarTurnosPaciente(editandoPaciente);
    } catch {
      toast.error('Error', 'No se pudo actualizar el turno.');
    } finally {
      setSubmittingTurno(false);
    }
  };

  const handleEliminarTurno = async (turno) => {
    const ok = await confirm({
      title: 'Cancelar turno',
      message: `¿Eliminás el turno del ${new Date(turno.fecha + 'T12:00:00').toLocaleDateString('es-AR')} a las ${turno.hora?.slice(0,5)}?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    await eliminarTurno(turno.id);
    await cargarTurnosPaciente(editandoPaciente);
    toast.success('Turno eliminado', '');
  };

  const handleDelete = async (p) => {
    const ok = await confirm({
      title: 'Eliminar paciente',
      message: `¿Estás seguro de que querés eliminar a "${p.nombre} ${p.apellido}"? Se eliminarán todos sus datos asociados.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await eliminarPaciente(p.id);
      await cargarPacientes();
      toast.success('Paciente eliminado', 'El paciente fue eliminado correctamente.');
    } catch {
      toast.error('Error', 'No se pudo eliminar el paciente.');
    }
  };


  // Set de IDs sin sesión reciente
  const idsSinSesion = new Set(pacientesSinSesion.map(p => p.id));

  // Filtros
  const [filtroOS, setFiltroOS] = useState("");

  const pacientesFiltrados = pacientes.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchSearch = !term ||
      (p.nombre || '').toLowerCase().includes(term) ||
      (p.apellido || '').toLowerCase().includes(term) ||
      (p.dni || '').toLowerCase().includes(term) ||
      (p.telefono || '').toLowerCase().includes(term);
    const matchOS = !filtroOS || (p.obra_social || '').toLowerCase() === filtroOS.toLowerCase();
    return matchSearch && matchOS;
  });

  // Colores de avatar
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

  // Helper de clases de input
  const inputClass = (field) => `
    w-full rounded-xl p-3 outline-none transition-colors border
    bg-white dark:bg-slate-950 text-slate-900 dark:text-white
    focus:border-teal-500 dark:focus:border-teal-500
    ${formErrors[field]
      ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-950/20'
      : 'border-slate-300 dark:border-slate-800'
    }
  `;

  return (
    <div className="space-y-6 text-slate-900 dark:text-white animate-fade-in">
      <ConfirmModal />

      {/* Cabecera */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5 text-slate-900 dark:text-white">
            <span className="bg-pink-100 text-pink-700 dark:bg-teal-500/10 dark:text-teal-400 p-2.5 rounded-xl">
              <Users size={24} />
            </span>
            Pacientes
          </h1>
          <p className="text-slate-900 dark:text-white mt-2 font-medium">
            {pacientes.length === 0
              ? 'No hay pacientes registrados aún.'
              : `${pacientes.length} paciente${pacientes.length !== 1 ? 's' : ''} registrado${pacientes.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        <button onClick={openNewPaciente} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white px-6 py-3 rounded-xl transition-all font-semibold shadow-lg shadow-teal-500/20">
          <Plus size={20} /> Nuevo Paciente
        </button>
      </div>

      {/* Barra de herramientas */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500 dark:text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, DNI o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl py-3.5 pl-12 pr-4 text-sm outline-none focus:border-teal-500 dark:focus:border-teal-500 transition-shadow shadow-sm"
          />
        </div>
        <select
          value={filtroOS}
          onChange={(e) => setFiltroOS(e.target.value)}
          className="border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl py-3.5 px-4 text-sm outline-none focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium"
        >
          <option value="">Todas las OS</option>
          {obrasSocialesList.map(os => (
            <option key={os.id} value={os.nombre}>{os.nombre}</option>
          ))}
        </select>
      </div>

      {/* Contador de resultados */}
      {(searchTerm || filtroOS) && !loading && !error && (
        <p className="text-sm text-slate-900 dark:text-white font-medium -mt-3 mb-4">
          Mostrando {pacientesFiltrados.length} de {pacientes.length} paciente{pacientes.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Estado de carga */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Estado de error */}
      {error && !loading && (
        <ErrorState
          message="No se pudieron cargar los pacientes. Verificá la conexión e intentá de nuevo."
          onRetry={() => window.location.reload()}
        />
      )}

      {/* Sin resultados */}
      {!loading && !error && pacientes.length > 0 && pacientesFiltrados.length === 0 && (
        <EmptyState
          icon={SearchX}
          title="Sin resultados"
          description="Probá con otro nombre o filtro."
        />
      )}

      {/* Lista vacía */}
      {!loading && !error && pacientes.length === 0 && (
        <EmptyState
          icon={Users}
          title="No hay pacientes registrados"
          description="Comenzá agregando tu primer paciente."
          action={{ label: 'Agregar Paciente', onClick: openNewPaciente }}
        />
      )}

      {/* Grid de Tarjetas */}
      {!loading && !error && pacientesFiltrados.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pacientesFiltrados.map((p, idx) => (
            <div
              key={p.id}
              onClick={() => navigate(`/pacientes/${p.id}`)}
              className={`border rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg shadow-sm group relative overflow-hidden stagger-${Math.min(idx + 1, 12)} animate-fade-in-up cursor-pointer bg-white dark:bg-slate-900 dark:border-slate-800 ${
                p.sexo === 'F' ? 'border-pink-200' : p.sexo === 'M' ? 'border-sky-200' : 'border-purple-300'
              }`}
            >
              {/* Gradiente decorativo diagonal desde esquina inferior derecha */}
              {p.sexo === 'F' && (
                <div className="absolute inset-0 bg-gradient-to-tl from-pink-200/60 via-pink-100/30 to-transparent pointer-events-none rounded-2xl" />
              )}
              {p.sexo === 'M' && (
                <div className="absolute inset-0 bg-gradient-to-tl from-sky-200/60 via-sky-100/30 to-transparent pointer-events-none rounded-2xl" />
              )}

              {/* Icono decorativo grande en esquina inferior derecha */}
              {p.sexo === 'F' && (
                <div className="absolute bottom-2 right-2 pointer-events-none opacity-20">
                  <IconaNina size={90} color="#ec4899" />
                </div>
              )}
              {p.sexo === 'M' && (
                <div className="absolute bottom-2 right-2 pointer-events-none opacity-20">
                  <IconaNino size={90} color="#0ea5e9" />
                </div>
              )}

              {/* Hover actions */}
              <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                <span
                  onClick={(e) => { e.stopPropagation(); openEditPaciente(p); }}
                  title="Editar ficha"
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:text-teal-500 hover:border-teal-500/50 transition-all shadow-sm cursor-pointer"
                >
                  <User size={14} />
                </span>
                <span
                  onClick={(e) => { e.stopPropagation(); handleDelete(p); }}
                  title="Eliminar"
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:text-red-500 hover:border-red-500/50 transition-all shadow-sm cursor-pointer"
                >
                  <Trash2 size={14} />
                </span>
              </div>

              {/* Avatar + Nombre */}
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  p.sexo === 'F'
                    ? 'bg-pink-100 text-pink-500 dark:bg-pink-500/20 dark:text-pink-400'
                    : p.sexo === 'M'
                    ? 'bg-sky-100 text-sky-500 dark:bg-sky-500/20 dark:text-sky-400'
                    : `${getAvatarColor(p.nombre + p.apellido)} text-lg font-black uppercase`
                }`}>
                  {p.sexo === 'F' ? (
                    <IconaNina size={26} color="#ec4899" />
                  ) : p.sexo === 'M' ? (
                    <IconaNino size={26} color="#0ea5e9" />
                  ) : (
                    <span className="text-lg font-black uppercase">{getIniciales(p.nombre, p.apellido)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-base capitalize truncate text-slate-900 dark:text-white leading-tight">
                    {p.nombre} {p.apellido}
                  </h3>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold mt-0.5 ${
                    p.entrevista ? 'text-emerald-500' : 'text-orange-700 dark:text-yellow-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${p.entrevista ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                    {p.entrevista ? 'Activo' : 'Pendiente'}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2.5 text-sm text-slate-900 dark:text-white relative z-10">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={15} className="text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 shrink-0" />
                  <span className="capitalize truncate font-medium">{p.obra_social || 'Particular'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={15} className="text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 shrink-0" />
                  <span className="truncate font-medium">{p.telefono || 'Sin teléfono'}</span>
                </div>
                {calcularEdad(p.fecha_nacimiento) !== null && (
                  <div className="flex items-center gap-3">
                    <Calendar size={15} className="text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 shrink-0" />
                    <span className="font-medium">{calcularEdad(p.fecha_nacimiento)} años</span>
                  </div>
                )}
              </div>

              {/* Badges de alerta */}
              {(!p.entrevista || idsSinSesion.has(p.id)) && (
                <div className="flex flex-wrap gap-1.5 mt-2 relative z-10">
                  {!p.entrevista && (
                    <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 border border-orange-400 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      <AlertTriangle size={10} />
                      Entrevista pendiente
                    </span>
                  )}
                  {idsSinSesion.has(p.id) && (
                    <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 border border-red-400 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      <Clock size={10} />
                      +15 días sin sesión
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: NUEVO / EDITAR PACIENTE */}
      {/* ========================================== */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-300 dark:border-slate-800">

            <div className="border-b border-purple-300 dark:border-slate-800 bg-purple-100/50 dark:bg-slate-950 px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{editandoPaciente ? 'Editar Paciente' : 'Alta de Paciente'}</h2>
                <p className="text-sm mt-1 text-slate-900 dark:text-white">Datos de identificación y administrativos.</p>
              </div>
              <button onClick={() => { setShowNewModal(false); resetForm(); }} className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-white transition-colors">
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 text-sm">
              <form id="pacienteForm" onSubmit={handleSubmit} className="space-y-8">

                <section>
                  <h3 className="text-lg font-bold text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 flex items-center gap-2 mb-6 border-b border-teal-100 dark:border-teal-900/30 pb-2">
                    <User size={20} /> Datos Administrativos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 font-semibold text-slate-900 dark:text-white">Nombre Completo *</label>
                      <input
                        type="text"
                        value={nombre}
                        onChange={(e) => { setNombre(e.target.value); if (formErrors.nombre) setFormErrors(prev => ({ ...prev, nombre: undefined })); }}
                        onBlur={() => { if (nombre.trim() && nombre.trim().length < 2) setFormErrors(prev => ({ ...prev, nombre: 'El nombre debe tener al menos 2 caracteres.' })); }}
                        required
                        className={inputClass('nombre')}
                      />
                      {formErrors.nombre && (
                        <p className="flex items-center gap-1 mt-1.5 text-xs text-red-500"><AlertCircle size={12} /> {formErrors.nombre}</p>
                      )}
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold text-slate-900 dark:text-white">Apellidos *</label>
                      <input
                        type="text"
                        value={apellido}
                        onChange={(e) => { setApellido(e.target.value); if (formErrors.apellido) setFormErrors(prev => ({ ...prev, apellido: undefined })); }}
                        onBlur={() => { if (apellido.trim() && apellido.trim().length < 2) setFormErrors(prev => ({ ...prev, apellido: 'El apellido debe tener al menos 2 caracteres.' })); }}
                        required
                        className={inputClass('apellido')}
                      />
                      {formErrors.apellido && (
                        <p className="flex items-center gap-1 mt-1.5 text-xs text-red-500"><AlertCircle size={12} /> {formErrors.apellido}</p>
                      )}
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold text-slate-900 dark:text-white">Documento (DNI) *</label>
                      <input
                        type="text"
                        value={dni}
                        onChange={(e) => { setDni(e.target.value); if (formErrors.dni) setFormErrors(prev => ({ ...prev, dni: undefined })); }}
                        onBlur={() => { if (!dni.trim()) setFormErrors(prev => ({ ...prev, dni: 'El DNI es obligatorio.' })); }}
                        required
                        className={inputClass('dni')}
                      />
                      {formErrors.dni && (
                        <p className="flex items-center gap-1 mt-1.5 text-xs text-red-500"><AlertCircle size={12} /> {formErrors.dni}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block mb-2 font-semibold text-slate-900 dark:text-white">Nacimiento</label>
                        <input type="date" value={fechaNacimiento} onChange={(e)=>setFechaNacimiento(e.target.value)} className="w-full rounded-xl p-3 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 dark:[&::-webkit-calendar-picker-indicator]:invert" />
                      </div>
                      <div>
                        <label className="block mb-2 font-semibold text-slate-900 dark:text-white">Edad</label>
                        <div className="w-full rounded-xl p-3 border border-purple-300 dark:border-slate-800 bg-purple-100/50 dark:bg-slate-900 text-slate-900 dark:text-white min-h-[46px]">
                          {calcularEdad(fechaNacimiento) !== null ? `${calcularEdad(fechaNacimiento)} años` : <span className="text-slate-900 dark:text-white text-xs">—</span>}
                        </div>
                      </div>
                      <div>
                        <label className="block mb-2 font-semibold text-slate-900 dark:text-white">Sexo</label>
                        <select value={sexo} onChange={(e)=>setSexo(e.target.value)} className="w-full rounded-xl p-3 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500">
                          <option value="">Seleccionar</option>
                          <option value="M">Masculino</option>
                          <option value="F">Femenino</option>
                          <option value="X">Otro</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold text-slate-900 dark:text-white">Domicilio Actual</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500 dark:text-slate-500" size={18}/>
                        <input type="text" value={domicilio} onChange={(e)=>setDomicilio(e.target.value)} className="w-full rounded-xl p-3 pl-10 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 font-semibold text-slate-900 dark:text-white">Teléfono</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500 dark:text-slate-500" size={18}/>
                          <input
                            type="text"
                            value={telefono}
                            onChange={(e) => { setTelefono(e.target.value); if (formErrors.telefono) setFormErrors(prev => ({ ...prev, telefono: undefined })); }}
                            onBlur={() => { if (telefono && !/^[\d\s\-().+]+$/.test(telefono)) setFormErrors(prev => ({ ...prev, telefono: 'Formato de teléfono inválido.' })); }}
                            className={inputClass('telefono')}
                          />
                        </div>
                        {formErrors.telefono && (
                          <p className="flex items-center gap-1 mt-1.5 text-xs text-red-500"><AlertCircle size={12} /> {formErrors.telefono}</p>
                        )}
                      </div>
                      <div>
                        <label className="block mb-2 font-semibold text-slate-900 dark:text-white">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500 dark:text-slate-500" size={18}/>
                          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full rounded-xl p-3 pl-10 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block mb-2 font-semibold text-slate-900 dark:text-white">Cobertura Médica</label>
                      <select value={obraSocial} onChange={(e)=>setObraSocial(e.target.value)} className="w-full rounded-xl p-3 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500">
                        <option value="">Particular</option>
                        <option value="Obra Social">Obra Social</option>
                        {obrasSocialesList.filter(os => os.nombre !== 'Obra Social').map(os => (
                          <option key={os.id} value={os.nombre}>{os.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block mb-2 font-semibold text-slate-900 dark:text-white">Nº de Afiliado</label>
                      <input type="text" value={nroAfiliado} onChange={(e)=>setNroAfiliado(e.target.value)} disabled={!obraSocial} className="w-full rounded-xl p-3 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900" />
                    </div>

                    <div>
                      <label className="block mb-2 font-semibold text-slate-900 dark:text-white">Inicio de Sesiones</label>
                      <input type="date" value={inicioSesiones} onChange={(e)=>setInicioSesiones(e.target.value)} className="w-full rounded-xl p-3 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 dark:[&::-webkit-calendar-picker-indicator]:invert" />
                    </div>

                    <div className="md:col-span-2 mt-2">
                      <label className="block mb-2 font-semibold text-slate-900 dark:text-white">Motivo de Consulta Breve</label>
                      <textarea value={motivo} onChange={(e)=>setMotivo(e.target.value)} rows="2" className="w-full rounded-xl p-3 outline-none transition-colors resize-none border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500"></textarea>
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold text-slate-900 dark:text-white">Derivada por</label>
                      <input type="text" value={derivadaPor} onChange={(e)=>setDerivadaPor(e.target.value)} className="w-full rounded-xl p-3 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500" />
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold text-slate-900 dark:text-white">CUD</label>
                      <input type="text" value={cud} onChange={(e)=>setCud(e.target.value)} className="w-full rounded-xl p-3 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block mb-2 font-semibold text-slate-900 dark:text-white">Diagnóstico</label>
                      <textarea value={diagnostico} onChange={(e)=>setDiagnostico(e.target.value)} rows="2" className="w-full rounded-xl p-3 outline-none transition-colors resize-none border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500"></textarea>
                    </div>
                    <div className="md:col-span-2 p-4 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20">
                      <label className="block mb-2 font-semibold text-red-600 dark:text-red-500">Contacto de Emergencia</label>
                      <input type="text" value={contactoEmergencia} onChange={(e)=>setContactoEmergencia(e.target.value)} placeholder="Nombre y teléfono..." className="w-full rounded-xl p-3 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500" />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 flex items-center gap-2 mb-4 border-b border-teal-100 dark:border-teal-900/30 pb-2">
                    <ShieldCheck size={20} /> Documentación Legal (Ley 26.529)
                  </h3>
                  <div className="p-5 rounded-xl border border-purple-300 dark:border-slate-800 bg-purple-100/50 dark:bg-slate-950">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="mt-0.5">
                        <input type="checkbox" required={!editandoPaciente} checked={consentimiento} onChange={(e)=>setConsentimiento(e.target.checked)} className="w-4 h-4 accent-teal-600 dark:accent-teal-500" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">Consentimiento Informado y Confidencialidad</p>
                        <p className="text-xs mt-1 leading-relaxed text-slate-900 dark:text-white">
                          El paciente o tutor legal ha sido informado sobre la protección de sus datos personales y de salud. Se garantiza la confidencialidad absoluta.
                        </p>
                      </div>
                    </label>
                    <div className="mt-4 pt-4 border-t border-purple-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => imprimirConsentimiento({ nombre, apellido, dni, fechaNacimiento })}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-pink-500 hover:bg-pink-600 text-white transition-colors"
                      >
                        <Printer size={16} /> Imprimir Consentimiento
                      </button>
                    </div>
                  </div>
                </section>

              </form>

              {/* â”€â”€ TURNOS DEL PACIENTE â”€â”€ */}
              {editandoPaciente && (
                <section className="mt-6">
                  <button
                    type="button"
                    onClick={() => setTurnosExpandido(v => !v)}
                    className="w-full text-lg font-bold text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 flex items-center justify-between gap-2 mb-4 border-b border-teal-100 dark:border-teal-900/30 pb-2"
                  >
                    <span className="flex items-center gap-2"><Calendar size={20} /> Turnos Asignados</span>
                    {turnosExpandido ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {turnosExpandido && (
                    loadingTurnos ? (
                      <p className="text-sm text-slate-900 dark:text-white py-2">Cargando turnos...</p>
                    ) : turnosPaciente.length === 0 ? (
                      <p className="text-sm text-slate-900 dark:text-white py-2">No hay turnos registrados para este paciente.</p>
                    ) : (
                      <div className="space-y-2">
                        {turnosPaciente.map(t => (
                          <div key={t.id} className="rounded-xl border border-purple-300 dark:border-slate-800 bg-purple-100/50 dark:bg-slate-950 overflow-hidden">
                            {editandoTurno?.id === t.id ? (
                              /* â”€â”€ FORMULARIO DE EDICIÃ“N â”€â”€ */
                              <div className="p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block mb-1 text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Fecha</label>
                                    <input type="date" value={turnoForm.fecha} onChange={e => setTurnoForm(f => ({ ...f, fecha: e.target.value }))} className="w-full rounded-lg p-2.5 text-sm outline-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-teal-500 dark:[&::-webkit-calendar-picker-indicator]:invert" />
                                  </div>
                                  <div>
                                    <label className="block mb-1 text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Hora</label>
                                    <TimePicker value={turnoForm.hora} onChange={val => setTurnoForm(f => ({ ...f, hora: val }))} className="w-full rounded-lg p-2.5 text-sm outline-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-teal-500" />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block mb-1 text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Consultorio</label>
                                    <select value={turnoForm.consultorio} onChange={e => setTurnoForm(f => ({ ...f, consultorio: e.target.value }))} className="w-full rounded-lg p-2.5 text-sm outline-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-teal-500">
                                      <option value="">Seleccionar...</option>
                                      {consultorios.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block mb-1 text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Estado</label>
                                    <select value={turnoForm.estado} onChange={e => setTurnoForm(f => ({ ...f, estado: e.target.value }))} className="w-full rounded-lg p-2.5 text-sm outline-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-teal-500">
                                      <option value="pendiente">Pendiente</option>
                                      <option value="confirmado">Confirmado</option>
                                      <option value="inasistencia">Inasistencia</option>
                                      <option value="cancelado">Cancelado</option>
                                    </select>
                                  </div>
                                </div>
                                <div>
                                  <label className="block mb-1 text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Observaciones</label>
                                  <input type="text" value={turnoForm.observaciones || ''} onChange={e => setTurnoForm(f => ({ ...f, observaciones: e.target.value }))} className="w-full rounded-lg p-2.5 text-sm outline-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-teal-500" />
                                </div>
                                <div className="flex gap-2 justify-end pt-1">
                                  <button type="button" onClick={() => setEditandoTurno(null)} className="px-4 py-1.5 text-sm font-bold rounded-lg text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
                                  <button type="button" onClick={handleGuardarTurno} disabled={submittingTurno} className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors disabled:opacity-60">
                                    <Check size={14} /> Guardar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* â”€â”€ FILA DE LECTURA â”€â”€ */
                              <div className="flex items-center justify-between gap-3 px-4 py-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <Calendar size={16} className="text-teal-500 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                                      {new Date(t.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                      <span className="ml-2 text-slate-900 dark:text-white font-normal">{t.hora?.slice(0, 5)}</span>
                                    </p>
                                    <p className="text-xs text-slate-900 dark:text-white truncate">{t.consultorio}{t.observaciones ? ` Â· ${t.observaciones}` : ''}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${(estadoTurnoConfig[t.estado] || estadoTurnoConfig.pendiente).color}`}>
                                    {(estadoTurnoConfig[t.estado] || estadoTurnoConfig.pendiente).label}
                                  </span>
                                  <button type="button" onClick={() => { setEditandoTurno(t); setTurnoForm({ fecha: t.fecha?.slice(0,10), hora: t.hora?.slice(0,5), consultorio: t.consultorio, observaciones: t.observaciones || '', estado: t.estado }); }} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-white transition-colors">
                                    <Pencil size={14} />
                                  </button>
                                  <button type="button" onClick={() => handleEliminarTurno(t)} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors">
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </section>
              )}

            </div>

            <div className="border-t border-purple-300 dark:border-slate-800 bg-purple-100/50 dark:bg-slate-950 px-6 py-4 flex justify-between items-center gap-3 shrink-0">
              <div>
                {editandoPaciente && (
                  <button
                    type="button"
                    onClick={() => { setShowNewModal(false); resetForm(); navigate('/turnos', { state: { pacienteId: editandoPaciente } }); }}
                    className="flex items-center gap-2 px-5 py-2.5 font-bold rounded-xl transition-colors bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/20 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800"
                  >
                    <Calendar size={16} /> Nuevo Turno
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowNewModal(false); resetForm(); }}
                  className="px-6 py-2.5 font-bold rounded-xl transition-colors text-slate-900 hover:bg-slate-200 dark:text-white dark:hover:bg-slate-800"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <Button
                  type="submit"
                  form="pacienteForm"
                  loading={submitting}
                >
                  {editandoPaciente ? 'Guardar Cambios' : 'Crear Paciente'}
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}










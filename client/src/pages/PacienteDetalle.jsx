import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TimePicker from '../components/ui/TimePicker';
import { getPacienteById, actualizarPaciente, getSesiones } from '../services/pacientesService';
import { getEvaluaciones, eliminarEvaluacion } from '../services/evaluacionesService';
import { getObrasSociales } from '../services/obrasSocialesService';
import { getTurnos, crearTurno, actualizarTurno, eliminarTurno } from '../services/turnosService';
import { getConsultorios } from '../services/consultoriosService';
import {
  ArrowLeft, FileText, ClipboardList, ClipboardCheck, User, Phone, Mail, MapPin,
  Calendar, ShieldCheck, Trash2, Edit, Eye, Plus, Star, Check, X, Clock
} from 'lucide-react';
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
                    {obrasSocialesList.map(os => (
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
  }, [id]);

  useEffect(() => {
    if (tabActivo === 'sesiones') cargarSesiones();
  }, [tabActivo]);

  useEffect(() => {
    if (tabActivo === 'evaluaciones') cargarEvaluaciones();
  }, [tabActivo]);

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
    if (tabActivo === 'turnos') cargarTurnos();
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

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => navigate(`/pacientes/${id}/entrevista`)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors shadow-lg shadow-amber-500/5"
        >
          <FileText size={18} /> Entrevista de Admisión
        </button>
        <button
          onClick={() => setTabActivo(tabActivo === 'sesiones' ? null : 'sesiones')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-colors shadow-lg ${
            tabActivo === 'sesiones'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
              : 'bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20'
          }`}
        >
          <ClipboardList size={18} /> Sesiones
        </button>
        <button
          onClick={() => setTabActivo(tabActivo === 'evaluaciones' ? null : 'evaluaciones')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-colors shadow-lg ${
            tabActivo === 'evaluaciones'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'bg-teal-500/10 text-teal-400 border border-teal-500/30 hover:bg-teal-500/20'
          }`}
        >
          <ClipboardCheck size={18} /> Evaluaciones
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
            <button
              onClick={() => { setShowNuevoTurno(v => !v); setTurnoFormErrors({}); }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-slate-900 dark:text-white transition-colors"
            >
              <Plus size={16} /> Nuevo Turno
            </button>
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
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Clock size={15} className="text-teal-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-slate-200 text-sm">
                            {new Date(t.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            <span className="ml-2 text-teal-400 font-bold">{t.hora?.slice(0, 5)}</span>
                          </p>
                          <p className="text-xs text-slate-900 truncate">{t.consultorio}{t.observaciones ? ` Â· ${t.observaciones}` : ''}</p>
                        </div>
                      </div>
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
            <button
              onClick={() => navigate(`/pacientes/${id}/sesiones/nueva`)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
            >
              <Plus size={16} /> Nueva Sesión
            </button>
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
        </div>
      )}

      {/* Editar paciente modal */}
      <EditarPacienteModal
        show={showEditPaciente}
        onClose={() => setShowEditPaciente(false)}
        paciente={paciente}
        onSaved={cargarPaciente}
      />

    </div>
  );
}












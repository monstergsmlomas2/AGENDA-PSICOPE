import { useState, useEffect } from 'react';
import { Settings, MessageCircle, ChevronDown, ChevronUp, Save, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import {
  getConfiguracionNotificaciones,
  updateConfiguracionNotificaciones,
} from '../services/configuracionService';
import TimePicker from '../components/ui/TimePicker';

function SwitchToggle({ valor, onChange, label, descripcion }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
        <p className="text-xs text-slate-900 dark:text-gray-400 mt-0.5">{descripcion}</p>
      </div>
      <button
        onClick={() => onChange(!valor)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
          valor ? 'bg-pink-500 dark:bg-blue-600' : 'bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-purple-100 transition-transform ${
            valor ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function VariableChip({ children }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono bg-pink-100 dark:bg-gray-700 text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 border border-pink-300 dark:border-gray-600">
      {children}
    </span>
  );
}

export default function Configuracion() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plantillasAbiertas, setPlantillasAbiertas] = useState(false);

  // Estado del formulario
  const [notificacionesPacientes, setNotificacionesPacientes] = useState(true);
  const [notificacionesProfesional, setNotificacionesProfesional] = useState(true);
  const [telefonoProfesional, setTelefonoProfesional] = useState('');
  const [horaEnvio, setHoraEnvio] = useState('17:00');
  const [mensajePaciente, setMensajePaciente] = useState(
    'Hola {nombre}! Te recordamos que tenés turno mañana {fecha} a las {hora} en {consultorio}. Ante cualquier cambio comunicate con nosotros. ¡Hasta mañana!'
  );
  const [mensajeProfesional, setMensajeProfesional] = useState(
    'Recordatorio: mañana {fecha} tenés {cantidad} turno(s):\n{lista_turnos}'
  );

  // Cargar configuración al montar
  useEffect(() => {
    const cargarConfig = async () => {
      try {
        const config = await getConfiguracionNotificaciones();
        if (config) {
          setNotificacionesPacientes(config.notificaciones_pacientes ?? true);
          setNotificacionesProfesional(config.notificaciones_profesional ?? true);
          setTelefonoProfesional(config.telefono_profesional || '');
          setHoraEnvio(config.hora_envio || '17:00');
          setMensajePaciente(
            config.mensaje_paciente ||
              'Hola {nombre}! Te recordamos que tenés turno mañana {fecha} a las {hora} en {consultorio}. Ante cualquier cambio comunicate con nosotros. ¡Hasta mañana!'
          );
          setMensajeProfesional(
            config.mensaje_profesional ||
              'Recordatorio: mañana {fecha} tenés {cantidad} turno(s):\n{lista_turnos}'
          );
        }
      } catch (error) {
        console.error('Error al cargar configuración:', error);
        toast.error('Error', 'No se pudo cargar la configuración');
      } finally {
        setLoading(false);
      }
    };

    cargarConfig();
  }, []);

  const handleGuardar = async () => {
    setSaving(true);
    try {
      const result = await updateConfiguracionNotificaciones({
        notificaciones_pacientes: notificacionesPacientes,
        notificaciones_profesional: notificacionesProfesional,
        telefono_profesional: telefonoProfesional,
        hora_envio: horaEnvio,
        mensaje_paciente: mensajePaciente,
        mensaje_profesional: mensajeProfesional,
      });

      if (result) {
        toast.success('Configuración guardada', 'Los cambios se aplicaron correctamente.');
      } else {
        toast.error('Error', 'No se pudo guardar la configuración');
      }
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      toast.error('Error', 'No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* â”€â”€â”€ Header â”€â”€â”€ */}
      <div className="flex items-center gap-3">
        <div className="bg-pink-100 dark:bg-teal-500/15 p-2 rounded-xl">
          <Settings size={22} className="text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Configuración</h1>
          <p className="text-sm text-slate-900 dark:text-gray-400">Administrá las preferencias del sistema</p>
        </div>
      </div>

      {/* â”€â”€â”€ Sección: Notificaciones WhatsApp â”€â”€â”€ */}
      <div className="bg-white dark:bg-gray-900 border border-purple-300 dark:border-gray-700 rounded-2xl overflow-hidden">
        {/* Título de sección */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-purple-300 dark:border-gray-700">
          <MessageCircle size={20} className="text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Notificaciones WhatsApp</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* â”€â”€â”€ Switch: Recordatorios a pacientes â”€â”€â”€ */}
          <SwitchToggle
            valor={notificacionesPacientes}
            onChange={setNotificacionesPacientes}
            label="Enviar recordatorio automático a pacientes"
            descripcion={`Se envía a las ${horaEnvio} hs del día anterior al turno`}
          />

          {/* â”€â”€â”€ Divisor â”€â”€â”€ */}
          <div className="border-t border-purple-300 dark:border-gray-700" />

          {/* â”€â”€â”€ Switch: Recordatorios al profesional â”€â”€â”€ */}
          <SwitchToggle
            valor={notificacionesProfesional}
            onChange={setNotificacionesProfesional}
            label="Recibir resumen diario de turnos"
            descripcion="Se envía un resumen con todos los turnos del día siguiente"
          />

          {/* â”€â”€â”€ Teléfono del profesional (solo si activo) â”€â”€â”€ */}
          {notificacionesProfesional && (
            <div className="space-y-2 pl-0">
              <label className="block text-sm font-medium text-slate-900 dark:text-white">
                Teléfono del profesional
              </label>
              <input
                type="text"
                value={telefonoProfesional}
                onChange={(e) => setTelefonoProfesional(e.target.value)}
                placeholder="Ej: 1138057772 (sin +54)"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-pink-300 dark:border-gray-600 text-slate-900 dark:text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-teal-500 focus:border-transparent transition-colors"
              />
              <p className="text-xs text-slate-900 dark:text-gray-400">
                Sin código de país, solo el número argentino
              </p>
            </div>
          )}

          {/* â”€â”€â”€ Horario de envío â”€â”€â”€ */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-900 dark:text-white">Horario de envío</h3>
            <p className="text-xs text-slate-900 dark:text-gray-400">
              Los recordatorios se envían a las:
            </p>
            <TimePicker
              value={horaEnvio}
              onChange={(val) => setHoraEnvio(val)}
              className="bg-pink-100 dark:bg-gray-700 border border-pink-300 dark:border-gray-600 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-teal-500 focus:border-transparent transition-colors w-fit"
            />
            <p className="text-xs text-slate-900 dark:text-gray-400">
              Aplicado tanto a pacientes como al profesional
            </p>
            <p className="text-xs text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400">
              Actualmente configurado: {horaEnvio} hs
            </p>
          </div>

          {/* â”€â”€â”€ Divisor â”€â”€â”€ */}
          <div className="border-t border-purple-300 dark:border-gray-700" />

          {/* â”€â”€â”€ Plantillas de mensajes (colapsable) â”€â”€â”€ */}
          <div>
            <button
              onClick={() => setPlantillasAbiertas(!plantillasAbiertas)}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="text-sm font-medium text-slate-900 dark:text-white">Personalizar mensajes</span>
              {plantillasAbiertas ? (
                <ChevronUp size={18} className="text-slate-900 dark:text-gray-400" />
              ) : (
                <ChevronDown size={18} className="text-slate-900 dark:text-gray-400" />
              )}
            </button>

            {plantillasAbiertas && (
              <div className="mt-4 space-y-5">
                {/* Mensaje a pacientes */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-900 dark:text-white">
                    Mensaje para pacientes
                  </label>
                  <textarea
                    value={mensajePaciente}
                    onChange={(e) => setMensajePaciente(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-pink-300 dark:border-gray-600 text-slate-900 dark:text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-teal-500 focus:border-transparent transition-colors resize-y"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    <VariableChip>{'{nombre}'}</VariableChip>
                    <VariableChip>{'{fecha}'}</VariableChip>
                    <VariableChip>{'{hora}'}</VariableChip>
                    <VariableChip>{'{consultorio}'}</VariableChip>
                  </div>
                </div>

                {/* Mensaje al profesional */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-900 dark:text-white">
                    Mensaje para el profesional
                  </label>
                  <textarea
                    value={mensajeProfesional}
                    onChange={(e) => setMensajeProfesional(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-pink-300 dark:border-gray-600 text-slate-900 dark:text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-teal-500 focus:border-transparent transition-colors resize-y"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    <VariableChip>{'{fecha}'}</VariableChip>
                    <VariableChip>{'{cantidad}'}</VariableChip>
                    <VariableChip>{'{lista_turnos}'}</VariableChip>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* â”€â”€â”€ Footer con botón guardar â”€â”€â”€ */}
        <div className="px-6 py-4 bg-purple-100/50 dark:bg-gray-950/50 border-t border-purple-300 dark:border-gray-700 flex justify-end">
          <button
            onClick={handleGuardar}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-500 dark:bg-teal-600 hover:bg-pink-400 dark:hover:bg-teal-500 text-slate-900 dark:text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </div>
    </div>
  );
}










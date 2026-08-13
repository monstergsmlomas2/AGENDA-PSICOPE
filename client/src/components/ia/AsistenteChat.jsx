import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Bot, Send, Trash2, User, Plus, Pencil, MessageSquare } from 'lucide-react';
import PacienteSelect from './PacienteSelect.jsx';
import {
  chatClinico,
  listarConversaciones,
  obtenerConversacion,
  renombrarConversacion,
  eliminarConversacion,
} from '../../services/iaService.js';
import { useToast } from '../../hooks/useToast.js';
import { useConfirm } from '../../hooks/useConfirm.jsx';

const LS_PACIENTE = 'panel_ia_paciente';
const LS_CONVERSACION = 'panel_ia_conversacion';

// "hoy", "ayer", "hace 3 días", o la fecha si es más viejo
function fechaRelativa(iso) {
  if (!iso) return '';
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} días`;
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

/**
 * Chat del Asistente Clínico con historial persistente.
 *
 * Dos modos:
 * - Panel de IA: se pasa `pacientes` y el profesional elige el contexto en el selector.
 * - Ficha del paciente: se pasa `pacienteFijo` y el selector no se muestra.
 *
 * Cada modo recuerda su propio hilo abierto, así abrir el chat desde la ficha de
 * un paciente no pisa lo que el profesional estaba mirando en el Panel de IA.
 */
export default function AsistenteChat({ pacientes = [], pacienteFijo = null }) {
  const modoFijo = Boolean(pacienteFijo);
  const claveConversacion = modoFijo ? `${LS_CONVERSACION}_p${pacienteFijo.id}` : LS_CONVERSACION;

  const [pacienteId, setPacienteId] = useState(() =>
    modoFijo ? String(pacienteFijo.id) : (localStorage.getItem(LS_PACIENTE) || '')
  );
  const [conversacionId, setConversacionId] = useState(() => localStorage.getItem(claveConversacion) || null);
  const [conversaciones, setConversaciones] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cargandoHilo, setCargandoHilo] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [tituloEditado, setTituloEditado] = useState('');
  const [listaVisible, setListaVisible] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const toast = useToast();
  const { confirm, ConfirmModal } = useConfirm();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, loading]);

  // Recordar el contexto entre pestañas del panel y entre visitas a la página
  useEffect(() => {
    if (modoFijo) return;
    if (pacienteId) localStorage.setItem(LS_PACIENTE, pacienteId);
    else localStorage.removeItem(LS_PACIENTE);
  }, [pacienteId, modoFijo]);

  useEffect(() => {
    if (conversacionId) localStorage.setItem(claveConversacion, String(conversacionId));
    else localStorage.removeItem(claveConversacion);
  }, [conversacionId, claveConversacion]);

  const cargarLista = useCallback(async () => {
    try {
      const data = await listarConversaciones(pacienteId || 'general');
      setConversaciones(data);
    } catch {
      /* la lista no es crítica: si falla, el chat sigue funcionando */
    }
  }, [pacienteId]);

  useEffect(() => { cargarLista(); }, [cargarLista]);

  const abrirConversacion = useCallback(async (id) => {
    setCargandoHilo(true);
    setListaVisible(false);
    try {
      const data = await obtenerConversacion(id);
      setConversacionId(data.conversacion.id);
      if (!modoFijo) {
        setPacienteId(data.conversacion.paciente_id ? String(data.conversacion.paciente_id) : '');
      }
      setMensajes(data.mensajes.map(m => ({ role: m.role, content: m.content })));
    } catch {
      // El hilo ya no existe (borrado desde otro dispositivo)
      setConversacionId(null);
      setMensajes([]);
    } finally {
      setCargandoHilo(false);
    }
  }, [modoFijo]);

  // Al montar, reabrir el último hilo que el profesional estaba mirando
  useEffect(() => {
    if (conversacionId) abrirConversacion(conversacionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pacienteSeleccionado = modoFijo
    ? pacienteFijo
    : pacientes.find(p => String(p.id) === String(pacienteId));

  const handleCambiarPaciente = (val) => {
    setPacienteId(val);
    setConversacionId(null);
    setMensajes([]);
    setInput('');
  };

  const handleNuevaConversacion = () => {
    setConversacionId(null);
    setMensajes([]);
    setInput('');
    setListaVisible(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleEnviar = async () => {
    const texto = input.trim();
    if (!texto || loading) return;

    setMensajes(prev => [...prev, { role: 'user', content: texto }]);
    setInput('');
    setLoading(true);

    try {
      const data = await chatClinico({
        mensaje: texto,
        conversacionId,
        pacienteId: pacienteId || null,
      });
      setMensajes(prev => [...prev, { role: 'assistant', content: data.respuesta }]);
      if (data.conversacionId && data.conversacionId !== conversacionId) {
        setConversacionId(data.conversacionId);
      }
      cargarLista();
    } catch (e) {
      toast.error(e.message || 'Error al consultar al asistente');
      setMensajes(prev => prev.slice(0, -1));
      setInput(texto);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const handleEliminar = async (conv) => {
    const ok = await confirm({
      title: 'Eliminar conversación',
      message: `Se va a borrar "${conv.titulo}" y todos sus mensajes. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await eliminarConversacion(conv.id);
      if (String(conv.id) === String(conversacionId)) {
        setConversacionId(null);
        setMensajes([]);
      }
      cargarLista();
      toast.success('Conversación eliminada');
    } catch (e) {
      toast.error(e.message || 'No se pudo eliminar');
    }
  };

  const handleGuardarTitulo = async (id) => {
    const titulo = tituloEditado.trim();
    setEditandoId(null);
    if (!titulo) return;

    try {
      await renombrarConversacion(id, titulo);
      setConversaciones(prev => prev.map(c => (c.id === id ? { ...c, titulo } : c)));
    } catch (e) {
      toast.error(e.message || 'No se pudo renombrar');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Selector de paciente + acciones */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setListaVisible(v => !v)}
          className="md:hidden flex items-center justify-center w-11 h-11 shrink-0 rounded-xl bg-white dark:bg-slate-800 border border-pink-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
          title="Ver conversaciones"
        >
          <MessageSquare size={16} />
        </button>

        {modoFijo ? (
          <p className="flex-1 min-w-0 text-xs text-slate-500 dark:text-slate-400">
            El asistente tiene acceso a las sesiones, evaluaciones e informes de {pacienteFijo.nombre}.
          </p>
        ) : (
          <div className="flex-1 min-w-0">
            <PacienteSelect
              pacientes={pacientes}
              value={pacienteId}
              onChange={handleCambiarPaciente}
              placeholder="Sin paciente (consulta general)"
            />
          </div>
        )}

        <button
          onClick={handleNuevaConversacion}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-pink-500 dark:bg-teal-600 hover:bg-pink-600 dark:hover:bg-teal-700 text-white text-xs font-semibold transition-colors shrink-0"
        >
          <Plus size={14} /> <span className="hidden sm:inline">Nueva</span>
        </button>
      </div>

      {/* Chip de contexto activo (solo en el Panel de IA: en la ficha es obvio) */}
      {!modoFijo && pacienteSeleccionado && (
        <div className="flex items-center gap-2 px-3 py-2 bg-pink-50 dark:bg-teal-500/10 border border-pink-200 dark:border-teal-500/30 rounded-xl text-xs text-pink-700 dark:text-teal-400 font-medium">
          <Bot size={13} />
          Contexto cargado: <span className="font-bold">{pacienteSeleccionado.apellido}, {pacienteSeleccionado.nombre}</span>
          <span className="hidden sm:inline text-pink-400 dark:text-teal-600">— el asistente tiene acceso a sus sesiones y evaluaciones</span>
        </div>
      )}

      <div className="flex gap-4">
        {/* Lista de conversaciones */}
        <aside className={`${listaVisible ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-56 shrink-0 gap-1.5 max-h-[520px] overflow-y-auto`}>
          <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {pacienteSeleccionado ? `Historial de ${pacienteSeleccionado.nombre}` : 'Consultas generales'}
          </p>

          {conversaciones.length === 0 && (
            <p className="px-2 py-3 text-xs text-slate-500 dark:text-slate-400">
              Todavía no hay conversaciones guardadas acá.
            </p>
          )}

          {conversaciones.map(c => {
            const activa = String(c.id) === String(conversacionId);
            return (
              <div
                key={c.id}
                className={`group relative rounded-xl border transition-colors ${
                  activa
                    ? 'bg-pink-100 dark:bg-teal-500/10 border-pink-300 dark:border-teal-500/40'
                    : 'bg-white dark:bg-slate-900 border-pink-100 dark:border-slate-800 hover:bg-pink-50 dark:hover:bg-slate-800'
                }`}
              >
                {editandoId === c.id ? (
                  <input
                    autoFocus
                    value={tituloEditado}
                    onChange={e => setTituloEditado(e.target.value)}
                    onBlur={() => handleGuardarTitulo(c.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleGuardarTitulo(c.id);
                      if (e.key === 'Escape') setEditandoId(null);
                    }}
                    className="w-full bg-transparent px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                ) : (
                  <>
                    <button
                      onClick={() => abrirConversacion(c.id)}
                      className="w-full text-left px-3 py-2.5 pr-14"
                    >
                      <p className={`text-xs font-semibold truncate ${
                        activa ? 'text-pink-700 dark:text-teal-400' : 'text-slate-900 dark:text-white'
                      }`}>
                        {c.titulo}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {c.cantidad_mensajes} msj · {fechaRelativa(c.actualizada_en)}
                      </p>
                    </button>
                    <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditandoId(c.id); setTituloEditado(c.titulo); }}
                        className="p-1 rounded-lg text-slate-400 hover:text-pink-600 dark:hover:text-teal-400"
                        title="Renombrar"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleEliminar(c)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-500"
                        title="Eliminar"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </aside>

        {/* Área de chat */}
        <div className={`${listaVisible ? 'hidden' : 'flex'} md:flex flex-1 min-w-0 flex-col gap-4`}>
          <div className="min-h-[320px] max-h-[420px] overflow-y-auto flex flex-col gap-3 bg-purple-50 dark:bg-slate-950 border border-pink-100 dark:border-slate-800 rounded-xl p-4">
            {cargandoHilo && (
              <div className="flex-1 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Loader2 size={15} className="animate-spin" /> Cargando conversación...
              </div>
            )}

            {!cargandoHilo && mensajes.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-teal-500/10 flex items-center justify-center">
                  <Bot size={24} className="text-pink-400 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Asistente clínico en psicopedagogía</p>
                  <p className="text-xs text-slate-900 dark:text-white mt-1">
                    {pacienteSeleccionado
                      ? `Consultá sobre ${pacienteSeleccionado.nombre}. El asistente conoce su historia.`
                      : 'Seleccioná un paciente para dar contexto, o hacé una consulta general.'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                    Todo lo que converses queda guardado y lo vas a encontrar en el historial.
                  </p>
                </div>
              </div>
            )}

            {!cargandoHilo && mensajes.map((m, i) => (
              <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                  m.role === 'user'
                    ? 'bg-pink-500 dark:bg-teal-600'
                    : 'bg-purple-100 dark:bg-slate-800'
                }`}>
                  {m.role === 'user'
                    ? <User size={14} className="text-white" />
                    : <Bot size={14} className="text-pink-500 dark:text-teal-400" />
                  }
                </div>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-pink-500 dark:bg-teal-600 text-white rounded-tr-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-pink-100 dark:border-slate-700 rounded-tl-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 flex-row">
                <div className="shrink-0 w-7 h-7 rounded-full bg-purple-100 dark:bg-slate-800 flex items-center justify-center">
                  <Bot size={14} className="text-pink-500 dark:text-teal-400" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white dark:bg-slate-900 border border-pink-100 dark:border-slate-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-pink-400 dark:bg-teal-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-pink-400 dark:bg-teal-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-pink-400 dark:bg-teal-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              rows={2}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribí tu consulta clínica... (Enter para enviar, Shift+Enter para nueva línea)"
              className="flex-1 bg-white dark:bg-slate-900 border border-pink-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-teal-500 resize-none placeholder-slate-400"
            />
            <button
              onClick={handleEnviar}
              disabled={!input.trim() || loading}
              className="flex items-center justify-center w-11 shrink-0 bg-pink-500 dark:bg-teal-600 hover:bg-pink-600 dark:hover:bg-teal-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Search, Edit, Trash2, X, Calendar, DollarSign, Hash, FileText, Users, AlertCircle } from 'lucide-react';
import { getObrasSociales, crearObraSocial, actualizarObraSocial, eliminarObraSocial } from '../services/obrasSocialesService';
import { useToast, SkeletonTable, ErrorState, EmptyState, Button } from '../components/ui';
import { useConfirm } from '../hooks/useConfirm';

export default function ObrasSociales() {
  const [obrasSociales, setObrasSociales] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Form states
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [sesionesAutorizadas, setSesionesAutorizadas] = useState(4);
  const [valorSesion, setValorSesion] = useState("");
  const [periodoRenovacion, setPeriodoRenovacion] = useState("mensual");
  const [observaciones, setObservaciones] = useState("");

  const { confirm, ConfirmModal } = useConfirm();

  const cargarData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getObrasSociales();
      setObrasSociales(Array.isArray(data) ? data : []);
    } catch {
      setError('No se pudieron cargar las obras sociales. Verificá tu conexión e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarData(); }, []);

  const resetForm = () => {
    setNombre(""); setCodigo(""); setSesionesAutorizadas(4);
    setValorSesion(""); setPeriodoRenovacion("mensual"); setObservaciones("");
    setEditing(null); setFormErrors({});
  };

  const openEdit = (os) => {
    setEditing(os.id);
    setNombre(os.nombre);
    setCodigo(os.codigo || "");
    setSesionesAutorizadas(os.sesiones_autorizadas || 4);
    setValorSesion(os.valor_sesion || "");
    setPeriodoRenovacion(os.periodo_renovacion || "mensual");
    setObservaciones(os.observaciones || "");
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!nombre || nombre.trim().length < 2) errors.nombre = 'El nombre debe tener al menos 2 caracteres.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const inputClass = (field) => `
    w-full rounded-xl p-3.5 outline-none transition-colors border shadow-sm font-medium
    ${formErrors[field]
      ? 'border-red-300 dark:border-red-500 bg-red-50 dark:bg-red-500/5 text-red-900 dark:text-red-200'
      : 'border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500'
    }
  `;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const data = { nombre, codigo, sesiones_autorizadas: Number(sesionesAutorizadas), valor_sesion: valorSesion ? Number(valorSesion) : null, periodo_renovacion: periodoRenovacion, observaciones };

      if (editing) {
        await actualizarObraSocial(editing, data);
      } else {
        await crearObraSocial(data);
      }

      resetForm();
      setShowModal(false);
      await cargarData();
    } catch {
      // Error handled by service
    } finally {
      setSubmitting(false);
    }
  };

  const toast = useToast();

  const handleDelete = async (id, nombreOS) => {
    const ok = await confirm({
      title: 'Eliminar obra social',
      message: `¿Estás seguro de que querés eliminar "${nombreOS}"? Los pacientes asociados a esta obra social podrían verse afectados.`,
      confirmLabel: 'Eliminar',
      variant: 'danger'
    });
    if (!ok) return;
    try {
      await eliminarObraSocial(id);
      await cargarData();
      toast.success('Obra social eliminada', `"${nombreOS}" fue eliminada correctamente.`);
    } catch {
      toast.error('Error', 'No se pudo eliminar la obra social.');
    }
  };

  const filtradas = obrasSociales.filter(os =>
    os.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (os.codigo && os.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="space-y-6 text-slate-900 dark:text-white">
        <div className="flex items-center justify-between mb-5">
          <div className="space-y-3">
            <div className="h-8 w-56 bg-pink-200 dark:bg-[#262626] rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-pink-200 dark:bg-[#262626] rounded animate-pulse" />
          </div>
          <div className="h-12 w-44 bg-pink-200 dark:bg-[#262626] rounded-xl animate-pulse" />
        </div>

        <div className="h-12 w-full max-w-md bg-pink-200 dark:bg-[#262626] rounded-xl animate-pulse mb-6" />

        <div className="bg-white dark:bg-[#141414] border border-purple-300 dark:border-[#333] rounded-2xl overflow-hidden">
          <SkeletonTable rows={6} cols={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorState
          title="Error al cargar obras sociales"
          message={error}
          onRetry={cargarData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 dark:text-white">

      <ConfirmModal />

      {/* Cabecera */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5 text-slate-900 dark:text-white">
            <span className="bg-pink-100 text-slate-900 font-bold dark:text-pink-600 dark:bg-teal-500/10 dark:text-teal-400 p-2.5 rounded-xl border border-teal-500/20 shadow-inner">
              <ShieldCheck size={24} />
            </span>
            Obras Sociales
          </h1>
          <p className="text-slate-900 dark:text-white mt-2 font-medium">Administración de coberturas médicas y valores de sesión.</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-6 py-2.5 rounded-xl transition-all font-bold shadow-lg shadow-teal-500/20 hover:-translate-y-0.5">
          <Plus size={20} /> Nueva Obra Social
        </button>
      </div>

      {/* Buscador */}
      <div className="mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500 dark:text-slate-500" size={20} />
          <input type="text" placeholder="Buscar por nombre o código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl py-3.5 pl-12 pr-4 text-sm outline-none focus:border-teal-500 dark:focus:border-teal-500 transition-shadow shadow-sm"
          />
        </div>
      </div>

      {/* Tabla */}
      {filtradas.length === 0 ? (
        <div className="bg-white dark:bg-[#141414] border border-purple-300 dark:border-[#333] rounded-2xl overflow-hidden shadow-sm">
          <EmptyState
            icon={ShieldCheck}
            title={searchTerm ? 'Sin resultados' : 'No hay obras sociales registradas'}
            description={searchTerm ? 'Probá con otro término de búsqueda.' : 'Agregá la primera obra social para empezar a gestionar coberturas.'}
            action={!searchTerm ? { label: 'Nueva Obra Social', onClick: () => { resetForm(); setShowModal(true); } } : undefined}
          />
        </div>
      ) : (
      <div className="bg-white dark:bg-[#141414] border border-purple-300 dark:border-[#333] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-purple-100/50 dark:bg-[#0f1115] border-b border-purple-300 dark:border-[#333]">
              <tr>
                <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">Nombre</th>
                <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">Código</th>
                <th className="text-center px-6 py-4 font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">Sesiones Autorizadas</th>
                <th className="text-right px-6 py-4 font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">Valor por Sesión</th>
                <th className="text-center px-6 py-4 font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">Renovación</th>
                <th className="text-center px-6 py-4 font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">Pacientes</th>
                <th className="text-right px-6 py-4 font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-100 dark:divide-[#262626]">
              {filtradas.map((os, idx) => (
                <tr key={os.id} className={`stagger-${Math.min(idx + 1, 12)} animate-fade-in-up hover:bg-slate-50 dark:hover:bg-[#1a1c23] transition-colors`}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="bg-teal-50 dark:bg-teal-500/10 p-2 rounded-lg text-teal-600 dark:text-teal-400">
                        <ShieldCheck size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white capitalize">{os.nombre}</p>
                        {os.observaciones && <p className="text-xs text-slate-900 mt-0.5 truncate max-w-[200px]">{os.observaciones}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-mono text-slate-900 dark:text-white">{os.codigo || '—'}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-lg font-bold text-xs">
                      <Calendar size={12} /> {os.sesiones_autorizadas}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {os.valor_sesion ? `$${Number(os.valor_sesion).toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="capitalize text-sm text-slate-900 dark:text-white">{os.periodo_renovacion}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-bold text-xs ${
                      Number(os.cantidad_pacientes) > 0
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900'
                    }`}>
                      <Users size={12} /> {os.cantidad_pacientes || 0}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(os)} className="p-2 rounded-lg text-slate-900 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-[#262626] transition-all">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(os.id, os.nombre)} className="p-2 rounded-lg text-slate-900 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-[#262626] transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* MODAL ALTA/EDICIÃ“N */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-[#141414] w-full max-w-lg mx-auto max-h-screen sm:max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-300 dark:border-[#333]">
            <div className="border-b border-purple-300 dark:border-[#262626] bg-purple-100/50 dark:bg-[#0f1115] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{editing ? 'Editar Obra Social' : 'Nueva Obra Social'}</h2>
                <p className="text-sm mt-1 text-slate-900 dark:text-white font-medium">{editing ? 'Actualizá los datos de la cobertura.' : 'Registrá una nueva obra social.'}</p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2.5 rounded-xl border border-purple-300 dark:border-[#333] bg-white dark:bg-[#1a1c23] hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-900 dark:text-slate-400 transition-colors shadow-sm">✕</button>
            </div>

            <div className="p-5 text-sm overflow-y-auto flex-1 custom-scrollbar">
              <form id="osForm" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="block mb-2 font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">Nombre *</label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => { setNombre(e.target.value); setFormErrors(prev => ({ ...prev, nombre: '' })); }}
                      onBlur={() => {
                        if (!nombre || nombre.trim().length < 2) setFormErrors(prev => ({ ...prev, nombre: 'El nombre debe tener al menos 2 caracteres.' }));
                        else setFormErrors(prev => ({ ...prev, nombre: '' }));
                      }}
                      className={inputClass('nombre')}
                      placeholder="Ej: OSDE, IOMA, Swiss Medical..."
                    />
                    {formErrors.nombre && (
                      <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1 font-medium">
                        <AlertCircle size={12} /> {formErrors.nombre}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-2 font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                      <Hash size={12} className="inline mr-1" /> Código
                    </label>
                    <input type="text" value={codigo} onChange={(e)=>setCodigo(e.target.value)} className="w-full rounded-xl p-3.5 outline-none transition-colors border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium" placeholder="Ej: OSDE-210" />
                  </div>
                  <div>
                    <label className="block mb-2 font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                      <Calendar size={12} className="inline mr-1" /> Sesiones Autorizadas
                    </label>
                    <input type="number" value={sesionesAutorizadas} onChange={(e)=>setSesionesAutorizadas(e.target.value)} min="1" className="w-full rounded-xl p-3.5 outline-none transition-colors border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium" />
                  </div>
                  <div>
                    <label className="block mb-2 font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                      <DollarSign size={12} className="inline mr-1" /> Valor por Sesión
                    </label>
                    <input type="number" step="0.01" value={valorSesion} onChange={(e)=>setValorSesion(e.target.value)} className="w-full rounded-xl p-3.5 outline-none transition-colors border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block mb-2 font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">Período de Renovación</label>
                    <select value={periodoRenovacion} onChange={(e)=>setPeriodoRenovacion(e.target.value)} className="w-full rounded-xl p-3.5 outline-none transition-colors border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium">
                      <option value="mensual">Mensual</option>
                      <option value="trimestral">Trimestral</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block mb-2 font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                    <FileText size={12} className="inline mr-1" /> Observaciones
                  </label>
                  <textarea value={observaciones} onChange={(e)=>setObservaciones(e.target.value)} rows="3" className="w-full rounded-xl p-3.5 outline-none transition-colors resize-none border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium" placeholder="Notas adicionales..."></textarea>
                </div>
              </form>
            </div>

            <div className="border-t border-purple-300 dark:border-[#262626] bg-purple-100/50 dark:bg-[#0f1115] px-4 sm:px-6 py-4 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => { setShowModal(false); resetForm(); }} disabled={submitting} className="px-5 py-2 font-bold rounded-xl transition-colors text-slate-900 hover:bg-slate-200 dark:text-white dark:hover:text-white disabled:opacity-50">Cancelar</button>
              <Button type="submit" form="osForm" loading={submitting}>
                {editing ? 'Guardar Cambios' : 'Crear Obra Social'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}









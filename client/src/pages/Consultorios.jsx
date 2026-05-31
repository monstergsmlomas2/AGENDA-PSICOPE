import { useState, useEffect } from 'react';
import { Building2, Plus, MapPin, Trash2, AlertCircle, Pencil, DollarSign } from 'lucide-react';
import { getConsultorios, crearConsultorio, actualizarConsultorio, eliminarConsultorio } from '../services/consultoriosService';
import { useToast, ErrorState, EmptyState, Button } from '../components/ui';
import { useConfirm } from '../hooks/useConfirm';

const formVacio = { nombre: '', direccion: '', monto_tratamiento: '', monto_evaluacion: '' };

export default function Consultorios() {
  const [consultorios, setConsultorios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [form, setForm] = useState(formVacio);

  const { confirm, ConfirmModal } = useConfirm();
  const toast = useToast();

  const cargarData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getConsultorios();
      setConsultorios(Array.isArray(data) ? data : []);
    } catch {
      setError('No se pudieron cargar los consultorios. Verificá tu conexión e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarData(); }, []);

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!form.nombre || form.nombre.trim().length < 2) errors.nombre = 'El nombre debe tener al menos 2 caracteres.';
    if (form.monto_tratamiento && isNaN(Number(form.monto_tratamiento))) errors.monto_tratamiento = 'Ingresá un número válido.';
    if (form.monto_evaluacion && isNaN(Number(form.monto_evaluacion))) errors.monto_evaluacion = 'Ingresá un número válido.';
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

  const openCreate = () => {
    setEditingId(null);
    setForm(formVacio);
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditingId(c.id);
    setForm({
      nombre: c.nombre || '',
      direccion: c.direccion || '',
      monto_tratamiento: c.monto_tratamiento != null ? String(c.monto_tratamiento) : '',
      monto_evaluacion: c.monto_evaluacion != null ? String(c.monto_evaluacion) : '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload = {
        nombre: form.nombre,
        direccion: form.direccion,
        color: 'teal',
        monto_tratamiento: form.monto_tratamiento !== '' ? Number(form.monto_tratamiento) : null,
        monto_evaluacion: form.monto_evaluacion !== '' ? Number(form.monto_evaluacion) : null,
      };
      if (editingId) {
        await actualizarConsultorio(editingId, payload);
        toast.success('Consultorio actualizado', 'Los cambios se guardaron correctamente.');
      } else {
        await crearConsultorio(payload);
        toast.success('Consultorio creado', 'El consultorio fue creado correctamente.');
      }
      setShowModal(false);
      setEditingId(null);
      await cargarData();
    } catch {
      toast.error('Error', editingId ? 'No se pudo actualizar el consultorio.' : 'No se pudo crear el consultorio.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Eliminar consultorio',
      message: '¿Estás seguro de que querés eliminar este consultorio? Los turnos asociados podrían verse afectados.',
      confirmLabel: 'Eliminar',
      variant: 'danger'
    });
    if (!ok) return;
    try {
      await eliminarConsultorio(id);
      await cargarData();
      toast.success('Consultorio eliminado', 'El consultorio fue eliminado correctamente.');
    } catch {
      toast.error('Error', 'No se pudo eliminar el consultorio.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 text-slate-900 dark:text-slate-200">
        <div className="flex items-center justify-between mb-5">
          <div className="space-y-3">
            <div className="h-8 w-56 bg-pink-200 dark:bg-[#262626] rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-pink-200 dark:bg-[#262626] rounded animate-pulse" />
          </div>
          <div className="h-12 w-40 bg-pink-200 dark:bg-[#262626] rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#141414] border border-purple-300 dark:border-[#262626] rounded-2xl p-6">
              <div className="space-y-4">
                <div className="h-5 w-3/4 bg-pink-200 dark:bg-[#262626] rounded animate-pulse" />
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-pink-200 dark:bg-[#262626] rounded-lg animate-pulse" />
                  <div className="flex-1 h-4 bg-pink-200 dark:bg-[#262626] rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorState title="Error al cargar consultorios" message={error} onRetry={cargarData} />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-200">

      <ConfirmModal />

      {/* Cabecera */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2.5 text-slate-900 dark:text-white tracking-tight">
            <span className="bg-pink-100 text-slate-900 font-bold dark:text-pink-600 dark:bg-teal-500/10 dark:text-teal-400 p-2.5 rounded-xl border border-teal-500/20">
              <Building2 size={24}/>
            </span>
            Sedes y Consultorios
          </h1>
          <p className="text-slate-900 font-bold dark:text-slate-400 mt-2 font-medium">Administrá los espacios físicos donde atendés a tus pacientes.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-6 py-2.5 rounded-xl transition-all font-bold shadow-lg shadow-teal-500/20 hover:-translate-y-0.5">
          <Plus size={20} /> Nueva Sede
        </button>
      </div>

      {/* Grilla de Tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {consultorios.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={Building2}
              title="No tenés consultorios cargados"
              description="Agregá tu primera sede para poder usarla en la agenda."
              action={{ label: 'Nueva Sede', onClick: openCreate }}
            />
          </div>
        )}

        {consultorios.map((c, idx) => (
          <div key={c.id} className={`stagger-${Math.min(idx + 1, 12)} animate-fade-in-up bg-white dark:bg-[#141414] border border-purple-300 dark:border-[#262626] rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-pink-500/50 dark:hover:border-teal-500/50 shadow-sm group relative`}>
            {/* Acciones */}
            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => openEdit(c)} className="text-slate-900 hover:text-teal-500 bg-slate-50 dark:bg-[#1a1c23] p-2 rounded-lg">
                <Pencil size={16} />
              </button>
              <button onClick={() => handleDelete(c.id)} className="text-slate-900 hover:text-red-500 bg-slate-50 dark:bg-[#1a1c23] p-2 rounded-lg">
                <Trash2 size={18} />
              </button>
            </div>

            <div className="mb-4">
              <h3 className="font-black text-xl capitalize text-slate-900 dark:text-white pr-16 truncate">
                {c.nombre}
              </h3>
            </div>

            <div className="space-y-3.5 text-sm text-slate-900 dark:text-slate-300 font-medium">
              <div className="flex items-start gap-3">
                <div className="bg-teal-50 dark:bg-teal-500/10 p-2 rounded-lg text-slate-900 dark:text-teal-400 mt-0.5"><MapPin size={16} /></div>
                <span className="leading-relaxed">{c.direccion || 'Sin dirección registrada'}</span>
              </div>

              {(c.monto_tratamiento != null || c.monto_evaluacion != null) && (
                <div className="flex items-start gap-3">
                  <div className="bg-pink-50 dark:bg-pink-500/10 p-2 rounded-lg text-pink-600 dark:text-pink-400 mt-0.5"><DollarSign size={16} /></div>
                  <div className="space-y-0.5">
                    {c.monto_tratamiento != null && (
                      <p className="text-xs">
                        <span className="text-slate-500 dark:text-slate-500">Tratamiento:</span>{' '}
                        <span className="font-bold text-slate-900 dark:text-white">${Number(c.monto_tratamiento).toLocaleString('es-AR')}</span>
                      </p>
                    )}
                    {c.monto_evaluacion != null && (
                      <p className="text-xs">
                        <span className="text-slate-500 dark:text-slate-500">Evaluación:</span>{' '}
                        <span className="font-bold text-slate-900 dark:text-white">${Number(c.monto_evaluacion).toLocaleString('es-AR')}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Alta / Edición Consultorio */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#141414] w-full max-w-xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-300 dark:border-[#262626]">

            <div className="border-b border-purple-300 dark:border-[#262626] bg-purple-100/50 dark:bg-[#0f1115] px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{editingId ? 'Editar Sede' : 'Nueva Sede'}</h2>
                <p className="text-sm mt-1 text-slate-900 font-bold dark:text-slate-400 font-medium">{editingId ? 'Modificá los datos del consultorio.' : 'Registrá un nuevo lugar de atención.'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2.5 rounded-xl border border-purple-300 dark:border-[#333] bg-white dark:bg-[#1a1c23] hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-900 dark:text-slate-400 transition-colors shadow-sm">✕</button>
            </div>

            <div className="p-5 text-sm overflow-y-auto flex-1 custom-scrollbar">
              <form id="consultorioForm" onSubmit={handleSubmit} className="space-y-5">

                <div>
                  <label className="block mb-2 font-bold text-slate-900 dark:text-slate-400 uppercase tracking-wider text-xs">Nombre de la Sede / Consultorio *</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setField('nombre', e.target.value)}
                    onBlur={() => {
                      if (!form.nombre || form.nombre.trim().length < 2)
                        setFormErrors(prev => ({ ...prev, nombre: 'El nombre debe tener al menos 2 caracteres.' }));
                    }}
                    placeholder="Ej: Consultorio 3 (Cámara Gesell)"
                    className={inputClass('nombre')}
                  />
                  {formErrors.nombre && (
                    <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1 font-medium">
                      <AlertCircle size={12} /> {formErrors.nombre}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 font-bold text-slate-900 dark:text-slate-400 uppercase tracking-wider text-xs">Dirección</label>
                  <input
                    type="text"
                    value={form.direccion}
                    onChange={(e) => setField('direccion', e.target.value)}
                    placeholder="Ej: Loria 123, Lomas de Zamora"
                    className="w-full rounded-xl p-3.5 outline-none transition-colors border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium"
                  />
                </div>

                <div className="border border-pink-200 dark:border-pink-500/20 bg-pink-50/50 dark:bg-pink-500/5 rounded-xl p-4 space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-400 uppercase tracking-wider mb-1">Tarifas del Profesional</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">Monto que percibís por paciente según tipo de atención. Podés dejarlo vacío y completarlo después.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 font-bold text-slate-900 dark:text-slate-400 uppercase tracking-wider text-xs">Tratamiento</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.monto_tratamiento}
                          onChange={(e) => setField('monto_tratamiento', e.target.value)}
                          placeholder="0.00"
                          className={`${inputClass('monto_tratamiento')} pl-7`}
                        />
                      </div>
                      {formErrors.monto_tratamiento && (
                        <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1 font-medium">
                          <AlertCircle size={12} /> {formErrors.monto_tratamiento}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block mb-2 font-bold text-slate-900 dark:text-slate-400 uppercase tracking-wider text-xs">Evaluación</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.monto_evaluacion}
                          onChange={(e) => setField('monto_evaluacion', e.target.value)}
                          placeholder="0.00"
                          className={`${inputClass('monto_evaluacion')} pl-7`}
                        />
                      </div>
                      {formErrors.monto_evaluacion && (
                        <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1 font-medium">
                          <AlertCircle size={12} /> {formErrors.monto_evaluacion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

              </form>
            </div>

            <div className="border-t border-purple-300 dark:border-[#262626] bg-purple-100/50 dark:bg-[#0f1115] px-6 py-4 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setShowModal(false)} disabled={submitting} className="px-5 py-2 font-bold rounded-xl transition-colors text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white disabled:opacity-50">Cancelar</button>
              <Button type="submit" form="consultorioForm" loading={submitting}>
                {editingId ? 'Guardar Cambios' : 'Guardar Sede'}
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

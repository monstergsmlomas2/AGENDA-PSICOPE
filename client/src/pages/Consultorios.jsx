import { useState, useEffect } from 'react';
import { Building2, Plus, MapPin, Trash2, AlertCircle } from 'lucide-react';
import { getConsultorios, crearConsultorio, eliminarConsultorio } from '../services/consultoriosService';
import { useToast, ErrorState, EmptyState, Button } from '../components/ui';
import { useConfirm } from '../hooks/useConfirm';

export default function Consultorios() {
  const [consultorios, setConsultorios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [color, setColor] = useState("teal");

  const { confirm, ConfirmModal } = useConfirm();

  const cargarData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getConsultorios();
      setConsultorios(Array.isArray(data) ? data : []);
    } catch {
      setError('No se pudieron cargar los consultorios. VerificÃ¡ tu conexiÃ³n e intentÃ¡ de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarData();
  }, []);

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
      await crearConsultorio({ nombre, direccion, color });
      setNombre(""); setDireccion(""); setColor("teal");
      setFormErrors({});
      setShowModal(false);
      await cargarData();
    } catch {
      // Error handled by service
    } finally {
      setSubmitting(false);
    }
  };

  const toast = useToast();

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Eliminar consultorio',
      message: 'Â¿EstÃ¡s seguro de que querÃ©s eliminar este consultorio? Los turnos asociados podrÃ­an verse afectados.',
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
        <ErrorState
          title="Error al cargar consultorios"
          message={error}
          onRetry={cargarData}
        />
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
          <p className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 mt-2 font-medium">AdministrÃ¡ los espacios fÃ­sicos donde atendÃ©s a tus pacientes.</p>
        </div>
        
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-6 py-2.5 rounded-xl transition-all font-bold shadow-lg shadow-teal-500/20 hover:-translate-y-0.5">
          <Plus size={20} /> Nueva Sede
        </button>
      </div>

      {/* Grilla de Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {consultorios.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={Building2}
              title="No tenÃ©s consultorios cargados"
              description="AgregÃ¡ tu primera sede para poder usarla en la agenda."
              action={{ label: 'Nueva Sede', onClick: () => setShowModal(true) }}
            />
          </div>
        )}

        {consultorios.map((c, idx) => (
          <div key={c.id} className={`stagger-${Math.min(idx + 1, 12)} animate-fade-in-up bg-white dark:bg-[#141414] border border-purple-300 dark:border-[#262626] rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-pink-500/50 dark:hover:border-teal-500/50 shadow-sm group relative`}>
            <button onClick={() => handleDelete(c.id)} className="absolute top-4 right-4 text-slate-900 hover:text-red-500 bg-slate-50 dark:bg-[#1a1c23] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
              <Trash2 size={18} />
            </button>
            
            <div className="mb-4">
              <h3 className="font-black text-xl capitalize text-slate-900 dark:text-white pr-8 truncate">
                {c.nombre}
              </h3>
            </div>
            
            <div className="space-y-3.5 text-sm text-slate-900 dark:text-slate-300 font-medium">
              <div className="flex items-start gap-3">
                <div className="bg-teal-50 dark:bg-teal-500/10 p-2 rounded-lg text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 mt-0.5"><MapPin size={16} /></div>
                <span className="leading-relaxed">{c.direccion || 'Sin direcciÃ³n registrada'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Alta Consultorio */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#141414] w-full max-w-xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-300 dark:border-[#262626]">

            <div className="border-b border-purple-300 dark:border-[#262626] bg-purple-100/50 dark:bg-[#0f1115] px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Nueva Sede</h2>
                <p className="text-sm mt-1 text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 font-medium">RegistrÃ¡ un nuevo lugar de atenciÃ³n.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2.5 rounded-xl border border-purple-300 dark:border-[#333] bg-white dark:bg-[#1a1c23] hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-900 dark:text-slate-400 transition-colors shadow-sm">âœ•</button>
            </div>

            <div className="p-5 text-sm overflow-y-auto flex-1 custom-scrollbar">
              <form id="consultorioForm" onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block mb-2 font-bold text-slate-900 dark:text-slate-400 uppercase tracking-wider text-xs">Nombre de la Sede / Consultorio *</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => { setNombre(e.target.value); setFormErrors(prev => ({ ...prev, nombre: '' })); }}
                    onBlur={() => {
                      if (!nombre || nombre.trim().length < 2) setFormErrors(prev => ({ ...prev, nombre: 'El nombre debe tener al menos 2 caracteres.' }));
                      else setFormErrors(prev => ({ ...prev, nombre: '' }));
                    }}
                    placeholder="Ej: Consultorio 3 (CÃ¡mara Gesell)"
                    className={inputClass('nombre')}
                  />
                  {formErrors.nombre && (
                    <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1 font-medium">
                      <AlertCircle size={12} /> {formErrors.nombre}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block mb-2 font-bold text-slate-900 dark:text-slate-400 uppercase tracking-wider text-xs">DirecciÃ³n</label>
                  <input type="text" value={direccion} onChange={(e)=>setDireccion(e.target.value)} placeholder="Ej: Loria 123, Lomas de Zamora" className="w-full rounded-xl p-3.5 outline-none transition-colors border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium" />
                </div>
              </form>
            </div>

            <div className="border-t border-purple-300 dark:border-[#262626] bg-purple-100/50 dark:bg-[#0f1115] px-6 py-4 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setShowModal(false)} disabled={submitting} className="px-5 py-2 font-bold rounded-xl transition-colors text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white disabled:opacity-50">Cancelar</button>
              <Button type="submit" form="consultorioForm" loading={submitting}>
                Guardar Sede
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}









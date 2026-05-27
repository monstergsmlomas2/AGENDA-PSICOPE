import { useState, useEffect } from 'react';
import { DollarSign, Plus, Search, Edit, Trash2, X, Calendar, CreditCard, Banknote, Receipt, TrendingUp, TrendingDown, Wallet, ShieldCheck, AlertCircle } from 'lucide-react';
import { getPagos, crearPago, actualizarPago, eliminarPago, getResumenMes } from '../services/pagosService';
import { getPacientes } from '../services/pacientesService';
import { useToast, Badge, SkeletonTable, ErrorState, EmptyState, Button } from '../components/ui';
import { useConfirm } from '../hooks/useConfirm';

const meses = [
  { value: '01', label: 'Enero' }, { value: '02', label: 'Febrero' }, { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' }, { value: '05', label: 'Mayo' }, { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' }, { value: '08', label: 'Agosto' }, { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' }, { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' },
];

export default function Pagos() {
  const [pagos, setPagos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [resumen, setResumen] = useState({ total_pagos: 0, total_cobrado: 0, total_pendiente: 0, total_facturado: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const hoy = new Date();
  const [mesFiltro, setMesFiltro] = useState(`${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Form states
  const [pacienteId, setPacienteId] = useState("");
  const [fecha, setFecha] = useState(hoy.toISOString().split('T')[0]);
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [tipoPago, setTipoPago] = useState("efectivo");
  const [estadoPago, setEstadoPago] = useState("pendiente");
  const [observaciones, setObservaciones] = useState("");
  const [nroSesion, setNroSesion] = useState("");

  const { confirm, ConfirmModal } = useConfirm();

  const cargarData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dataPagos, dataPacientes, dataResumen] = await Promise.all([
        getPagos({ mes: mesFiltro, estado: filtroEstado || undefined }),
        getPacientes(),
        getResumenMes(mesFiltro),
      ]);
      setPagos(Array.isArray(dataPagos) ? dataPagos : []);
      setPacientes(Array.isArray(dataPacientes) ? dataPacientes : []);
      setResumen(dataResumen || { total_pagos: 0, total_cobrado: 0, total_pendiente: 0, total_facturado: 0 });
    } catch {
      setError('No se pudieron cargar los pagos. VerificÃ¡ tu conexiÃ³n e intentÃ¡ de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarData(); }, [mesFiltro, filtroEstado]);

  const resetForm = () => {
    setPacienteId(""); setFecha(hoy.toISOString().split('T')[0]);
    setConcepto(""); setMonto(""); setTipoPago("efectivo");
    setEstadoPago("pendiente"); setObservaciones(""); setNroSesion("");
    setEditing(null); setFormErrors({});
  };

  const openEdit = (pago) => {
    setEditing(pago.id);
    setPacienteId(pago.paciente_id);
    setFecha(pago.fecha);
    setConcepto(pago.concepto || "");
    setMonto(pago.monto);
    setTipoPago(pago.tipo_pago || "efectivo");
    setEstadoPago(pago.estado);
    setObservaciones(pago.observaciones || "");
    setNroSesion(pago.nro_sesion_facturada || "");
    setShowModal(true);
  };

  const validatePagoForm = () => {
    const errors = {};
    if (!pacienteId) errors.pacienteId = 'DebÃ©s seleccionar un paciente.';
    if (!fecha) errors.fecha = 'La fecha es obligatoria.';
    if (!monto || Number(monto) <= 0) errors.monto = 'El monto debe ser un nÃºmero positivo.';
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
    if (!validatePagoForm()) return;
    setSubmitting(true);
    try {
      const data = {
        paciente_id: Number(pacienteId),
        fecha,
        concepto,
        monto: Number(monto),
        tipo_pago: tipoPago,
        estado: estadoPago,
        observaciones,
        nro_sesion_facturada: nroSesion ? Number(nroSesion) : null,
      };

      if (editing) {
        await actualizarPago(editing, data);
      } else {
        await crearPago(data);
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

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Eliminar pago',
      message: 'Â¿EstÃ¡s seguro de que querÃ©s eliminar este pago? Esta acciÃ³n no se puede deshacer.',
      confirmLabel: 'Eliminar',
      variant: 'danger'
    });
    if (!ok) return;
    try {
      await eliminarPago(id);
      await cargarData();
      toast.success('Pago eliminado', 'El pago fue eliminado correctamente.');
    } catch {
      toast.error('Error', 'No se pudo eliminar el pago.');
    }
  };

  const estadoBadge = (est) => {
    const config = {
      pagado: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-200 dark:border-green-500/30',
      pendiente: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30',
      deuda: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/30',
    };
    return `inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${config[est] || config.pendiente}`;
  };

  const tipoPagoConfig = {
    efectivo: { label: 'Efectivo', icon: Banknote },
    transferencia: { label: 'Transferencia', icon: CreditCard },
    obra_social: { label: 'Obra Social', icon: ShieldCheck },
    cheque: { label: 'Cheque', icon: Receipt },
  };

  const pagosFiltrados = pagos.filter(p => {
    if (!searchTerm) return true;
    const fullName = `${p.paciente_nombre} ${p.paciente_apellido}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) ||
      (p.concepto && p.concepto.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  if (loading) {
    return (
      <div className="space-y-6 text-slate-900 dark:text-slate-200">
        {/* Cabecera esqueleto */}
        <div className="flex items-center justify-between mb-5">
          <div className="space-y-3">
            <div className="h-8 w-56 bg-pink-200 dark:bg-[#262626] rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-pink-200 dark:bg-[#262626] rounded animate-pulse" />
          </div>
          <div className="h-12 w-40 bg-pink-200 dark:bg-[#262626] rounded-xl animate-pulse" />
        </div>

        {/* MÃ©tricas esqueleto */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#141414] border border-purple-300 dark:border-[#333] rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pink-200 dark:bg-[#262626] rounded-xl animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 bg-pink-200 dark:bg-[#262626] rounded animate-pulse" />
                  <div className="h-6 w-28 bg-pink-200 dark:bg-[#262626] rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabla esqueleto */}
        <div className="bg-white dark:bg-[#141414] border border-purple-300 dark:border-[#333] rounded-2xl overflow-hidden">
          <SkeletonTable rows={8} cols={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorState
          title="Error al cargar pagos"
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
          <h1 className="text-2xl font-bold flex items-center gap-2.5 text-slate-900 dark:text-white">
            <span className="bg-pink-100 text-slate-900 font-bold dark:text-pink-600 dark:bg-teal-500/10 dark:text-teal-400 p-2.5 rounded-xl border border-teal-500/20 shadow-inner">
              <DollarSign size={24} />
            </span>
            Pagos y FacturaciÃ³n
          </h1>
          <p className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 mt-2 font-medium">GestiÃ³n de cobros, facturaciÃ³n y resÃºmenes mensuales.</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-6 py-2.5 rounded-xl transition-all font-bold shadow-lg shadow-teal-500/20 hover:-translate-y-0.5">
          <Plus size={20} /> Nuevo Pago
        </button>
      </div>

      {/* Resumen Mensual */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 dark:bg-blue-500/10 p-3.5 rounded-xl text-blue-600 dark:text-blue-400">
            <Receipt size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 uppercase tracking-wider">Total Facturado</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              ${Number(resumen.total_facturado).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="bg-green-50 dark:bg-green-500/10 p-3.5 rounded-xl text-green-600 dark:text-green-400">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 uppercase tracking-wider">Total Cobrado</p>
            <h3 className="text-2xl font-black text-green-600 dark:text-green-400 mt-0.5">
              ${Number(resumen.total_cobrado).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="bg-yellow-50 dark:bg-yellow-500/10 p-3.5 rounded-xl text-yellow-600 dark:text-yellow-400">
            <TrendingDown size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 uppercase tracking-wider">Total Pendiente</p>
            <h3 className="text-2xl font-black text-yellow-600 dark:text-yellow-400 mt-0.5">
              ${Number(resumen.total_pendiente).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="bg-indigo-50 dark:bg-indigo-500/10 p-3.5 rounded-xl text-indigo-600 dark:text-indigo-400">
            <Wallet size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 uppercase tracking-wider">Cant. Pagos</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{resumen.total_pagos}</h3>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500 dark:text-slate-500" size={18} />
          <input type="text" placeholder="Buscar por paciente o concepto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-teal-500 dark:focus:border-teal-500 transition-shadow shadow-sm"
          />
        </div>
        <input type="month" value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)}
          className="border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-300 rounded-xl py-3 px-4 text-sm outline-none focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium dark:[&::-webkit-calendar-picker-indicator]:invert"
        />
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
          className="border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-300 rounded-xl py-3 px-4 text-sm outline-none focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium">
          <option value="">Todos los estados</option>
          <option value="pagado">Pagado</option>
          <option value="pendiente">Pendiente</option>
          <option value="deuda">Deuda</option>
        </select>
      </div>

      {/* Tabla */}
      {pagosFiltrados.length === 0 ? (
        <div className="bg-white dark:bg-[#141414] border border-purple-300 dark:border-[#333] rounded-2xl overflow-hidden shadow-sm">
          <EmptyState
            icon={DollarSign}
            title={searchTerm || mesFiltro || filtroEstado ? 'Sin resultados' : 'No hay pagos registrados'}
            description={searchTerm || mesFiltro || filtroEstado ? 'No hay pagos que coincidan con los filtros seleccionados.' : 'RegistrÃ¡ el primer pago para empezar a gestionar la facturaciÃ³n.'}
            action={!searchTerm && !mesFiltro && !filtroEstado ? { label: 'Nuevo Pago', onClick: () => { resetForm(); setShowModal(true); } } : undefined}
          />
        </div>
      ) : (
      <div className="bg-white dark:bg-[#141414] border border-purple-300 dark:border-[#333] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-purple-100/50 dark:bg-[#0f1115] border-b border-purple-300 dark:border-[#333]">
              <tr>
                <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Paciente</th>
                <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Fecha</th>
                <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Concepto</th>
                <th className="text-right px-6 py-4 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Monto</th>
                <th className="text-center px-6 py-4 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Tipo</th>
                <th className="text-center px-6 py-4 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Estado</th>
                <th className="text-right px-6 py-4 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-100 dark:divide-[#262626]">
              {pagosFiltrados.map((p, idx) => (
                <tr key={p.id} className={`stagger-${Math.min(idx + 1, 12)} animate-fade-in-up hover:bg-slate-50 dark:hover:bg-[#1a1c23] transition-colors`}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="bg-teal-50 dark:bg-teal-500/10 p-2 rounded-lg text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400">
                        <DollarSign size={18} />
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 dark:text-white capitalize">{p.paciente_nombre} {p.paciente_apellido}</p>
                        {pagos.some(px => px.paciente_id === p.paciente_id && px.estado === 'deuda') && (
                          <span className="bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] px-1.5 py-0.5 rounded font-bold">Deuda</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-slate-900 dark:text-slate-400">
                    {new Date(p.fecha + 'T12:00:00Z').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="px-6 py-5 text-slate-900 dark:text-slate-400 max-w-[200px] truncate">
                    {p.concepto || 'â€”'}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="font-bold text-slate-900 dark:text-white">
                      ${Number(p.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                    {p.nro_sesion_facturada && (
                      <span className="ml-2 text-[10px] text-slate-900">(SesiÃ³n #{p.nro_sesion_facturada})</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-center">
                    {(() => {
                      const cfg = tipoPagoConfig[p.tipo_pago] || { label: p.tipo_pago, icon: Receipt };
                      const IconTipo = cfg.icon;
                      return (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-900 dark:text-slate-400">
                          <IconTipo size={14} /> {cfg.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={estadoBadge(p.estado)}>
                      {p.estado === 'pagado' ? 'Pagado' : p.estado === 'pendiente' ? 'Pendiente' : 'Deuda'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="p-2 rounded-lg text-slate-900 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-[#262626] transition-all">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg text-slate-900 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-[#262626] transition-all">
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

      {/* MODAL: NUEVO / EDITAR PAGO */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#141414] w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-300 dark:border-[#333]">
            <div className="border-b border-purple-300 dark:border-[#262626] bg-purple-100/50 dark:bg-[#0f1115] px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{editing ? 'Editar Pago' : 'Nuevo Pago'}</h2>
                <p className="text-sm mt-1 text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 font-medium">RegistrÃ¡ un cobro o facturaciÃ³n.</p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2.5 rounded-xl border border-purple-300 dark:border-[#333] bg-white dark:bg-[#1a1c23] hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-900 dark:text-slate-400 transition-colors shadow-sm">âœ•</button>
            </div>

            <div className="p-5 text-sm overflow-y-auto flex-1 custom-scrollbar">
              <form id="pagoForm" onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block mb-2 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Paciente *</label>
                  <select
                    value={pacienteId}
                    onChange={(e) => { setPacienteId(e.target.value); setFormErrors(prev => ({ ...prev, pacienteId: '' })); }}
                    onBlur={() => {
                      if (!pacienteId) setFormErrors(prev => ({ ...prev, pacienteId: 'DebÃ©s seleccionar un paciente.' }));
                      else setFormErrors(prev => ({ ...prev, pacienteId: '' }));
                    }}
                    className={inputClass('pacienteId')}
                  >
                    <option value="">Seleccionar paciente...</option>
                    {pacientes.map(p => (
                      <option key={p.id} value={p.id}>{p.apellido}, {p.nombre}</option>
                    ))}
                  </select>
                  {formErrors.pacienteId && (
                    <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1 font-medium">
                      <AlertCircle size={12} /> {formErrors.pacienteId}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block mb-2 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Fecha *</label>
                    <input type="date" value={fecha} onChange={(e)=>setFecha(e.target.value)} required className="w-full rounded-xl p-3.5 outline-none transition-colors border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 dark:[&::-webkit-calendar-picker-indicator]:invert shadow-sm font-medium" />
                  </div>
                  <div>
                    <label className="block mb-2 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Monto *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={monto}
                      onChange={(e) => { setMonto(e.target.value); setFormErrors(prev => ({ ...prev, monto: '' })); }}
                      onBlur={() => {
                        if (!monto || Number(monto) <= 0) setFormErrors(prev => ({ ...prev, monto: 'El monto debe ser un nÃºmero positivo.' }));
                        else setFormErrors(prev => ({ ...prev, monto: '' }));
                      }}
                      className={inputClass('monto')}
                      placeholder="0.00"
                    />
                    {formErrors.monto && (
                      <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1 font-medium">
                        <AlertCircle size={12} /> {formErrors.monto}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Concepto</label>
                  <input type="text" value={concepto} onChange={(e)=>setConcepto(e.target.value)} className="w-full rounded-xl p-3.5 outline-none transition-colors border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium" placeholder="Ej: SesiÃ³n psicopedagÃ³gica, Informe diagnÃ³stico..." />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block mb-2 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Tipo de Pago</label>
                    <select value={tipoPago} onChange={(e)=>setTipoPago(e.target.value)} className="w-full rounded-xl p-3.5 outline-none transition-colors border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium">
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="obra_social">Obra Social</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Estado</label>
                    <select value={estadoPago} onChange={(e)=>setEstadoPago(e.target.value)} className="w-full rounded-xl p-3.5 outline-none transition-colors border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium">
                      <option value="pagado">Pagado</option>
                      <option value="pendiente">Pendiente</option>
                      <option value="deuda">Deuda</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block mb-2 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">NÂ° SesiÃ³n Facturada</label>
                    <input type="number" value={nroSesion} onChange={(e)=>setNroSesion(e.target.value)} className="w-full rounded-xl p-3.5 outline-none transition-colors border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium" placeholder="Opcional" />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Observaciones</label>
                  <textarea value={observaciones} onChange={(e)=>setObservaciones(e.target.value)} rows="2" className="w-full rounded-xl p-3.5 outline-none transition-colors resize-none border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium"></textarea>
                </div>
              </form>
            </div>

            <div className="border-t border-purple-300 dark:border-[#262626] bg-purple-100/50 dark:bg-[#0f1115] px-6 py-4 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => { setShowModal(false); resetForm(); }} disabled={submitting} className="px-5 py-2 font-bold rounded-xl transition-colors text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white disabled:opacity-50">Cancelar</button>
              <Button type="submit" form="pagoForm" loading={submitting}>
                {editing ? 'Guardar Cambios' : 'Registrar Pago'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}









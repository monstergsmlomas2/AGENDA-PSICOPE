import { useState } from 'react';
import { FolderOpen, FolderPlus, Loader2, X } from 'lucide-react';
import { crearCarpeta, getDriveToken } from '../../services/driveService';

/**
 * Diálogo híbrido para elegir carpeta de destino en Drive.
 * Opción A: elegir carpeta existente (Google Picker)
 * Opción B: crear carpeta nueva (input de nombre)
 *
 * Props:
 *   onSelect(folderId) — llamado cuando el usuario confirma
 *   onCancel()         — llamado si cierra sin elegir
 */
export default function FolderPickerDialog({ onSelect, onCancel }) {
  const [modo, setModo] = useState(null); // null | 'existente' | 'nueva'
  const [nombreCarpeta, setNombreCarpeta] = useState('');
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState('');

  const handleElegirExistente = async () => {
    setError('');
    const tokenData = await getDriveToken();
    if (!tokenData?.access_token) {
      setError('Drive no está conectado. Configuralo en Configuración.');
      return;
    }

    window.gapi.load('picker', () => {
      const folderView = new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true)
        .setMimeTypes('application/vnd.google-apps.folder');

      new window.google.picker.PickerBuilder()
        .addView(folderView)
        .setOAuthToken(tokenData.access_token)
        .setTitle('Elegí la carpeta de destino')
        .setCallback((data) => {
          if (data.action === window.google.picker.Action.PICKED) {
            onSelect(data.docs[0].id);
          } else if (data.action === window.google.picker.Action.CANCEL) {
            // vuelve al diálogo sin cerrar
          }
        })
        .build()
        .setVisible(true);
    });
  };

  const handleCrearCarpeta = async () => {
    const nombre = nombreCarpeta.trim();
    if (!nombre) { setError('Escribí un nombre para la carpeta.'); return; }
    setError('');
    setCreando(true);
    try {
      const result = await crearCarpeta(nombre);
      if (!result?.id) { setError('No se pudo crear la carpeta. Intentá de nuevo.'); return; }
      onSelect(result.id);
    } finally {
      setCreando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-300 dark:border-slate-700 shadow-2xl w-full max-w-sm">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Carpeta de destino en Drive</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-3">

          {/* Opción A: carpeta existente */}
          <button
            onClick={handleElegirExistente}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-purple-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-teal-500 hover:bg-purple-50 dark:hover:bg-slate-800 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-purple-200 dark:group-hover:bg-slate-700 transition-colors">
              <FolderOpen size={20} className="text-purple-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">Elegir carpeta existente</p>
              <p className="text-xs text-slate-900 dark:text-white mt-0.5">Navegar mis carpetas de Drive</p>
            </div>
          </button>

          {/* Separador */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs text-slate-400 font-medium">o</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Opción B: crear carpeta nueva */}
          {modo !== 'nueva' ? (
            <button
              onClick={() => { setModo('nueva'); setError(''); }}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-purple-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-teal-500 hover:bg-purple-50 dark:hover:bg-slate-800 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-green-200 dark:group-hover:bg-slate-700 transition-colors">
                <FolderPlus size={20} className="text-green-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Crear carpeta nueva</p>
                <p className="text-xs text-slate-900 dark:text-white mt-0.5">Se crea en la raíz de tu Drive</p>
              </div>
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-900 dark:text-white mb-1.5 uppercase tracking-wide">
                  Nombre de la nueva carpeta
                </label>
                <input
                  type="text"
                  autoFocus
                  value={nombreCarpeta}
                  onChange={e => { setNombreCarpeta(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleCrearCarpeta()}
                  placeholder="Ej: Entrevistas 2025"
                  className="w-full border border-purple-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 dark:focus:border-teal-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => { setModo(null); setNombreCarpeta(''); setError(''); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCrearCarpeta}
                  disabled={creando || !nombreCarpeta.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors disabled:opacity-60"
                >
                  {creando ? <Loader2 size={15} className="animate-spin" /> : <FolderPlus size={15} />}
                  {creando ? 'Creando...' : 'Crear y usar'}
                </button>
              </div>
            </div>
          )}

          {/* Error global (ej: Drive no conectado) */}
          {error && modo !== 'nueva' && (
            <p className="text-xs text-red-500 font-medium text-center">{error}</p>
          )}

        </div>
      </div>
    </div>
  );
}

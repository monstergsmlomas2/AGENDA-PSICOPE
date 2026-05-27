import { FileText } from 'lucide-react';

export default function EntrevistaModal({ paciente, onClose, onSave }) {
  if (!paciente) return null;

  const entrevista = paciente?.entrevista;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const entrevistaData = Object.fromEntries(formData.entries());
    // Capturar checkboxes
    const checkboxes = e.target.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => { entrevistaData[cb.name] = cb.checked; });
    onSave(entrevistaData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-950 w-full max-w-5xl max-h-[90vh] rounded-2xl border border-purple-300 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">

        <div className="bg-purple-100/50 dark:bg-slate-900 border-b border-purple-300 dark:border-slate-800 px-8 py-5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 flex items-center gap-3">
              <FileText size={26} /> Entrevista de AdmisiÃ³n
            </h2>
            <p className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-sm mt-1">
              Paciente: <span className="capitalize font-semibold">{paciente.nombre} {paciente.apellido}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-900 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 p-2 rounded-lg">
            âœ•
          </button>
        </div>

        {/* FORMULARIO GIGANTE */}
        <form id="entrevistaForm" onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar flex-1 text-sm text-slate-900 dark:text-slate-300 space-y-10">

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-purple-300 dark:border-slate-800 pb-2">Datos Escolares</h3>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs uppercase font-semibold">Escuela</label><input type="text" name="escuela" defaultValue={entrevista?.escuela} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs uppercase font-semibold">Cursa</label><input type="text" name="cursa" defaultValue={entrevista?.cursa} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs uppercase font-semibold">Turno</label><input type="text" name="turno" defaultValue={entrevista?.turno} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-purple-300 dark:border-slate-800 pb-2">Datos de la Familia</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-purple-100/50 dark:bg-slate-900 p-5 rounded-xl border border-purple-300 dark:border-slate-800 space-y-4">
                <h4 className="text-teal-600 dark:text-teal-500 font-bold">Datos de la Madre</h4>
                <input type="text" name="madre_nombre" defaultValue={entrevista?.madre_nombre} placeholder="Nombre completo" className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" name="madre_edad" defaultValue={entrevista?.madre_edad} placeholder="Edad" className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" />
                  <input type="text" name="madre_trabajo" defaultValue={entrevista?.madre_trabajo} placeholder="Trabajo" className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" />
                </div>
                <input type="text" name="madre_estudios" defaultValue={entrevista?.madre_estudios} placeholder="Estudios Cursados" className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" />
              </div>
              <div className="bg-purple-100/50 dark:bg-slate-900 p-5 rounded-xl border border-purple-300 dark:border-slate-800 space-y-4">
                <h4 className="text-teal-600 dark:text-teal-500 font-bold">Datos del Padre</h4>
                <input type="text" name="padre_nombre" defaultValue={entrevista?.padre_nombre} placeholder="Nombre completo" className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" name="padre_edad" defaultValue={entrevista?.padre_edad} placeholder="Edad" className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" />
                  <input type="text" name="padre_trabajo" defaultValue={entrevista?.padre_trabajo} placeholder="Trabajo" className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" />
                </div>
                <input type="text" name="padre_estudios" defaultValue={entrevista?.padre_estudios} placeholder="Estudios Cursados" className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs uppercase font-semibold">Hermanos (Nombres y Edades)</label><textarea name="hermanos" defaultValue={entrevista?.hermanos} rows="2" className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white"></textarea></div>
              <div><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs uppercase font-semibold">Â¿Viven solos o con otros familiares?</label><textarea name="viven_con" defaultValue={entrevista?.viven_con} rows="2" className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white"></textarea></div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-purple-300 dark:border-slate-800 pb-2">Antecedentes e Hitos del Desarrollo</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs uppercase font-semibold">Perinatales / Parto / Posnatales</label><textarea name="perinatales" defaultValue={entrevista?.perinatales} rows="2" className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white"></textarea></div>
              <div><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs uppercase font-semibold">Antecedentes Familiares</label><textarea name="antecedentes_familiares" defaultValue={entrevista?.antecedentes_familiares} rows="2" className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white"></textarea></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs font-semibold">Primeros balbuceos</label><input type="text" name="balbuceos" defaultValue={entrevista?.balbuceos} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs font-semibold">Se sentÃ³ a:</label><input type="text" name="sento" defaultValue={entrevista?.sento} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs font-semibold">CaminÃ³ a:</label><input type="text" name="camino" defaultValue={entrevista?.camino} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs font-semibold">TomÃ³ pecho hasta:</label><input type="text" name="pecho" defaultValue={entrevista?.pecho} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs font-semibold">Control esfÃ­nteres a:</label><input type="text" name="esfinteres" defaultValue={entrevista?.esfinteres} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs font-semibold">Comida sÃ³lida a:</label><input type="text" name="comida_solida" defaultValue={entrevista?.comida_solida} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div className="col-span-2"><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs font-semibold">Primeras palabras (y cuÃ¡les):</label><input type="text" name="primeras_palabras" defaultValue={entrevista?.primeras_palabras} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-purple-300 dark:border-slate-800 pb-2">Trayectoria Escolar y Apoyos</h3>
            <textarea name="trayectoria" defaultValue={entrevista?.trayectoria} rows="2" placeholder="Detalle de escolaridad..." className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-3 outline-none focus:border-teal-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white"></textarea>
            <div className="flex flex-wrap gap-6 bg-purple-100/50 dark:bg-slate-900 p-4 rounded-xl border border-purple-300 dark:border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer font-medium"><input type="checkbox" name="apoyo_acompanante" defaultChecked={entrevista?.apoyo_acompanante} className="accent-teal-600 dark:accent-teal-500 w-4 h-4" /> AcompaÃ±ante TerapÃ©utico</label>
              <label className="flex items-center gap-2 cursor-pointer font-medium"><input type="checkbox" name="apoyo_maestra" defaultChecked={entrevista?.apoyo_maestra} className="accent-teal-600 dark:accent-teal-500 w-4 h-4" /> Maestra de InclusiÃ³n</label>
              <label className="flex items-center gap-2 cursor-pointer font-medium"><input type="checkbox" name="apoyo_die" defaultChecked={entrevista?.apoyo_die} className="accent-teal-600 dark:accent-teal-500 w-4 h-4" /> Dispositivo (DIE)</label>
              <label className="flex items-center gap-2 cursor-pointer font-medium"><input type="checkbox" name="apoyo_adaptaciones" defaultChecked={entrevista?.apoyo_adaptaciones} className="accent-teal-600 dark:accent-teal-500 w-4 h-4" /> Adaptaciones Curriculares</label>
              <label className="flex items-center gap-2 cursor-pointer font-medium"><input type="checkbox" name="apoyo_cud" defaultChecked={entrevista?.apoyo_cud} className="accent-teal-600 dark:accent-teal-500 w-4 h-4" /> Posee CUD</label>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-purple-300 dark:border-slate-800 pb-2">HÃ¡bitos y Procesamiento Sensorial</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-teal-600 dark:text-teal-500 font-bold">HÃ¡bitos Diarios</h4>
                <div><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs font-semibold">AlimentaciÃ³n</label><input type="text" name="habito_alimentacion" defaultValue={entrevista?.habito_alimentacion} className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
                <div><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs font-semibold">SueÃ±o</label><input type="text" name="habito_sueno" defaultValue={entrevista?.habito_sueno} className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
                <div><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs font-semibold">Aseo y Vestido</label><input type="text" name="habito_aseo" defaultValue={entrevista?.habito_aseo} className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              </div>
              <div className="space-y-4">
                <h4 className="text-teal-600 dark:text-teal-500 font-bold">Procesamiento Sensorial</h4>
                <div><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs font-semibold">TÃ¡ctil / Auditivo / Visual</label><input type="text" name="sensorial_tactil_auditivo_visual" defaultValue={entrevista?.sensorial_tactil_auditivo_visual} className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
                <div><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs font-semibold">Olfatorio</label><input type="text" name="sensorial_olfatorio" defaultValue={entrevista?.sensorial_olfatorio} className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
                <div><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs font-semibold">Vestibular (VÃ©rtigo)</label><input type="text" name="sensorial_vestibular" defaultValue={entrevista?.sensorial_vestibular} className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 p-2 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-purple-300 dark:border-slate-800 pb-2">Motricidad</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-purple-100/50 dark:bg-slate-900 p-5 rounded-xl border border-purple-300 dark:border-slate-800">
              <div className="space-y-3">
                <p className="text-slate-900 dark:text-slate-400 text-sm font-bold mb-2">Motricidad Gruesa</p>
                <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" name="motricidad_acorde" defaultChecked={entrevista?.motricidad_acorde} className="accent-teal-600 dark:accent-teal-500 w-4 h-4" /> Â¿Es acorde a la edad?</label>
                <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" name="motricidad_dificultad_peso" defaultChecked={entrevista?.motricidad_dificultad_peso} className="accent-teal-600 dark:accent-teal-500 w-4 h-4" /> Dificultad para agarrar objetos pesados</label>
                <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" name="motricidad_coordinado" defaultChecked={entrevista?.motricidad_coordinado} className="accent-teal-600 dark:accent-teal-500 w-4 h-4" /> Movimientos coordinados</label>
              </div>
              <div className="space-y-3">
                <p className="text-slate-900 dark:text-slate-400 text-sm font-bold mb-2">Motricidad Fina</p>
                <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" name="motricidad_pinza" defaultChecked={entrevista?.motricidad_pinza} className="accent-teal-600 dark:accent-teal-500 w-4 h-4" /> Pinza fina / Toma el lÃ¡piz en pinza</label>
                <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" name="motricidad_pinta_bien" defaultChecked={entrevista?.motricidad_pinta_bien} className="accent-teal-600 dark:accent-teal-500 w-4 h-4" /> Pinta bien / Sin salirse del contorno</label>
                <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" name="motricidad_tijera" defaultChecked={entrevista?.motricidad_tijera} className="accent-teal-600 dark:accent-teal-500 w-4 h-4" /> Dificultad para cortar con tijera</label>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-purple-300 dark:border-slate-800 pb-2">SocializaciÃ³n, Juego y Rutina</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs uppercase font-semibold">SocializaciÃ³n y Juego</label><textarea name="socializacion" defaultValue={entrevista?.socializacion} rows="2" className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white"></textarea></div>
              <div><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs uppercase font-semibold">Uso de pantallas (Celular/PC)</label><textarea name="pantallas" defaultValue={entrevista?.pantallas} rows="2" className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white"></textarea></div>
              <div><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs uppercase font-semibold">Miedos</label><input type="text" name="miedos" defaultValue={entrevista?.miedos} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs uppercase font-semibold">Persona muy significativa</label><input type="text" name="persona_significativa" defaultValue={entrevista?.persona_significativa} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs uppercase font-semibold">Â¿QuÃ© le gusta hacer?</label><input type="text" name="gusta_hacer" defaultValue={entrevista?.gusta_hacer} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs uppercase font-semibold">Â¿QuÃ© le disgusta?</label><input type="text" name="disgusta" defaultValue={entrevista?.disgusta} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div className="col-span-2"><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs uppercase font-semibold">Tareas escolares (Â¿Solo o con ayuda? Â¿Lugar propio?)</label><input type="text" name="tareas_escolares" defaultValue={entrevista?.tareas_escolares} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div className="col-span-2"><label className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs uppercase font-semibold">Describir cÃ³mo es un dÃ­a de su vida</label><textarea name="dia_de_vida" defaultValue={entrevista?.dia_de_vida} rows="2" className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 resize-none text-slate-900 dark:text-white"></textarea></div>
            </div>
          </section>

          <section className="space-y-4 bg-teal-50 dark:bg-teal-900/10 p-5 rounded-xl border border-teal-200 dark:border-teal-900/30">
            <h3 className="text-lg font-bold text-teal-700 dark:text-teal-400 border-b border-teal-200 dark:border-teal-900/30 pb-2">Encuadre Profesional</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-slate-900 dark:text-slate-400 text-xs font-semibold">DÃ­a de sesiÃ³n pautado</label><input type="text" name="encuadre_dia" defaultValue={entrevista?.encuadre_dia} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
              <div><label className="text-slate-900 dark:text-slate-400 text-xs font-semibold">Horario pautado</label><input type="text" name="encuadre_horario" defaultValue={entrevista?.encuadre_horario} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 mt-1 outline-none focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white" /></div>
            </div>
          </section>

        </form>

        <div className="bg-purple-100/50 dark:bg-slate-900 border-t border-purple-300 dark:border-slate-800 px-8 py-5 flex justify-end gap-4 shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 text-slate-900 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white font-bold transition-colors">
            Cerrar Planilla
          </button>
          <button type="submit" form="entrevistaForm" className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-teal-500/20 transition-all hover:-translate-y-0.5">
            Guardar Entrevista Completa
          </button>
        </div>

      </div>
    </div>
  );
}









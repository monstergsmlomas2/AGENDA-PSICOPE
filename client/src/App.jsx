import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Turnos from './pages/Turnos';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Pacientes from './pages/Pacientes';
import Dashboard from './pages/Dashboard';
import Consultorios from './pages/Consultorios';
import ObrasSociales from './pages/ObrasSociales';
import Informes from './pages/Informes';
import Pagos from './pages/Pagos';
import PacienteDetalle from './pages/PacienteDetalle';
import SesionDetalle from './pages/SesionDetalle';
import SesionForm from './pages/SesionForm';
import EntrevistaPage from './pages/EntrevistaPage';
import EvaluacionDetalle from './pages/EvaluacionDetalle';
import EvaluacionForm from './pages/EvaluacionForm';
import Configuracion from './pages/Configuracion';
import { ToastProvider } from './components/ui';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === null ? true : saved === 'true';
  });

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('darkMode', String(next));
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="flex h-screen font-sans overflow-hidden transition-colors duration-300 bg-purple-200 dark:bg-[var(--bg-base)] text-slate-900 dark:text-slate-200">

          <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

          <main className="flex-1 p-4 lg:p-6 overflow-y-auto relative animate-fade-in">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pacientes" element={<Pacientes />} />
              <Route path="/pacientes/:id" element={<PacienteDetalle />} />
              <Route path="/pacientes/:id/sesiones/nueva" element={<SesionForm />} />
              <Route path="/pacientes/:id/sesiones/:sesionId" element={<SesionDetalle />} />
              <Route path="/pacientes/:id/sesiones/:sesionId/editar" element={<SesionForm />} />
              <Route path="/pacientes/:id/entrevista" element={<EntrevistaPage />} />
              <Route path="/pacientes/:id/evaluaciones/nueva" element={<EvaluacionForm />} />
              <Route path="/pacientes/:id/evaluaciones/:evalId" element={<EvaluacionDetalle />} />
              <Route path="/pacientes/:id/evaluaciones/:evalId/editar" element={<EvaluacionForm />} />
              <Route path="/consultorios" element={<Consultorios />} />
              <Route path="/turnos" element={<Turnos />} />
              <Route path="/obras-sociales" element={<ObrasSociales />} />
              <Route path="/informes" element={<Informes />} />
              <Route path="/pagos" element={<Pagos />} />
              <Route path="/configuracion" element={<Configuracion />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;




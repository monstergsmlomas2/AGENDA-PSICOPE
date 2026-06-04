import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import AuthCallback from './pages/AuthCallback';
import { ToastProvider, useToast } from './components/ui';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { Loader2 } from 'lucide-react';
import GlobalSearch from './components/GlobalSearch';
import InstallPrompt from './components/InstallPrompt'
import UpdatePrompt from './components/UpdatePrompt';

const Dashboard               = lazy(() => import('./pages/Dashboard'));
const Pacientes               = lazy(() => import('./pages/Pacientes'));
const PacienteDetalle         = lazy(() => import('./pages/PacienteDetalle'));
const SesionDetalle           = lazy(() => import('./pages/SesionDetalle'));
const SesionForm              = lazy(() => import('./pages/SesionForm'));
const EntrevistaPage          = lazy(() => import('./pages/EntrevistaPage'));
const EvaluacionDetalle       = lazy(() => import('./pages/EvaluacionDetalle'));
const EvaluacionForm          = lazy(() => import('./pages/EvaluacionForm'));
const Turnos                  = lazy(() => import('./pages/Turnos'));
const ObrasSociales           = lazy(() => import('./pages/ObrasSociales'));
const Informes                = lazy(() => import('./pages/Informes'));
const Pagos                   = lazy(() => import('./pages/Pagos'));
const Consultorios            = lazy(() => import('./pages/Consultorios'));
const Configuracion           = lazy(() => import('./pages/Configuracion'));
const HerramientasEstandarizadas = lazy(() => import('./pages/HerramientasEstandarizadas'));

// ─── Componente que protege rutas ───
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-200 dark:bg-[var(--bg-base)]">
        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
          <Loader2 size={24} className="animate-spin" />
          <span className="text-sm font-medium">Cargando…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// ─── Layout protegido con Sidebar ───
function ProtectedLayout({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === null ? false : saved === 'true';
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

  const toast = useToast();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('drive') === 'connected') {
      toast.success('Google Drive conectado', 'Ya podés adjuntar archivos a los pacientes.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('drive') === 'error') {
      toast.error('Error', 'No se pudo conectar Google Drive. Intentá de nuevo.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  return (
    <div className="flex h-[100dvh] w-screen font-sans overflow-hidden transition-colors duration-300 bg-purple-200 dark:bg-[var(--bg-base)] text-slate-900 dark:text-slate-200">
      {/* Sidebar — oculto en móvil, visible en desktop */}
      <div className="hidden md:flex">
        <Sidebar
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          isOpen={false}
          onClose={() => {}}
        />
      </div>
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto relative animate-fade-in pb-20 md:pb-6">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full min-h-[300px]">
            <Loader2 size={28} className="animate-spin text-pink-500" />
          </div>
        }>
          {children}
        </Suspense>
      </main>
      {/* Bottom navigation — solo en móvil */}
      <BottomNav />

      {/* Búsqueda global — Ctrl+K */}
      <GlobalSearch />

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Banner de nueva versión disponible */}
      <UpdatePrompt />
    </div>
  );
}

// ─── Componente raíz con rutas ───
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
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
                <Route path="/herramientas" element={<HerramientasEstandarizadas />} />
              </Routes>
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

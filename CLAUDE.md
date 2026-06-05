# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Agenda Psicope** is a clinic management system for psychopedagogy practices. It manages patients, appointments (turnos), sessions (sesiones), payments, health insurers (obras sociales), consulting rooms, reports, evaluations, WhatsApp notifications, and Google Drive document storage.

The project is split into two independent packages:

- `client/` — React 19 + Vite + Tailwind CSS 4 SPA (PWA-enabled)
- `server/` — Node.js + Express 5 REST API connected to a Supabase PostgreSQL database

**Deploy targets**: Server → Fly.io (`agenda-psicope`, region `gru`). Client → Vercel.

---

## Development Commands

Both server and client must run simultaneously during development.

**Server** (runs on port 3000):
```bash
cd server
npm run dev       # nodemon server.js — auto-restarts on changes
npm start         # node server.js — production start
```

**Client** (runs on port 5173, proxies API calls to port 3000):
```bash
cd client
npm run dev       # Vite dev server with HMR
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

Test DB connection (dev only): `GET http://localhost:3000/test-db` (disabled in production)

---

## Authentication

The app uses **Supabase Auth** with a JWT-based flow.

### Client side
- `client/src/services/authService.js` — wraps `@supabase/supabase-js`. On login, stores the Supabase `access_token` in `localStorage` under the key `psicope_token`. Exports: `getSupabaseUser()`, `login()`, `logout()`, `getToken()`, `isTokenExpired()`.
- `client/src/context/AuthContext.jsx` — React context that exposes `{ user, loading, login, logout, isAuthenticated }`. Reads the token from localStorage on mount and checks expiry.
- `client/src/pages/Login.jsx` — login form, calls `AuthContext.login()`.
- `client/src/pages/Register.jsx` — registration form.
- `client/src/pages/AuthCallback.jsx` — handles Supabase OAuth callback (e.g., Google OAuth).
- Every protected page is wrapped in `<ProtectedRoute>` (defined in `App.jsx`). If not authenticated, redirects to `/login`.
- Every API `fetch()` call must include the header `Authorization: Bearer <token>` (retrieved via `authService.getToken()`). All services use the centralized wrappers in `client/src/services/api.js` (`apiGet`, `apiPost`, `apiPut`, `apiDelete`).

**Env vars required** in `client/.env` (or Vercel dashboard):
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Server side
- `server/middleware/auth.js` — Bearer token middleware applied to **all** API routes. Uses `jwt.decode()` (not `verify`) because Supabase tokens use ES256, which would require the public key. Validates that `decoded.sub` exists and that `exp` has not passed. Sets `req.userId = decoded.sub` for downstream use.
- The middleware is mounted in `server.js` before every route: `app.use("/pacientes", authMiddleware, pacientesRoutes)`.

**Env vars required** in `server/.env`:
```
DATABASE_URL=...
CLIENT_URL=https://your-vercel-app.vercel.app   # optional, for CORS
NODE_ENV=production                              # set automatically on Fly.io
```

---

## Architecture

### Client (`client/src/`)

```
App.jsx                                         # Root: AuthProvider + router + ProtectedRoute + ProtectedLayout
components/Sidebar.jsx                          # Navigation sidebar with dark/light toggle
components/BottomNav.jsx                        # Mobile-only bottom navigation bar
components/GlobalSearch.jsx                     # Ctrl+K global search across patients/appointments
components/RecordatoriosWidget.jsx              # Dashboard widget: alerts for patients without recent sessions/expired docs
components/InstallPrompt.jsx                    # PWA install prompt
components/UpdatePrompt.jsx                     # New version available banner
components/TestModal.jsx                        # Standardized test selector modal (WISC, WPPSI, etc.)
components/ui/                                  # Shared UI: Button, Card, Toast, ConfirmDialog, Badge, Skeleton, EmptyState, ErrorState, TimePicker, FolderPickerDialog
components/pacientes/EntrevistaModal.jsx        # Admission interview form modal
context/AuthContext.jsx                         # Auth state & helpers
config/api.js                                   # API base URL config
config/consultorio.js                           # Consulting room config constants
data/testsEstandarizados.js                     # Catalog of standardized psychological tests
utils/generarReciboPDF.js                       # PDF receipt generation
utils/entrevistaDocument.js                     # Document generation for admission interviews
pages/                                          # One file per route/feature (18 pages total, all lazy-loaded)
services/                                       # Fetch wrappers — one file per resource (12 service files)
hooks/                                          # useToast.js, useConfirm.jsx, useDashboardData.js
```

**Routing** (React Router v7, lazy-loaded with Suspense, defined in `App.jsx`):

| Path | Page | Auth |
|------|------|------|
| `/` | Landing | Public |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/auth/callback` | AuthCallback | Public |
| `/dashboard` | Dashboard | Protected |
| `/pacientes` | Pacientes — patient card grid | Protected |
| `/pacientes/:id` | PacienteDetalle — full patient detail view | Protected |
| `/pacientes/:id/sesiones/nueva` | SesionForm (create) | Protected |
| `/pacientes/:id/sesiones/:sesionId` | SesionDetalle | Protected |
| `/pacientes/:id/sesiones/:sesionId/editar` | SesionForm (edit) | Protected |
| `/pacientes/:id/entrevista` | EntrevistaPage | Protected |
| `/pacientes/:id/evaluaciones/nueva` | EvaluacionForm (create) | Protected |
| `/pacientes/:id/evaluaciones/:evalId` | EvaluacionDetalle | Protected |
| `/pacientes/:id/evaluaciones/:evalId/editar` | EvaluacionForm (edit) | Protected |
| `/turnos` | Turnos | Protected |
| `/obras-sociales` | ObrasSociales | Protected |
| `/informes` | Informes | Protected |
| `/pagos` | Pagos | Protected |
| `/consultorios` | Consultorios | Protected |
| `/configuracion` | Configuracion | Protected |
| `/herramientas` | HerramientasEstandarizadas | Protected |

> `/evaluaciones` is not a standalone route. Evaluations live inside `/pacientes/:id`.

**Services pattern** (`src/services/*.js`): Each service file exports plain async functions. All calls go through `api.js` wrappers (`apiGet`, `apiPost`, `apiPut`, `apiDelete`) which inject the `Authorization: Bearer <token>` header automatically. Vite's dev proxy (`vite.config.js`) forwards relative URLs to `http://localhost:3000`. All service functions return the parsed JSON or a safe fallback (`[]` / `null`) on error — never throw.

**Theme (Dark/Light Mode)**: The app defaults to **light mode**. `ProtectedLayout` in `App.jsx` manages a `darkMode` state, initialised from `localStorage` (`false` when key is absent). Toggle persists to `localStorage('darkMode')`. All components use Tailwind's `dark:` variant classes. Every page and component has full dual-theme support.

**Light mode palette (rosa/lila)**:
- Page background: `bg-purple-200`
- Sidebar: `bg-purple-100`, borders `border-pink-200`
- Cards: `bg-white`, borders `border-pink-200`
- Primary buttons / accents: `bg-pink-500`, `text-pink-600`
- Active nav: `bg-pink-300 text-black`
- Hover states: `hover:bg-pink-200`, `hover:border-pink-500/50`
- Inputs: `bg-white`, borders `border-pink-300`, focus `ring-pink-500`
- Checkboxes: `accent-pink-500`

**Dark mode palette** (original, unchanged):
- Backgrounds: `bg-slate-900`, `bg-[#141414]`, `bg-slate-950`
- Accents: `text-teal-400`, `bg-teal-500/10`, `border-teal-500/50`
- Cards: `bg-slate-900`, `bg-[#141414]`, borders `border-slate-800`/`border-[#333]`
- Text: `text-slate-200`, `text-slate-400`

**UI stack**: Tailwind CSS 4 (PostCSS plugin), `lucide-react` icons, `react-big-calendar` + `moment` for the calendar view in Turnos, `jspdf` + `html2canvas` for PDF generation.

**PWA**: Configured via `vite-plugin-pwa`. Service worker handles auto-update and asset caching (NetworkFirst for API calls, StaleWhileRevalidate for static assets). `InstallPrompt.jsx` and `UpdatePrompt.jsx` surface PWA install/update actions.

---

### Pacientes flow

Clicking a patient card in `/pacientes` navigates to `/pacientes/:id` (no modal). The detail page (`PacienteDetalle.jsx`) has three action buttons that toggle inline panels:

1. **Entrevista de Admisión** → opens `EntrevistaModal` (existing modal, unchanged).
2. **Sesiones** → inline panel inside the page. Shows numbered sessions with preview. Clicking a past session opens a detail modal with Edit/Delete. New/edit form is also inline (not a modal).
3. **Evaluaciones** → inline panel inside the page. Card grid identical in style to the old standalone Evaluaciones page. Create/edit opens a modal (without patient selector — patient is fixed). View detail opens a read-only modal.

`PacienteDetalle.jsx` contains four internal sub-components to keep the file self-contained:
- `EditarPacienteModal` — full patient edit form
- `SesionDetalleModal` — session detail with Edit/Delete buttons
- `EvaluacionDetalleModal` — evaluation read-only detail
- `EvaluacionFormModal` — evaluation create/edit form (no patient selector)

---

### Configuracion page (multi-tab)

`Configuracion.jsx` has 7 tabs:

| Tab | Content |
|-----|---------|
| **Perfil** | Professional data: name, specialty, license number, phone, email |
| **Apariencia** | Dark/Light mode toggle |
| **WhatsApp** | Connection state, QR scanner, connect/disconnect button |
| **Recordatorios** | Enable/disable patient reminders, enable/disable professional daily summary, set send time, edit daily summary template, manual "Send Now" |
| **Notificaciones** | Message templates: automatic reminder, cancellation, rescheduling, custom message (vars: `{nombre}`, `{fecha}`, `{hora}`, `{consultorio}`) |
| **Google Drive** | Drive connection status, connect/disconnect |
| **Seguridad** | Account email, password reset, logout |

---

### Server (`server/`)

```
server.js              # Express app entry — mounts all routers behind authMiddleware
middleware/auth.js     # JWT decode middleware — extracts req.userId from Bearer token
config/db.js           # pg Pool instance using DATABASE_URL env var
routes/                # One router file per resource (11 route files)
jobs/recordatorios.js  # Cron job started on server boot via iniciarJob()
services/whatsapp.js   # WhatsApp Web client via @whiskeysockets/baileys
services/googleDrive.js # Google Drive OAuth2 + file management
migrations/            # SQL migration files (run manually in Supabase)
fly.toml               # Fly.io deploy config (region: gru, 256 MB RAM)
```

**Database**: Supabase PostgreSQL, accessed via the `pg` npm package. The connection string is in `server/.env` as `DATABASE_URL`. The pool is a singleton exported from `config/db.js`.

**CORS**: Allowed origins are `http://localhost:5173`, any `*.vercel.app`, and the optional `CLIENT_URL` env var.

---

### API Routes

**`/pacientes`** (`server/routes/pacientes.js`):
- `GET /` — list all patients (scoped to `req.userId`)
- `POST /` — create patient
- `GET /sin-sesion-reciente` — patients with no session in 15+ days (**must be defined before `/:id`**)
- `GET /:id` — single patient by ID
- `PUT /:id` — update patient data
- `DELETE /:id` — delete patient + cascade delete turnos, sesiones, evaluaciones
- `PUT /:id/entrevista` — save admission interview (JSONB field)
- `GET /:id/sesiones` — list sessions (ordered ASC by date)
- `POST /:id/sesiones` — create session
- `PUT /:id/sesiones/:sesionId` — update session
- `DELETE /:id/sesiones/:sesionId` — delete session (verifies ownership via `paciente_id`)

**`/turnos`** (`server/routes/turnos.js`):
- Standard CRUD. `GET /` supports optional filters: `desde`, `hasta`, `paciente_id`.
- `estado` values: `pendiente`, `confirmado`, `inasistencia`, `cancelado`
- `tipo_turno` values: `tratamiento`, `evaluacion`

**`/evaluaciones`** (`server/routes/evaluaciones.js`):
- Standard CRUD. `GET /` supports optional filter: `paciente_id`.
- `GET /proximos-vencer` — stub, returns `[]`

**`/informes`** (`server/routes/informes.js`):
- Standard CRUD. `GET /` supports optional filter: `paciente_id`.
- `GET /proximos-vencer` — informes expiring within 30 days

**`/consultorios`**, **`/obras-sociales`**, **`/pagos`** — standard CRUD.

**`/analytics`** (`server/routes/analytics.js`):
- `GET /ingresos-mensuales` — last 6 months income
- `GET /sesiones-semanales` — last 7 days session counts
- `GET /pacientes-por-obra-social` — breakdown by health insurance
- `GET /resumen-mes-actual` — current month summary (sessions, income, active patients, pending appointments)
- `GET /totales` — global totals (total turnos, absences this month)

**`/configuracion`** (`server/routes/configuracion.js`):
- `GET /` — user's notification config + profile data
- `GET /notificaciones` — upsert notification config if missing
- `PUT /notificaciones` — save notification settings (`hora_envio`, `mensaje_paciente`, `mensaje_profesional`, templates)
- `PUT /perfil` — save professional profile
- `PUT /plantillas-notificaciones` — save cancellation/rescheduling/custom message templates
- `GET /historial-whatsapp` — last 10 WhatsApp send attempts

**`/whatsapp`** (`server/routes/whatsapp.js`):
- `GET /status` — WhatsApp connection state (`DISCONNECTED`, `QR_READY`, `CONNECTING`, `CONNECTED`)
- `GET /qr` — QR code in base64 for scanning
- `POST /conectar` — initiate WhatsApp connection via Baileys
- `POST /desconectar` — close WhatsApp session
- `POST /enviar-recordatorios` — force send reminders to patients only
- `POST /enviar-resumen-profesional` — force send daily summary to professional

**`/drive`** (`server/routes/drive.js`):
- `GET /auth-url` — OAuth2 URL for Google Drive connection
- `GET /token` — access token (auto-refreshes if expired)
- `GET /status` — Drive connection status
- `DELETE /disconnect` — revoke Drive connection
- `GET /archivos/:pacienteId` — list patient's files on Drive
- `POST /archivos/:pacienteId` — upload file to Drive (multipart, via multer)
- `DELETE /archivos/:pacienteId/:fileId` — delete file from Drive
- `GET /auth/google/callback` — OAuth2 callback (handled in `server.js`)

---

### WhatsApp Integration

Uses `@whiskeysockets/baileys` (WhatsApp Web automation). Server manages a single Baileys client per user session.

**Cron job** (`server/jobs/recordatorios.js`, started via `iniciarJob()` on boot):
- Runs daily at the time configured in `configuracion_notificaciones.hora_envio` (default 17:00)
- Sends WhatsApp to **patients**: appointment reminder 1 day in advance (template with `{nombre}`, `{fecha}`, `{hora}`, `{consultorio}`)
- Sends WhatsApp to **professional**: daily summary of next day's appointments (template with `{fecha}`, `{cantidad}`, `{lista_turnos}`)
- Only sends if WhatsApp is connected AND phone number is registered AND notifications are enabled

---

### Google Drive Integration

- OAuth2 flow (offline access). Tokens stored in `google_drive_tokens` DB table, auto-refreshed.
- Files organized by patient. `driveService.js` handles folder creation, uploads, and deletes.
- UI in **Configuracion → Google Drive tab**: shows connection status, connect/disconnect.

---

## Vite Proxy Config

`client/vite.config.js` proxies all these routes to `http://localhost:3000`:

```
/pacientes, /turnos, /consultorios, /obras-sociales, /informes,
/evaluaciones, /pagos, /analytics, /configuracion, /drive, /whatsapp
```

Bypass rule: only proxies requests where `Accept` includes `application/json` (avoids intercepting browser navigation).

---

## Key Conventions

- All server route files follow the same pattern: import `express` + `pool`, define a router, export it.
- All routes are protected by `authMiddleware` — never mount a route without it (except `/` health check and `/test-db` dev endpoint).
- Page components are self-contained — state, fetch calls (via services), and UI all in one file.
- All API calls go through the centralized `apiGet`/`apiPost`/`apiPut`/`apiDelete` helpers in `client/src/services/api.js` — never call `fetch()` directly with manual auth headers in new code.
- `PacienteDetalle.jsx` is the most complex page: patient data, edit modal, sessions panel (inline form + detail modal), and evaluations panel (card grid + form modal + detail modal).
- The DB column for consultation reason is `motivo` (not `motivo_consulta`). Services send and receive it as `motivo`.
- **Critical route order**: In `pacientes.js`, `GET /sin-sesion-reciente` must be declared before `GET /:id`. Express would otherwise interpret the literal string as a patient ID and return 404.
- No test suite exists. Manual testing via the browser and `/test-db` endpoint.
- When adding a new API resource: (1) create `server/routes/<resource>.js`, (2) mount it in `server.js` behind `authMiddleware`, (3) create `client/src/services/<resource>Service.js`, (4) add the proxy entry to `client/vite.config.js`.

---

## Deuda Técnica y Limitaciones Conocidas

Esta sección documenta los puntos débiles actuales del sistema. Están registrados para tomar decisiones informadas al planificar nuevas features, refactors o una evolución hacia SaaS.

### Seguridad

- **JWT sin verificación de firma**: `server/middleware/auth.js` usa `jwt.decode()` en lugar de `jwt.verify()`. El token no se verifica criptográficamente; solo se comprueba que `sub` exista y que `exp` no haya pasado. Justificación actual: Supabase emite tokens ES256 y verificarlos requeriría la clave pública de Supabase. Riesgo: un token manipulado con `exp` futuro y `sub` arbitrario sería aceptado. Mejora posible: obtener la JWKS de Supabase y verificar con `jwt.verify()`.
- **Sin roles ni permisos**: No existe distinción entre secretaria, profesional y administrador. Cualquier usuario autenticado puede leer y modificar cualquier recurso. Si se agrega multi-profesional, esto se convierte en un problema crítico.
- **Sin auditoría de acciones**: No hay registro de quién modificó qué y cuándo. No existe tabla de `audit_log` ni middleware que persista eventos de escritura.

### Dependencias de Terceros con Riesgo

- **WhatsApp via Baileys** (`@whiskeysockets/baileys`): Es una librería no oficial que hace ingeniería inversa del protocolo de WhatsApp Web. WhatsApp puede bloquear el número o el cliente en cualquier momento sin aviso. Es el canal de notificación principal del producto y también su principal punto de falla. Alternativa robusta: Twilio WhatsApp API (ya instalado como dependencia pero no usado) o Meta Cloud API oficial.
- **Google Drive como único proveedor documental**: No hay soporte para S3, OneDrive u otro backend de archivos. Si Google revoca el acceso OAuth o cambia sus APIs, la funcionalidad de archivos queda inoperativa.

### Observabilidad y Diagnóstico

- **Sin logs centralizados**: No hay sistema de logging estructurado (Winston, Pino, etc.). Los errores se imprimen con `console.error` y se pierden salvo que se revisen manualmente los logs de Fly.io.
- **Sin monitoreo de errores**: No hay integración con Sentry, Rollbar ni similar. Los errores de producción no generan alertas.
- **Fallbacks silenciosos en servicios frontend**: Todos los service files devuelven `[]` o `null` en caso de error en lugar de propagar la excepción. Esto puede ocultar errores reales (red caída, 500 del servidor, token expirado) y hacer que la UI parezca vacía sin explicación.

### Arquitectura y Escalabilidad

- **Páginas muy grandes**: `PacienteDetalle.jsx` concentra múltiples sub-componentes, modales y lógica de negocio en un solo archivo. A medida que crezca la funcionalidad, la mantenibilidad decaerá. Candidato a dividir en módulos/secciones independientes.
- **Lógica de negocio en el frontend**: Parte de la lógica de dominio (validaciones, formateo, cálculos) vive en los componentes en lugar de en el servidor. Dificulta reutilización y testing.
- **Sin control de concurrencia**: No hay optimistic locking ni mecanismo para detectar conflictos cuando dos usuarios editan el mismo paciente simultáneamente. El último en guardar pisa los cambios del otro.
- **Sin cache para consultas pesadas**: Las rutas de analytics y listados hacen queries directas sin cache. Si el volumen de datos crece, el tiempo de respuesta se degradará sin estrategia de cache (Redis, in-memory, etc.).
- **Fly.io con 256 MB RAM**: Suficiente para uso actual. Baileys mantiene estado de sesión de WhatsApp en memoria, lo que puede incrementar el consumo. Si crece el número de usuarios simultáneos, el límite puede ser un cuello de botella.

### Features Ausentes Relevantes para Producción/SaaS

- **Sin suite de tests automatizados**: No hay unit tests, integration tests ni e2e tests. Todo testing es manual vía browser. Cualquier refactor o feature nueva puede romper funcionalidad existente sin detección automática.
- **Sin estrategia de backup y recuperación documentada**: Supabase hace backups automáticos en planes pagos, pero no hay procedimiento documentado para restore, ni se verifica periódicamente que los backups sean funcionales.
- **Sin historial/versionado de informes y evaluaciones**: Guardar un informe o evaluación sobreescribe la versión anterior. No hay forma de recuperar versiones previas.
- **Sin notificaciones internas en la aplicación**: No hay sistema de alertas o notificaciones in-app (campana, badge). El único canal de notificación al profesional es WhatsApp.
- **Sin envío de email**: No hay canal alternativo a WhatsApp para notificaciones. Si WhatsApp falla, no hay fallback. Resend/SendGrid es la opción natural (ya hay pendiente de SMTP en memoria del proyecto).
- **Sin confirmación/cancelación de turnos por el paciente**: El paciente recibe el recordatorio por WhatsApp pero no puede confirmar ni cancelar desde ese mismo mensaje. La confirmación la gestiona manualmente el profesional.
- **Sin lista de espera automática**: No hay mecanismo para poner pacientes en lista de espera y notificarles automáticamente cuando se libera un turno.
- **Sin importación masiva de datos**: No hay forma de importar pacientes, turnos o pagos desde CSV/Excel. La carga inicial de datos en una clínica existente sería manual.
- **Sin agenda compartida para múltiples profesionales**: El sistema está diseñado para un solo profesional por cuenta. No hay soporte para que una secretaria gestione la agenda de varios profesionales simultáneamente.
- **Sin firma digital de documentos**: Los informes y evaluaciones no pueden ser firmados digitalmente. Para uso clínico formal, esto puede ser un requisito regulatorio.
- **Sin almacenamiento offline para la PWA**: La PWA cachea assets estáticos pero no datos. Si el usuario pierde conexión, no puede trabajar con datos locales (ver pacientes, registrar sesiones, etc.).
- **Sin dashboard de métricas de uso del sistema**: No hay panel de administración que muestre uso por usuario, volumen de datos, errores recientes o performance.
- **Sin CI/CD documentado**: No hay pipeline de integración continua. El deploy a Fly.io y Vercel se hace manualmente. Las migraciones de base de datos se ejecutan manualmente en el panel de Supabase.

### Consideraciones de Producto y Mercado

- **Nicho muy específico (psicopedagogía)**: El sistema está muy ajustado a este nicho. Generalizar a otros profesionales de salud (psicólogos, fonoaudiólogos, kinesiólogos) requeriría parametrizar conceptos hoy hardcodeados (nombre de las sesiones, estructura de la entrevista, tipos de evaluación).
- **Sin manejo de suscripciones o facturación SaaS**: No hay integración con Stripe, MercadoPago ni similar. Para monetizar como SaaS multi-tenant habría que agregar planes, límites de uso, billing y gestión de cuentas.
- **Sin API pública ni sistema de integraciones**: No hay webhooks ni endpoints públicos documentados para que terceros integren con el sistema (HIS hospitalarios, sistemas de facturación, etc.).
- **Propuesta de valor vs. sistemas establecidos**: La diferenciación principal actual es la integración nativa con WhatsApp y el foco en psicopedagogía. Para competir con sistemas más establecidos (Nubedoc, TurnosOnline, etc.) se necesita una propuesta de valor más amplia o una ejecución muy superior en el nicho.

---

## Roadmap de Funcionalidades a Implementar

Funcionalidades planificadas organizadas por área. Las marcadas con ⭐ son **prioridad máxima** (mayor impacto visible + justifican suscripción más alta).

### WhatsApp (prioridad máxima)

| Feature | Estado | Notas |
|---------|--------|-------|
| ⭐ Confirmación automática de turnos desde WhatsApp | Pendiente | Paciente responde "1" o "Confirmo" y el turno se actualiza a `confirmado` |
| ⭐ Cancelación automática desde WhatsApp | Pendiente | Respuesta del paciente dispara cambio de estado + lista de espera |
| Reprogramación automática desde WhatsApp | Pendiente | Flujo conversacional para elegir nuevo horario |
| Recordatorios múltiples (48h, 24h, 2h antes) | Pendiente | Actualmente solo se envía uno; ampliar el cron job |
| Mensajes masivos segmentados | Pendiente | Enviar a obra social, rango de edad, estado de tratamiento, etc. |
| ⭐ Recordatorios de pago por WhatsApp | Pendiente | Pacientes con deuda pendiente reciben aviso automático |
| Chat interno del paciente con historial | Pendiente | Registrar conversaciones de WhatsApp asociadas al paciente |
| Seguimiento de pacientes inactivos | Pendiente | Mensaje automático a pacientes sin turno en X días |
| Encuestas automáticas de satisfacción | Pendiente | Envío post-sesión con resultado guardado en el sistema |
| Carga de documentos desde WhatsApp | Pendiente | Paciente envía foto/PDF y se adjunta a su historia |

### Inteligencia y Automatización (IA)

| Feature | Estado | Notas |
|---------|--------|-------|
| ⭐ Resumen automático de sesiones con IA | ✅ Implementado | Botón "Resumir con IA" en SesionForm. Llama a `POST /ia/resumir-sesion`. DeepSeek V3. |
| Generación de informes psicopedagógicos con IA | ✅ Implementado | Botón "Generar con IA" en modal de Informes. Llama a `POST /ia/generar-informe`. |
| Sugerencias de objetivos terapéuticos | ✅ Implementado | Panel IA → pestaña "Sugerir Objetivos". Llama a `POST /ia/sugerir-objetivos`. |
| Detección de pacientes que abandonaron tratamiento | ✅ Implementado | Panel IA → pestaña "Detectar Abandonos". Llama a `GET /ia/detectar-abandonos`. |
| Alertas de evolución estancada | ✅ Implementado | Panel IA → pestaña "Alertas de Evolución". Llama a `POST /ia/alertas-estancamiento`. |
| Transcripción de audios a texto | ✅ Implementado | Panel IA → pestaña "Transcribir Audio". Grabación en vivo + subida de archivo. Groq Whisper gratis. |
| Búsqueda inteligente en historias clínicas | ✅ Implementado | Panel IA → pestaña "Buscar en Historia". Llama a `POST /ia/buscar-historia`. |
| Asistente IA especializado en psicopedagogía | Pendiente | Chatbot interno que responde preguntas clínicas con contexto del paciente |

### Turnos

| Feature | Estado | Notas |
|---------|--------|-------|
| ⭐ Lista de espera automática | Pendiente | Paciente en espera recibe WhatsApp cuando se cancela un turno compatible |
| Portal de autogestión para pacientes | Pendiente | Paciente saca, cancela o reprograma su propio turno |
| Reasignación automática de turnos cancelados | Pendiente | Al cancelar, el sistema ofrece el horario al primer paciente en lista de espera |
| Confirmación obligatoria | Pendiente | Si el paciente no confirma en X horas, el turno se libera automáticamente |
| Agenda compartida entre profesionales | Pendiente | Requiere implementar roles; secretaria ve todos los profesionales |
| Bloqueo de horarios recurrentes | Pendiente | Bloquear franjas fijas (almuerzo, administrativo, etc.) |
| Turnos recurrentes automáticos | Pendiente | Generar automáticamente turnos semanales/quincenales para un paciente |

### Gestión Económica

| Feature | Estado | Notas |
|---------|--------|-------|
| Estado de cuenta por paciente | Pendiente | Vista de sesiones, pagos y saldo deudor por paciente |
| Deuda pendiente automática | Pendiente | Cálculo automático de sesiones sin pago registrado |
| Reporte mensual de ingresos | Pendiente | Exportable a PDF/Excel |
| Gastos del consultorio | Pendiente | Módulo de egresos para calcular rentabilidad neta |
| Rentabilidad por obra social | Pendiente | Comparar tarifa vs. cobro real por OS |
| Exportación para contador | Pendiente | CSV/Excel con ingresos, egresos, honorarios del período |

### Evaluaciones

| Feature | Estado | Notas |
|---------|--------|-------|
| Corrección automática de tests | Pendiente | Ingresar respuestas y obtener puntaje/percentil automáticamente |
| Cálculo automático de percentiles | Pendiente | Tablas normativas integradas por test y grupo de edad |
| Generación de informes psicopedagógicos desde evaluaciones | Pendiente | Template estructurado que se completa con los datos del test |
| Biblioteca de pruebas estandarizadas | Parcial | `testsEstandarizados.js` tiene catálogo; falta contenido de cada prueba |
| Comparación entre evaluaciones históricas | Pendiente | Gráfico de evolución de puntajes entre evaluaciones del mismo paciente |

### Documentación

| Feature | Estado | Notas |
|---------|--------|-------|
| Firma digital de documentos | Pendiente | Informes y consentimientos firmados digitalmente |
| Consentimientos informados digitales | Pendiente | Template enviado por WhatsApp/email, firmado online |
| Formularios online para padres | Pendiente | Anamnesis, cuestionarios previos al inicio del tratamiento |
| Escaneo OCR de documentación | Pendiente | Foto de documento físico → texto indexable |

### Portal para Padres / Pacientes

| Feature | Estado | Notas |
|---------|--------|-------|
| ⭐ Portal para padres | Pendiente | Vista pública donde padres ven turnos, objetivos e informes autorizados |
| Descarga de informes | Pendiente | Profesional publica un informe y el padre lo descarga |
| Consulta de próximos turnos | Pendiente | Vista de agenda sin acceso al sistema completo |
| Seguimiento de objetivos terapéuticos | Pendiente | Padres ven el progreso en los objetivos definidos por el profesional |
| Mensajería con el profesional | Pendiente | Canal de comunicación directa dentro del portal |

### Diferenciadores de Producto

| Feature | Estado | Notas |
|---------|--------|-------|
| Dashboard de evolución del paciente con gráficos | Pendiente | Línea de tiempo visual: asistencia, puntajes, hitos de tratamiento |
| Línea de tiempo completa del tratamiento | Pendiente | Vista unificada: sesiones + informes + pagos + turnos en orden cronológico |
| Indicadores automáticos de progreso | Pendiente | KPIs por paciente: % objetivos cumplidos, frecuencia de asistencia, etc. |
| Historial cronológico unificado | Pendiente | Timeline completo que integra todos los módulos del paciente |
| Grabación y transcripción de entrevistas | Pendiente | Grabar audio en sesión, transcribir y adjuntar a la historia |

---

## Las 5 Primeras Features a Implementar (máximo ROI)

Estas cinco, juntas, tienen el mayor impacto visible para el usuario y justifican cobrar una suscripción más alta:

1. **⭐ Confirmación y cancelación de turnos por WhatsApp** — El paciente recibe el recordatorio y puede responder para confirmar o cancelar. El turno se actualiza automáticamente.
2. **⭐ Lista de espera automática** — Al cancelarse un turno, el sistema notifica por WhatsApp al primer paciente en espera compatible con ese horario.
3. **⭐ Recordatorios de pago por WhatsApp** — Cron job que detecta pacientes con deuda y envía aviso automático con el monto.
4. **⭐ Resumen automático de sesiones con IA** — El profesional escribe notas en bruto y la IA genera el resumen estructurado de la sesión (objetivos, evolución, plan).
5. **⭐ Portal para padres** — Subdominio o ruta pública con PIN donde los padres pueden ver próximos turnos, objetivos del tratamiento e informes habilitados por el profesional.

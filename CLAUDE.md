# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Agenda Psicope** is a clinic management system for psychopedagogy practices. It manages patients, appointments (turnos), sessions (sesiones), payments, health insurers (obras sociales), consulting rooms, reports, and evaluations.

The project is split into two independent packages:

- `client/` — React 19 + Vite 8 + Tailwind CSS 4 SPA
- `server/` — Node.js + Express 5 REST API connected to a Supabase PostgreSQL database

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

Test DB connection (dev only): `GET http://localhost:3000/test-db`

---

## Architecture

### Client (`client/src/`)

```
App.jsx                                    # Root: router + dark/light mode toggle (state-based)
components/Sidebar.jsx                     # Navigation sidebar
components/ui/                             # Shared UI components (Button, Toast, ConfirmDialog, etc.)
components/pacientes/EntrevistaModal.jsx   # Admission interview modal (used in PacienteDetalle)
pages/                                     # One file per route/feature
services/                                  # Fetch wrappers — one file per resource
hooks/                                     # useToast, useConfirm
```

**Routing** (React Router v7, defined in `App.jsx`):
| Path | Page |
|------|------|
| `/` | Dashboard |
| `/pacientes` | Pacientes — patient card grid |
| `/pacientes/:id` | PacienteDetalle — full patient detail view |
| `/turnos` | Turnos |
| `/obras-sociales` | ObrasSociales |
| `/informes` | Informes |
| `/pagos` | Pagos |
| `/consultorios` | Consultorios |

> `/evaluaciones` was removed as a standalone route. Evaluations now live inside `/pacientes/:id`.

**Services pattern** (`src/services/*.js`): Each service file exports plain async functions that call `fetch()` against relative URLs (e.g. `/pacientes`). Vite's dev proxy (`vite.config.js`) forwards those to `http://localhost:3000`. All service functions return the parsed JSON or a safe fallback (`[]` / `null`) on error — never throw.

**Theme (Dark/Light Mode)**: The app defaults to dark mode but includes a toggle in the sidebar to switch to light mode. `App.jsx` manages a `darkMode` state (`useState(true)`) that adds/removes the `dark` class on `<html>`. All components use Tailwind's `dark:` variant classes.

**Light mode palette (rosa/lila)**:
- Page background: `bg-pink-50`
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

**Components already updated for dual theme**: Button, Card, Toast, ConfirmDialog, TimePicker, Skeleton, EmptyState, ErrorState, Sidebar, Dashboard, Pacientes, PacienteDetalle, Turnos, ObrasSociales, Informes, Pagos, Consultorios, Configuracion, EntrevistaPage, EvaluacionDetalle, EvaluacionForm, Evaluaciones, SesionDetalle, SesionForm, RecordatoriosWidget, EntrevistaModal.

**UI stack**: Tailwind CSS 4 (PostCSS plugin), `lucide-react` icons, `react-big-calendar` + `moment` for the calendar view in Turnos.

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

### Server (`server/`)

```
server.js           # Express app entry — mounts all routers
config/db.js        # pg Pool instance using DATABASE_URL env var
routes/             # One router file per resource (pacientes, turnos, etc.)
.env                # DATABASE_URL for Supabase connection (not committed ideally)
```

**Database**: Supabase PostgreSQL, accessed via the `pg` npm package. The connection string is in `server/.env` as `DATABASE_URL`. The pool is a singleton exported from `config/db.js`.

**API routes — pacientes** (`server/routes/pacientes.js`):
- `GET /pacientes` — list all patients
- `POST /pacientes` — create patient
- `GET /pacientes/sin-sesion-reciente` — patients with no session in 15+ days (**must be defined before `/:id`**)
- `GET /pacientes/:id` — single patient by ID
- `PUT /pacientes/:id` — update patient data
- `DELETE /pacientes/:id` — delete patient
- `PUT /pacientes/:id/entrevista` — save admission interview (JSONB field)
- `GET /pacientes/:id/sesiones` — list sessions (ordered ASC by date)
- `POST /pacientes/:id/sesiones` — create session
- `PUT /pacientes/:id/sesiones/:sesionId` — update session
- `DELETE /pacientes/:id/sesiones/:sesionId` — delete session (verifies ownership via `paciente_id`)

**Other routes**: `/turnos`, `/consultorios`, `/obras-sociales`, `/informes`, `/evaluaciones`, `/pagos` — standard CRUD per router file.

**Critical route order**: In `pacientes.js`, `GET /sin-sesion-reciente` must be declared before `GET /:id`. If `:id` comes first, Express interprets the literal string "sin-sesion-reciente" as a patient ID and returns 404.

---

## Key Conventions

- All server route files follow the same pattern: import `express` + `pool`, define a router, export it.
- Page components are self-contained — state, fetch calls (via services), and UI all in one file.
- `PacienteDetalle.jsx` is the most complex page: patient data, edit modal, sessions panel (inline form + detail modal), and evaluations panel (card grid + form modal + detail modal).
- The DB column for consultation reason is `motivo` (not `motivo_consulta`). Services send and receive it as `motivo`.
- No test suite exists. Manual testing via the browser and `/test-db` endpoint.
- All proxy entries are present in `client/vite.config.js`: `/pacientes`, `/turnos`, `/consultorios`, `/obras-sociales`, `/informes`, `/evaluaciones`, `/pagos`, `/analytics`.

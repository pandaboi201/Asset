# AssetFlow — Enterprise IT Asset & Inventory Management

A premium, production-quality dashboard for managing IT assets, inventory, maintenance, repairs, spare parts, CCTV and more. Built to feel at home next to products like Linear, Notion, Atlassian and the Vercel dashboard.

> **Full stack.** The app is backed by a real Node.js API and a real persisted SQLite database (see [`/server`](#backend)). There is no mock/in-memory data layer — every page reads and writes through HTTP to the backend.

## Tech Stack

**Frontend**
- **React 19** + **TypeScript** + **Vite 6**
- **Tailwind CSS** (v3.4) with a custom design-token system (light/dark)
- **shadcn/ui**-style components (hand-authored, Radix UI primitives)
- **Framer Motion** — page transitions & micro-interactions
- **React Router** (v7) — routing
- **TanStack Table** (v8) — data tables
- **Recharts** — charts & analytics
- **React Hook Form** + **Zod** — forms & validation
- **Lucide React** — icons
- **Sonner** — toasts, **cmdk** — command palette

**Backend**
- **Node.js** built-in `http` server — zero npm dependencies
- **SQLite** via Node's built-in `node:sqlite` module — real file-backed database, no ORM/driver install required

## Getting Started

You need **two processes running**: the API server and the Vite dev server.

```bash
# Terminal 1 — start the backend API (http://localhost:4000)
npm run server

# Terminal 2 — start the frontend (http://localhost:5173)
npm install
npm run dev
```

Then open the printed local URL (default http://localhost:5173). The frontend
calls the API at `http://localhost:4000/api` by default — override with a
`VITE_API_URL` env var if you deploy the backend elsewhere.

### Scripts

| Script | Description |
| --- | --- |
| `npm run server` | Start the backend API (`node server/index.mjs`, no install needed) |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Type-check without emitting |

## Backend

The backend lives entirely in [`/server`](./server) and requires **no `npm install`** —
it only uses built-in Node modules (`node:http`, `node:sqlite`, `node:crypto`, `node:url`).

```
server/
├── index.mjs      # HTTP server + router (REST endpoints for every resource)
├── db.mjs         # SQLite schema (WAL mode), creates server/data/assetflow.db
├── seed.mjs       # One-time seed data (idempotent — never overwrites your edits)
├── crud.mjs       # Generic CRUD engine (search / filter / sort / paginate)
├── resources.mjs  # Row <-> API shape mappers for every domain resource
├── relations.mjs  # Cross-resource joins (asset history, user devices, etc.)
└── analytics.mjs  # Live dashboard KPIs computed from real DB rows
```

Data is persisted to `server/data/assetflow.db` — a real SQLite file, not an
in-memory store — so everything you create/edit through the UI survives a
server restart. That directory is gitignored; delete it to reset to fresh seed
data on next boot.

Every resource supports the standard REST shape:

```
GET    /api/<resource>            # list all
GET    /api/<resource>/query      # search + filter + sort + paginate
GET    /api/<resource>/:id        # get one
POST   /api/<resource>            # create
PUT/PATCH /api/<resource>/:id     # update
DELETE /api/<resource>/:id        # delete
```

Plus a handful of aggregation endpoints: `/api/assets/history/:tag`,
`/api/users/:id/devices`, `/api/spare-parts/:id/installations`,
`/api/nvr/:id/cameras`, `/api/dashboard/*`, `/api/export/:type` (CSV
download), `/api/import` (bulk CSV import), `/api/settings`, and `/api/me`.

## Project Structure

```
server/                # Backend API + SQLite database (see "Backend" above)
src/
├── components/
│   ├── layout/        # App shell: sidebar, topbar, command menu, transitions
│   ├── shared/        # Reusable building blocks (DataTable, StatCard, forms…)
│   ├── theme/         # Theme provider + toggle
│   └── ui/            # shadcn-style primitives (Button, Dialog, Table…)
├── config/            # Navigation config
├── data/              # Static UI option lists only (dropdown choices — not data)
├── hooks/             # useAsync, useDebounce, useMediaQuery, useLocalStorage
├── lib/               # cn(), formatting utilities, shared accent-tone map
├── pages/             # One folder/file per route (+ co-located form dialogs)
├── services/          # Typed fetch client that talks to the backend API
├── types/             # Domain models
├── router.tsx         # Route definitions
├── App.tsx            # Providers + RouterProvider
└── main.tsx           # Entry point
```

## Modules

Dashboard · Asset Management · Inventory · Device Issue & Returns · Maintenance ·
Repairs · Spare Parts · CCTV · Departments · Locations · Vendors · Software
Licenses · Audit Logs · Import/Export · Reports & Analytics · Notifications ·
Users · Settings · Profile · Help Center.

## Service Layer

The UI never talks to `fetch` directly — every page goes through
`src/services`. Each resource is created with `createApiResource` (in
`src/services/api-client.ts`), which exposes `all / query / getById / create /
update / remove` and calls the real backend over HTTP. Relationship data
(asset history, user devices, part installations, NVR cameras) and
aggregations (dashboard KPIs, settings, CSV export/import) are exposed as
plain functions in `src/services/index.ts`.

## Design System

- Light & dark themes via CSS variables (`hsl(var(--token))`) and a `class`-based
  dark mode. Theme preference persists to `localStorage` and respects the OS.
- Semantic color tokens (`primary`, `success`, `warning`, `info`, `destructive`,
  `chart-1…6`, dedicated `sidebar-*` tokens).
- Primary blue is reserved for brand/primary actions (buttons, active nav,
  focus rings). Module icon chips and charts spread across a wider palette
  (teal, purple, pink, amber) via the shared tone map in `src/lib/tones.ts`
  so the UI doesn't read as monochrome blue.
- Glassmorphism surfaces, soft gradients, elegant loading skeletons, hover and
  page-transition animations, and accessible Radix-based primitives.

## Notes

- Every "Add", "Edit", "Delete", "Export" and "Import" action is backed by a
  real API call and persists to the SQLite database — nothing resets on
  reload. A few actions that would require real hardware integration (camera
  live feeds, NVR management consoles) surface an honest message explaining
  the limitation instead of a fake success toast.


## Device tracking & relationships (update)

The system now models the relationships between devices, people and parts:

- **Device detail page** (`/assets/:id`) — a full lifecycle view per device with a
  unified **history timeline** plus dedicated tabs for **issue history**,
  **repairs**, **upgrades**, and **installed parts**.
- **Devices per user** — the Users table shows a device count per person and the
  user detail lists every device assigned to them (each links to its detail page).
- **Part → device mapping** — Spare Parts show how many devices a part was fitted
  to, and the detail lists each installation (device + date + repair reference).
- **NVR management** — CCTV now has a **Recorders (NVR)** tab: recorder health,
  channel usage, storage, retention and the cameras connected to each NVR.
- **No monetary asset values** — purchase cost / current value have been removed
  from the asset model and all asset views per requirements.

New domain types: `DeviceUpgrade`, `PartInstallation`, `Nvr`, `DeviceHistoryEvent`.
New services: `upgradeService`, `partInstallationService`, `nvrService`, and the
relationship aggregators `getAssetHistory`, `getUserDevices`, `getPartInstallations`
and `getNvrCameras` (in `src/services/index.ts`).

# AssetFlow — Enterprise IT Asset & Inventory Management

A premium, production-quality **frontend-only** dashboard for managing IT assets, inventory, maintenance, repairs, spare parts, CCTV and more. Built to feel at home next to products like Linear, Notion, Atlassian and the Vercel dashboard.

> **Frontend only.** There is no backend, auth or database. All data comes from realistic local mock data behind a service layer that is designed to be swapped for a real API with minimal changes.

## Tech Stack

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

## Getting Started

```bash
npm install
npm run dev
```

Then open the printed local URL (default http://localhost:5173).

### Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Type-check without emitting |

## Project Structure

```
src/
├── components/
│   ├── layout/        # App shell: sidebar, topbar, command menu, transitions
│   ├── shared/        # Reusable building blocks (DataTable, StatCard, forms…)
│   ├── theme/         # Theme provider + toggle
│   └── ui/            # shadcn-style primitives (Button, Dialog, Table…)
├── config/            # Navigation config
├── data/              # Realistic mock data + deterministic seed helpers
├── hooks/             # useAsync, useDebounce, useMediaQuery, useLocalStorage
├── lib/               # cn() + formatting utilities
├── pages/             # One folder/file per route
├── services/          # Promise-based data-access layer (API-swappable)
├── types/             # Domain models
├── router.tsx         # Route definitions
├── App.tsx            # Providers + RouterProvider
└── main.tsx           # Entry point
```

## Modules

Dashboard · Asset Management · Inventory · Device Issue & Returns · Maintenance ·
Repairs · Spare Parts · CCTV · Reports & Analytics · Notifications · Users ·
Settings · Profile · Help Center.

## Connecting a Real Backend

The UI never imports mock data directly for reads — it goes through
`src/services`. Each resource is created with `createCollectionService`, which
exposes `all / query / getById / create / update / remove`.

To go live, replace the internals of `src/services/http.ts` (and the service
wiring in `src/services/index.ts`) with real `fetch`/axios calls that return the
same shapes defined in `src/types`. **No UI component needs to change.**

```ts
// Example: swap the mock for a REST call
export const assetService = {
  all: () => fetch("/api/assets").then((r) => r.json()),
  query: (params) => fetch(`/api/assets?${toQuery(params)}`).then((r) => r.json()),
  // …
};
```

## Design System

- Light & dark themes via CSS variables (`hsl(var(--token))`) and a `class`-based
  dark mode. Theme preference persists to `localStorage` and respects the OS.
- Semantic color tokens (`primary`, `success`, `warning`, `info`, `destructive`,
  `chart-1…5`, dedicated `sidebar-*` tokens).
- Glassmorphism surfaces, soft gradients, elegant loading skeletons, hover and
  page-transition animations, and accessible Radix-based primitives.

## Notes

- Actions such as "Add", "Export" or "Invite" surface toasts to demonstrate the
  flow; the Asset module includes a full create/edit form (React Hook Form + Zod)
  and mutations run against the in-memory store so the UI feels live within a
  session (data resets on reload).

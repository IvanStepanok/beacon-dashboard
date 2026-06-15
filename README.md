# Beacon Analyst Console

**Next.js 16 + React 19 + Tailwind 4 + MapLibre** web client for Beacon — the open-source
crisis-damage crowdsourcing system. Talks to the Go backend's live API (no mock layer),
with JWT auth and role-based UI gating.

## Pages

| Route | What it is |
| --- | --- |
| `/` | **Overview** — crisis-scoped stats, 3-tier damage rollup, activity time-series, most-affected areas, recent reports. "Print situation brief" renders a print-only decision-maker summary (browser Save-as-PDF). |
| `/crises` | Crisis registry: active/closed list plus the emergent-proposal review queue (confirm/dismiss, senior roles only). |
| `/dispatch` | **Verification queue** — triage incoming community reports: verify, hold for review, or flag, with photo-gated audited decisions (force-verify requires a note). Beacon is a situational-awareness dataset, not a responder-dispatch system. |
| `/map` | **Live map** — clustered report pins, damage/verification filters, crisis selector, 30s polling. |
| `/reports` | Filterable report table with inline detail panel, per-building damage timeline, authenticated photo view. || `/login` | JWT sign-in; demo accounts are listed on the page. |
| `/public` | **Community view, no login** — aggregated damage heatmap + area-level counts only. Verified reports, coordinates coarsened to ~110 m by the backend, zoom capped, no individual pins at any zoom. EN/AR toggle (RTL). |

## Auth & roles

`POST /auth/login` returns a JWT kept in `localStorage` and sent as a `Bearer` header by
`lib/api.ts`. Five roles, enforced **server-side** (the UI only hides what a role cannot
do): `crisis_admin` and `regional_analyst` (full, incl. crisis lifecycle), `co_analyst`
and `field_validator` (verify/triage within their crisis scope), `external_viewer`
(read-only; the backend serves it the same verified-only coarsened projection as
anonymous callers). `/public` uses the anonymous tier — no token at all.

## How it talks to the API

All calls go through `lib/api.ts`: `api.*` attaches the analyst JWT (401 → token dropped,
bounce to `/login`); `publicApi.*` deliberately sends **no** Authorization header so the
backend applies the public anonymous tier. Endpoints used include `/stats/overview`,
`/reports` (keyset pagination via opaque `nextCursor`), `/reports/export`
(GeoJSON / HXL-CSV / GeoPackage / Shapefile), `/map/features`, `/reports/area-groups` and
`/crises/*`. Contract: `backend/openapi.yaml`.

**Why the analyst map uses REST + a truncation banner instead of the MVT tile endpoint:**
the backend already serves vector tiles (`/api/v1/tiles/reports/{z}/{x}/{y}`, both trust
tiers), but the analyst map today loads reports via paged REST (`listAllReports`: keyset
pages of 200, hard-capped at 25 pages = 5,000 reports) because the map's client-side
filters, pin selection and detail panel all need full report objects in memory. When the
cap is hit, a `TruncationBanner` says honestly how many of the total are shown rather than
silently dropping data. Switching the map source to the MVT endpoint is the documented
scale path once a single crisis routinely exceeds the cap.

## Run

```bash
npm install
npm run dev     # http://localhost:3000, against NEXT_PUBLIC_BEACON_API
npm run lint && npm run build
```

## Build & deploy

`NEXT_PUBLIC_BEACON_API` points at the backend; it defaults to `http://localhost:8080`
and is **baked into the client bundle at build time** (`NEXT_PUBLIC_*` = public, not a
secret) — rebuild to change it (`.env.production` holds the deployed value). The build
emits a self-contained server (`output: "standalone"` → `node .next/standalone/server.js`)
for container deploy.

## Languages

The analyst console is **English-only by design** — it is an internal operations tool for
UNDP analysts. The multilingual load sits on the citizen-facing surfaces: the mobile
reporter app ships all 6 UN languages (incl. RTL Arabic), and the `/public` community
view ships an EN/AR toggle (static dictionary, no i18n framework).

## License

Apache-2.0 — see [`LICENSE`](./LICENSE). Project docs and honest build status live in the
main Beacon repo (`docs/STATUS.md`).

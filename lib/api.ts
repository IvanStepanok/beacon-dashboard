// Typed client for the Beacon Go backend (browser-side; carries the analyst JWT).
import type { Crisis, DangerZone, Report, TaskStatus, Severity, Disposition, Verification } from "./types";

const BASE =
  process.env.NEXT_PUBLIC_BEACON_API?.replace(/\/$/, "") ?? "http://localhost:8080";
const API = `${BASE}/api/v1`;

/** Public origin of the API, for building absolute asset URLs (e.g. report photos). */
export const API_BASE = BASE;

const TOKEN_KEY = "beacon_token";
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string) {
  window.localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(extra?: HeadersInit): HeadersInit {
  const t = getToken();
  return { ...(extra ?? {}), ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

// On 401, the session is gone/expired → drop the token and bounce to /login.
function on401() {
  if (typeof window !== "undefined") {
    clearToken();
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  }
}

async function get<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, { cache: "no-store", ...init, headers: authHeaders(init?.headers) });
  if (res.status === 401) {
    on401();
    throw new Error("unauthorized");
  }
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export interface StatsOverview {
  totalReports: number;
  damageCounts: Record<string, number>;
  verificationCounts: Record<string, number>;
  syncedCount: number;
  syncedPct: number;
  destroyedPct: number;
  severePlusPct: number;
  completePct?: number;
  // 3-tier rollup (minimal/partial/complete) computed server-side — the canonical
  // breakdown under the tier3 default scale (the 5-level damageCounts miss tier3 rows).
  damageTierCounts?: Record<string, number>;
  taskCounts: Record<string, number>;
  lifeSafetyOpen: number;
  areas: { area: string; count: number; worst: string }[];
  timeSeries: { hour: number; count: number }[];
  recent: Report[];
}

export interface ListResult {
  items: Report[];
  total: number;
  grandTotal: number;
  nextCursor?: string;
}

export interface ReportFilters {
  crisisId?: string;
  damage?: string[];
  verification?: string[];
  taskStatus?: string[];
  severity?: string[];
  lifeSafety?: boolean;
  cluster?: string;
  adm2Pcode?: string;
  adm3Pcode?: string;
  assignee?: string;
  q?: string;
  pageSize?: number;
  cursor?: string;
}

function qs(f: ReportFilters): string {
  const p = new URLSearchParams();
  if (f.crisisId) p.set("crisisId", f.crisisId);
  f.damage?.forEach((d) => p.append("damage", d));
  f.verification?.forEach((v) => p.append("verification", v));
  f.taskStatus?.forEach((t) => p.append("taskStatus", t));
  f.severity?.forEach((s) => p.append("severity", s));
  if (f.lifeSafety) p.set("lifeSafety", "true");
  if (f.cluster) p.set("cluster", f.cluster);
  if (f.adm2Pcode) p.set("adm2Pcode", f.adm2Pcode);
  if (f.adm3Pcode) p.set("adm3Pcode", f.adm3Pcode);
  if (f.assignee) p.set("assignee", f.assignee);
  if (f.q) p.set("q", f.q);
  if (f.cursor) p.set("cursor", f.cursor);
  p.set("pageSize", String(f.pageSize ?? 200));
  return p.toString();
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  region?: string;
  crisisScope: string[];
}

export const api = {
  async login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.status === 401) throw new Error("invalid email or password");
    if (!res.ok) throw new Error(`login → ${res.status}`);
    return res.json();
  },
  me: () => get<AuthUser>("/auth/me"),

  /** Crises filtered by status (e.g. "proposed" for the emergent-review queue, "active"). */
  crises: (status?: string) =>
    get<{ items: Crisis[] }>(`/crises${status ? `?status=${encodeURIComponent(status)}` : ""}`).then((r) => r.items),

  /** Analyst confirm/dismiss of a crisis (e.g. an emergent proposal → active | dismissed). */
  async setCrisisStatus(id: string, status: string): Promise<Crisis> {
    const res = await fetch(`${API}/crises/${id}/status`, {
      method: "PATCH",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ status }),
    });
    if (res.status === 401) { on401(); throw new Error("unauthorized"); }
    if (!res.ok) throw new Error(`crisis status → ${res.status}`);
    return res.json();
  },

  /** Global client config — the capture scale (tier3 | ems98). */
  config: () => get<{ damageScale: string }>("/config"),
  async setConfig(damageScale: string): Promise<{ damageScale: string }> {
    const res = await fetch(`${API}/config`, {
      method: "PATCH",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ damageScale }),
    });
    if (res.status === 401) { on401(); throw new Error("unauthorized"); }
    if (!res.ok) throw new Error(`config → ${res.status}`);
    return res.json();
  },

  statsOverview: (crisisId?: string) => {
    const q = crisisId ? `?${new URLSearchParams({ crisisId }).toString()}` : "";
    return get<StatsOverview>(`/stats/overview${q}`);
  },
  listReports: (f: ReportFilters = {}) => get<ListResult>(`/reports?${qs(f)}`),

  /**
   * Paginate-and-accumulate: follows the keyset `nextCursor` (opaque token,
   * NEVER constructed/parsed client-side) until it is empty or `maxPages` is
   * hit. Bounded at maxPages*200 reports. `total`/`grandTotal` come from the
   * first page (stable across pages per the backend). Pass `opts.signal` to
   * abort mid-loop (e.g. on unmount).
   */
  listAllReports: async (
    f: ReportFilters = {},
    opts: { maxPages?: number; signal?: () => boolean } = {},
  ): Promise<ListResult> => {
    const maxPages = opts.maxPages ?? 25;
    let cursor: string | undefined = undefined;
    let items: Report[] = [];
    let total = 0;
    let grandTotal = 0;
    for (let i = 0; i < maxPages; i++) {
      if (opts.signal?.()) break;
      const page = await api.listReports({ ...f, cursor });
      if (i === 0) {
        total = page.total;
        grandTotal = page.grandTotal;
      }
      items = items.concat(page.items);
      if (!page.nextCursor) {
        cursor = undefined;
        break;
      }
      cursor = page.nextCursor;
    }
    return { items, total, grandTotal, nextCursor: cursor };
  },
  report: (id: string) => get<Report>(`/reports/${id}`),
  activeCrisis: () => get<Crisis>("/crises/active"),
  dangerZones: (crisisId: string) =>
    get<{ items: DangerZone[] }>(`/crises/${encodeURIComponent(crisisId)}/danger-zones`).then((r) => r.items),
  buildingTimeline: (buildingId: string) =>
    get<{ buildingId: string; current: string | null; versions: unknown[] }>(
      `/buildings/${encodeURIComponent(buildingId)}/timeline`,
    ),
  exportUrl: (format: "geojson" | "csv" | "gpkg" | "pdna", f: ReportFilters = {}) =>
    `${API}/reports/export?format=${format}&${qs(f)}`,

  /**
   * Authenticated export download. A plain <a href> navigation carries no
   * Authorization header → 401, so we fetch the export with the analyst JWT,
   * read it as a Blob, and hand back a suggested filename for the caller to
   * trigger the download. The filename prefers the server's Content-Disposition.
   */
  async exportBlob(
    format: "geojson" | "csv" | "gpkg" | "pdna",
    f: ReportFilters = {},
  ): Promise<{ blob: Blob; filename: string }> {
    const res = await fetch(`${API}/reports/export?format=${format}&${qs(f)}`, {
      cache: "no-store",
      headers: authHeaders(),
    });
    if (res.status === 401) {
      on401();
      throw new Error("unauthorized");
    }
    if (!res.ok) throw new Error(`export → ${res.status}`);
    const blob = await res.blob();
    const ext = format === "csv" ? "csv" : format === "gpkg" ? "gpkg" : format === "pdna" ? "csv" : "geojson";
    const cd = res.headers.get("Content-Disposition");
    const match = cd?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    const filename = match ? decodeURIComponent(match[1]) : `beacon-export-${format}.${ext}`;
    return { blob, filename };
  },

  async patchVerification(id: string, verification: Verification): Promise<Report> {
    const res = await fetch(`${API}/reports/${id}/verification`, {
      method: "PATCH",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ verification }),
    });
    if (res.status === 401) { on401(); throw new Error("unauthorized"); }
    if (!res.ok) throw new Error(`verification → ${res.status}`);
    return res.json();
  },

  async patchTask(
    id: string,
    body: {
      taskStatus?: TaskStatus;
      assignee?: string;
      severity?: Severity;
      disposition?: Disposition;
      clusters?: string[];
      note?: string;
    },
  ): Promise<Report> {
    const res = await fetch(`${API}/reports/${id}/task`, {
      method: "PATCH",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
    if (res.status === 401) { on401(); throw new Error("unauthorized"); }
    if (!res.ok) throw new Error(`task → ${res.status}`);
    return res.json();
  },
};

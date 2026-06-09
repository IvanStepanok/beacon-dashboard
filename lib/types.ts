// Canonical contract — mirrors the Go backend's camelCase JSON (superset).

export type DamageLevel = "none" | "slight" | "moderate" | "severe" | "destroyed";
// The challenge's REQUIRED core indicator: a 3-level classification. Either
// vocabulary (5-level EMS-98 or 3-tier) rolls up to this.
export type DamageTier = "minimal" | "partial" | "complete";
export type Verification = "pending" | "verified" | "flagged";
export type DebrisState = "yes" | "no" | "unsure";
export type TaskStatus = "new" | "triaged" | "assigned" | "in_progress" | "resolved" | "closed";
export type Severity = "routine" | "elevated" | "life_safety";
export type Disposition =
  | "resolved" | "cleared_nothing_found" | "no_action_needed"
  | "gone_on_arrival" | "unfounded" | "duplicate" | "referred";

export interface AdminRef {
  pcode: string;
  name: string;
}
export interface AdminChain {
  adm0?: AdminRef;
  adm1?: AdminRef;
  adm2?: AdminRef;
  adm3?: AdminRef;
}

export interface ReportDescription {
  original: string;
  originalLang: string;
  translated: string;
  translatedLang?: string;
}

export type ElectricityCondition = "none_observed" | "minor" | "moderate" | "severe" | "destroyed" | "unknown";
export type HealthServices = "fully_functional" | "partially_functional" | "largely_disrupted" | "not_functioning" | "unknown";
export type PressingNeed =
  | "food_water" | "cash" | "healthcare" | "shelter" | "livelihoods"
  | "wash" | "protection" | "local_support" | "other";

// Optional Appendix-1 modular sections. Wire shape (key "modular"): exactly
// { electricity: string|null, healthServices: string|null, pressingNeeds: string[] }.
// Values are the mobile enum constant names lowercased (it.name.lowercase()).
export interface Modular {
  electricity?: ElectricityCondition | string | null;
  healthServices?: HealthServices | string | null;
  pressingNeeds?: (PressingNeed | string)[];
}

export interface Report {
  id: string;
  damage: DamageLevel;
  possiblyDamaged: boolean;
  infra: string[];
  infraTypes: string[];
  crisis: string[];
  crisisNature: string[];
  debris: DebrisState;
  // Nullable: a landmark-only report has no resolved point — the backend serves
  // lat/lng = null with locationResolved = false (never 0,0 / Null Island).
  lat: number | null;
  lng: number | null;
  locationResolved?: boolean;
  landmark?: string;
  buildingId?: string;
  what3words?: string;
  plusCode?: string;
  place: string;
  photoUrl?: string;
  admin?: AdminChain;
  adm1Pcode?: string;
  adm2Pcode?: string;
  adm3Pcode?: string;
  damageTier: DamageTier;
  version: number;
  supersedesReportId?: string;
  description?: ReportDescription;
  modular?: Modular;
  aiLevel?: DamageLevel;
  aiConfidence?: number;
  sizeMb: number;
  ageMin: number;
  capturedAt: string;
  synced: boolean;
  verification: Verification;
  // tasking axis
  taskStatus: TaskStatus;
  disposition?: Disposition;
  assignee?: string;
  taskRef?: string;
  severity: Severity;
  lifeSafety: boolean;
  clusters: string[];
}

export type CrisisStatus = "active" | "proposed" | "closed" | "dismissed";

export interface Crisis {
  id: string;
  title: string;
  area: string;
  nature: string;
  lat: number;
  lng: number;
  source: string;
  startedAt: string;
  startedAgoHrs: number;
  glide?: string;
  responseLevel?: number;
  status: CrisisStatus;
  radiusKm: number;
  reportCount: number;
  responseId?: string;
  distanceKm?: number;
}

export interface DangerZone {
  id: string;
  name: string;
  note: string;
  severity: "caution" | "warning" | "critical";
}

// ── display maps ──────────────────────────────────────────────────────

// 5-level ordinal, trauma-informed (muted green → terracotta, never pure red).
export const DAMAGE_COLORS: Record<DamageLevel, string> = {
  none: "#3FA463",
  slight: "#8FB339",
  moderate: "#D49A2A",
  severe: "#C8743C",
  destroyed: "#B66250",
};
export const DAMAGE_LABELS: Record<DamageLevel, string> = {
  none: "No visible damage",
  slight: "Slight",
  moderate: "Moderate",
  severe: "Severe",
  destroyed: "Destroyed",
};
export const DAMAGE_ORDER: DamageLevel[] = ["none", "slight", "moderate", "severe", "destroyed"];

// ── 3-tier (required core indicator) ──────────────────────────────────
export const DAMAGE_TIER_LABELS: Record<DamageTier, string> = {
  minimal: "Minimal / no damage",
  partial: "Partially damaged",
  complete: "Completely destroyed",
};
export const DAMAGE_TIER_COLORS: Record<DamageTier, string> = {
  minimal: "#3FA463",
  partial: "#D49A2A",
  complete: "#B66250",
};
export const DAMAGE_TIER_ORDER: DamageTier[] = ["minimal", "partial", "complete"];

/** Roll up either vocabulary (5-level EMS-98 or 3-tier) to the required 3 tiers. */
export function rollupTier(d: string): DamageTier {
  if (d === "none" || d === "slight" || d === "minimal") return "minimal";
  if (d === "moderate" || d === "severe" || d === "partial") return "partial";
  return "complete";
}

// Vocabulary-agnostic label/color for any damage value (5-level OR 3-tier).
export function damageLabel(d: string): string {
  return (DAMAGE_LABELS as Record<string, string>)[d] ?? (DAMAGE_TIER_LABELS as Record<string, string>)[d] ?? d;
}
export function damageColor(d: string): string {
  return (DAMAGE_COLORS as Record<string, string>)[d] ?? (DAMAGE_TIER_COLORS as Record<string, string>)[d] ?? "#9aa";
}

export const VERIFICATION_LABELS: Record<Verification, string> = {
  pending: "Pending",
  verified: "Verified",
  flagged: "Flagged",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  new: "New",
  triaged: "Triaged",
  assigned: "Assigned",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};
export const TASK_STATUS_ORDER: TaskStatus[] = ["new", "triaged", "assigned", "in_progress", "resolved", "closed"];

export const SEVERITY_LABELS: Record<Severity, string> = {
  routine: "Routine",
  elevated: "Elevated",
  life_safety: "Life-safety",
};

export const DISPOSITION_LABELS: Record<Disposition, string> = {
  resolved: "Resolved",
  cleared_nothing_found: "Cleared — nothing found",
  no_action_needed: "No action needed",
  gone_on_arrival: "Gone on arrival",
  unfounded: "Unfounded / false",
  duplicate: "Duplicate",
  referred: "Referred",
};

export const CLUSTER_LABELS: Record<string, string> = {
  slsc: "Shelter (SLSC)",
  health: "Health",
  wash: "WASH",
  education: "Education",
  food_security: "Food security",
  protection: "Protection",
  logistics: "Logistics",
  nutrition: "Nutrition",
  etc: "ETC",
  cccm: "CCCM",
  early_recovery: "Early recovery",
};

// ── Modular Appendix-1 sections (optional secondary impacts) ──────────
// Keys mirror the mobile enum constants lowercased (it.name.lowercase()),
// underscores preserved. Unmapped values fall through via `?? raw` at the
// call site so a future enum constant degrades to its raw string, never crashes.
export const ELECTRICITY_LABELS: Record<string, string> = {
  none_observed: "No outage observed",
  minor: "Minor disruption",
  moderate: "Moderate disruption",
  severe: "Severe disruption",
  destroyed: "Grid destroyed",
  unknown: "Unknown",
};
export const HEALTH_SERVICES_LABELS: Record<string, string> = {
  fully_functional: "Fully functional",
  partially_functional: "Partially functional",
  largely_disrupted: "Largely disrupted",
  not_functioning: "Not functioning",
  unknown: "Unknown",
};
export const PRESSING_NEED_LABELS: Record<string, string> = {
  food_water: "Food & water",
  cash: "Cash",
  healthcare: "Healthcare",
  shelter: "Shelter",
  livelihoods: "Livelihoods",
  wash: "WASH",
  protection: "Protection",
  local_support: "Local support",
  other: "Other",
};

/** True when at least one modular section carries a value (so views can skip the empty card). */
export function hasModular(m?: Modular): boolean {
  return !!m && (!!m.electricity || !!m.healthServices || (m.pressingNeeds?.length ?? 0) > 0);
}

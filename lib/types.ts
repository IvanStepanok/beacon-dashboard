// Canonical contract — mirrors the Go backend's camelCase JSON (superset).

// The challenge's REQUIRED core indicator: a 3-level damage classification.
export type DamageTier = "minimal" | "partial" | "complete";
export type Verification = "pending" | "verified" | "flagged";
export type DebrisState = "yes" | "no" | "unsure";

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
  | "wash" | "protection" | "local_support" | "basic_services" | "other";

// Optional Appendix-1 modular sections. Wire shape (key "modular"): exactly
// { electricity: string|null, healthServices: string|null, pressingNeeds: string[] }
// plus the optional free-text pressingNeedsOther accompanying the "other" need.
// Values are the mobile enum constant names lowercased (it.name.lowercase()).
export interface Modular {
  electricity?: ElectricityCondition | string | null;
  healthServices?: HealthServices | string | null;
  pressingNeeds?: (PressingNeed | string)[];
  pressingNeedsOther?: string | null;
}

export interface Report {
  id: string;
  damage: DamageTier;
  possiblyDamaged: boolean;
  infra: string[];
  infraTypes: string[];
  // Reporter-entered name/details of the infrastructure (any type, e.g. a school name).
  infraName?: string;
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
  // "footprint" ONLY when a real footprint polygon was tapped on the map — a
  // trust signal worth surfacing (vs. a free pin or landmark guess).
  buildingSource?: string;
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
  aiLevel?: DamageTier;
  aiConfidence?: number;
  sizeMb: number;
  ageMin: number;
  capturedAt: string;
  synced: boolean;
  verification: Verification;
  // affected-sector tags (OCHA humanitarian clusters) — optional data dimension
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

// Area-level aggregate from /reports/area-groups: per-place report count + worst
// damage tier + its canonical 3-tier rollup. Carries NO coordinates — safe to
// render on the public community view.
export interface AreaGroup {
  area: string;
  count: number;
  worst: string;
  worstTier: DamageTier;
}

// ── 3-tier display maps (the required core indicator) ─────────────────
// Trauma-informed ramp: muted green → amber → terracotta, never pure red.
export const DAMAGE_TIER_LABELS: Record<DamageTier, string> = {
  minimal: "Minimal / no damage",
  partial: "Partially damaged",
  complete: "Completely destroyed",
};
// UNDP Design System semantic palette (green-600 / yellow-600 / red-600).
export const DAMAGE_TIER_COLORS: Record<DamageTier, string> = {
  minimal: "#59BA47",
  partial: "#FBC412",
  complete: "#D12800",
};
export const DAMAGE_TIER_ORDER: DamageTier[] = ["minimal", "partial", "complete"];

/** Normalize a damage value to the 3 mandated tiers (values are 3-tier now; defensive). */
export function rollupTier(d: string): DamageTier {
  if (d === "partial") return "partial";
  if (d === "complete") return "complete";
  return "minimal";
}

/** Label/color for a 3-tier damage value (unknown → graceful fallback). */
export function damageLabel(d: string): string {
  return (DAMAGE_TIER_LABELS as Record<string, string>)[d] ?? d;
}
export function damageColor(d: string): string {
  return (DAMAGE_TIER_COLORS as Record<string, string>)[d] ?? "#9aa";
}

export const VERIFICATION_LABELS: Record<Verification, string> = {
  pending: "Pending",
  verified: "Verified",
  flagged: "Flagged",
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
  basic_services: "Basic services & infrastructure",
  other: "Other",
};

/** True when at least one modular section carries a value (so views can skip the empty card). */
export function hasModular(m?: Modular): boolean {
  return !!m && (!!m.electricity || !!m.healthServices || (m.pressingNeeds?.length ?? 0) > 0 || !!m.pressingNeedsOther);
}

// ── Modular capture-form schema (GET /form-schema, PATCH /crises/{id}/form) ──

export interface FormOption {
  value: string;
  label: string;
}
export interface FormSection {
  key: string;
  title: string;
  type: "single" | "multi";
  required: boolean;
  allowOtherText?: boolean;
  options: FormOption[];
}
/** GET /form-schema envelope: the crisis's RESOLVED sections (defaults + overrides; disabled sections omitted). */
export interface FormSchema {
  sections: FormSection[];
}
/** PATCH /crises/{id}/form body: section keys flipped to required / removed from the form. */
export interface FormOverrides {
  required: string[];
  disabled: string[];
}

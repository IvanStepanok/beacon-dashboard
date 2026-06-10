export function relativeTime(ageMin: number): string {
  if (ageMin < 1) return "just now";
  if (ageMin < 60) return `${ageMin} min ago`;
  const h = Math.floor(ageMin / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.floor(h / 24)} d ago`;
}

// Reporter-side generic place labels carry no analyst value ("Your location" is
// what the phone stamps when it has a GPS fix but no reverse-geocoded name).
const GENERIC_PLACE = new Set(["", "your location", "unknown", "—"]);

/**
 * Human locator for a report row / panel: a real place name when the reporter (or
 * geocoder) gave one, else the precise offline Plus Code, else the coordinates.
 * Avoids the useless "Your location" stamp.
 */
export function locationLabel(r: {
  place?: string;
  plusCode?: string;
  what3words?: string;
  lat?: number | null;
  lng?: number | null;
  landmark?: string;
}): string {
  const place = (r.place ?? "").trim();
  if (place && !GENERIC_PLACE.has(place.toLowerCase())) return place;
  const code = r.plusCode || r.what3words;
  if (code) return code;
  if (typeof r.lat === "number" && typeof r.lng === "number") {
    return `${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}`;
  }
  // Location-unresolved (landmark-only) report: no coordinates were ever resolved,
  // so the free-text landmark is the only locator we have.
  const landmark = (r.landmark ?? "").trim();
  if (landmark) return landmark;
  return "—";
}

/**
 * The "Coordinates" cell: precise decimal-degree pair when the report has a
 * resolved point, otherwise an explicit unresolved label (never "0, 0" — the
 * backend serves lat/lng = null for landmark-only reports).
 */
export function coordsLabel(
  r: { lat?: number | null; lng?: number | null; landmark?: string },
  digits = 4,
): string {
  if (typeof r.lat === "number" && typeof r.lng === "number") {
    return `${r.lat.toFixed(digits)}, ${r.lng.toFixed(digits)}`;
  }
  const landmark = (r.landmark ?? "").trim();
  return landmark ? `Location unresolved · landmark: ${landmark}` : "Location unresolved";
}

/**
 * Crisis title with a graceful fallback: legacy emergent titles were built from
 * the report's place and can carry the useless "Your location" stamp until data
 * cleanup (the backend now derives titles from admin areas) — render a neutral
 * coordinate-anchored name instead of the placeholder.
 */
export function crisisTitle(c: { title?: string; lat: number; lng: number }): string {
  const t = (c.title ?? "").trim();
  if (t && !/your location/i.test(t)) return t;
  return `Unnamed event near ${c.lat.toFixed(2)}, ${c.lng.toFixed(2)}`;
}

/**
 * Crisis area with the same "Your location" guard as crisisTitle: legacy
 * emergent rows stamped the reporter-side placeholder into `area` too.
 */
export function crisisArea(c: { area?: string; lat: number; lng: number }): string {
  const a = (c.area ?? "").trim();
  if (a && !/your location/i.test(a)) return a;
  return `near ${c.lat.toFixed(2)}, ${c.lng.toFixed(2)}`;
}

type AdminLike = { name?: string } | undefined;
/**
 * Best available admin area for the Area column: the deepest resolved level
 * (district → region → country). geoBoundaries fills ADM1, the Antakya seed has
 * ADM3, the global baseline fills ADM0 — so show whatever is deepest rather than
 * only ADM3 (which was blank for every non-seed report).
 */
export function areaLabel(r: {
  admin?: { adm0?: AdminLike; adm1?: AdminLike; adm2?: AdminLike; adm3?: AdminLike };
}): string {
  const a = r.admin;
  return a?.adm3?.name || a?.adm2?.name || a?.adm1?.name || a?.adm0?.name || "—";
}

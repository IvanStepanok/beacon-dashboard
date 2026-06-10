"use client";

import { useEffect, useMemo, useState } from "react";
import { Radar, ShieldCheck } from "lucide-react";
import { PublicHeatmap } from "@/components/PublicHeatmap";
import { publicApi, type MapFeatureCollection } from "@/lib/api";
import { crisisTitle } from "@/lib/format";
import { DAMAGE_TIER_COLORS, DAMAGE_TIER_ORDER, damageColor, rollupTier } from "@/lib/types";
import type { AreaGroup, Crisis, DamageTier } from "@/lib/types";

// Static EN/AR dictionary for this ONE page — no i18n framework on purpose.
// The citizen-facing mobile app carries all 6 UN languages; this public view
// ships the two most relevant to the demo crisis region (incl. RTL Arabic).
const STRINGS = {
  en: {
    brand: "Beacon",
    pageTitle: "Community view",
    subtitle: "Aggregated damage hotspots from verified community reports",
    noCrisis: "No active crisis right now",
    loading: "Loading community view…",
    // Counts latest-per-building map features, not raw report rows.
    verifiedReports: "Verified damage locations",
    tier: {
      minimal: "Minimal / no damage",
      partial: "Partially damaged",
      complete: "Completely destroyed",
    } as Record<DamageTier, string>,
    mostAffected: "Most-affected areas",
    live: "Live",
    footer:
      "Community view — aggregated for privacy. Exact locations visible to verified responders only.",
  },
  ar: {
    brand: "بيكون",
    pageTitle: "عرض المجتمع",
    subtitle: "بؤر الأضرار المجمّعة من بلاغات المجتمع الموثّقة",
    noCrisis: "لا توجد أزمة نشطة حالياً",
    loading: "جارٍ تحميل عرض المجتمع…",
    verifiedReports: "مواقع أضرار موثّقة",
    tier: {
      minimal: "أضرار طفيفة / لا أضرار",
      partial: "أضرار جزئية",
      complete: "مدمّر بالكامل",
    } as Record<DamageTier, string>,
    mostAffected: "المناطق الأكثر تضرراً",
    live: "مباشر",
    footer:
      "عرض المجتمع — بيانات مجمّعة حفاظاً على الخصوصية. المواقع الدقيقة متاحة للمستجيبين المعتمدين فقط.",
  },
} as const;
type Lang = keyof typeof STRINGS;

// Count noun for the area list. Arabic inflects by count (singular, dual,
// 3–10 plural, 11+ singular accusative) — a tiny rule beats an i18n framework
// for this one line.
function reportsNoun(lang: Lang, n: number): string {
  if (lang === "ar") {
    if (n === 1) return "بلاغ";
    if (n === 2) return "بلاغان";
    if (n <= 10) return "بلاغات";
    return "بلاغاً";
  }
  return n === 1 ? "report" : "reports";
}

export default function PublicCommunityPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [crisis, setCrisis] = useState<Crisis | null>(null);
  const [fc, setFc] = useState<MapFeatureCollection | null>(null);
  const [areas, setAreas] = useState<AreaGroup[]>([]);
  const [scopeReady, setScopeReady] = useState(false);

  // Mirror the toggle onto <html> so browser chrome (find-in-page, screen
  // readers, spellcheck) follows the page language; restore EN/LTR on unmount.
  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = lang === "ar" ? "rtl" : "ltr";
    return () => {
      el.lang = "en";
      el.dir = "ltr";
    };
  }, [lang]);

  // Resolve the crisis header first; data fetches inherit its scope (the backend
  // resolves an omitted crisisId to the newest active crisis either way).
  useEffect(() => {
    let cancelled = false;
    publicApi
      .activeCrisis()
      .then((c) => { if (!cancelled) setCrisis(c); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setScopeReady(true); });
    return () => { cancelled = true; };
  }, []);

  // 60s silent re-poll keeps the hotspots fresh without leaning on the anonymous
  // rate-limit tier (the authenticated analyst views poll at 30s).
  useEffect(() => {
    if (!scopeReady) return;
    let cancelled = false;
    const fetchAll = () => {
      publicApi.mapFeatures(crisis?.id).then((d) => { if (!cancelled) setFc(d); }).catch(() => {});
      publicApi.areaGroups(crisis?.id).then((d) => { if (!cancelled) setAreas(d); }).catch(() => {});
    };
    fetchAll();
    const t = setInterval(fetchAll, 60_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [scopeReady, crisis?.id]);

  // Damage-tier totals over the verified-only public features (heatmap input).
  const tierTotals = useMemo(() => {
    const totals: Record<DamageTier, number> = { minimal: 0, partial: 0, complete: 0 };
    for (const f of fc?.features ?? []) totals[rollupTier(f.properties.damage)] += 1;
    return totals;
  }, [fc]);

  const t = STRINGS[lang];

  if (!scopeReady) {
    return <div className="grid h-screen place-items-center text-ink3">{t.loading}</div>;
  }

  // dir flips the whole page for Arabic; the overlays use logical (ms-/me-/end-)
  // utilities so panels and counters mirror correctly under RTL.
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="relative h-screen w-full overflow-hidden">
      <PublicHeatmap fc={fc} center={crisis ? { lat: crisis.lat, lng: crisis.lng } : undefined} />

      {/* Header */}
      <div className="absolute inset-x-0 top-0 z-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line bg-surface/95 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-2xl bg-primary text-white shadow-sm shadow-primary/30">
            <Radar size={20} strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <div className="text-[16px] font-bold tracking-tight text-ink">{t.brand}</div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-ink3">{t.pageTitle}</div>
          </div>
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[14px] font-semibold text-ink">
            {crisis ? crisisTitle(crisis) : t.noCrisis}
          </div>
          <div className="truncate text-[12px] text-ink2">
            {crisis
              ? `${crisis.area}${crisis.glide ? ` · ${crisis.glide}` : ""} · ${crisis.startedAgoHrs}h`
              : t.subtitle}
          </div>
        </div>
        <div className="ms-auto flex items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-full bg-ok-soft px-2.5 py-1 text-[12px] font-semibold text-ok sm:inline-flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
            </span>
            {t.live}
          </span>
          <div className="flex overflow-hidden rounded-xl border border-line">
            {(["en", "ar"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                  lang === l ? "bg-primary text-white" : "bg-surface text-ink2 hover:bg-surface2"
                }`}
              >
                {l === "en" ? "EN" : "العربية"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Aggregates: tier totals (doubles as the heat legend) + area-level list.
          Area names only — the Q18 point: no individual GPS anywhere here. */}
      <div className="absolute bottom-16 end-4 top-20 z-10 flex w-72 flex-col gap-3 overflow-y-auto sm:w-80">
        <div className="rounded-2xl border border-line bg-surface/95 p-4 shadow-sm backdrop-blur">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink3">{t.verifiedReports}</div>
          <div className="mt-1 text-[28px] font-bold leading-none tabular-nums text-ink">
            {fc ? fc.features.length : "—"}
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {DAMAGE_TIER_ORDER.map((k) => (
              <div key={k} className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DAMAGE_TIER_COLORS[k] }} />
                <span className="text-[13px] font-medium text-ink">{t.tier[k]}</span>
                <span className="ms-auto text-[13px] font-semibold tabular-nums text-ink">{tierTotals[k]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface/95 p-4 shadow-sm backdrop-blur">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink3">{t.mostAffected}</div>
          <div className="mt-1 flex flex-col">
            {areas.slice(0, 8).map((a) => (
              <div key={a.area} className="flex items-center gap-2.5 border-b border-line py-2 last:border-0">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: a.worstTier ? DAMAGE_TIER_COLORS[a.worstTier] : damageColor(a.worst) }}
                />
                <span className="truncate text-[13px] font-medium text-ink">{a.area}</span>
                <span className="ms-auto shrink-0 text-[12px] font-semibold tabular-nums text-ink2">
                  {a.count} {reportsNoun(lang, a.count)}
                </span>
              </div>
            ))}
            {areas.length === 0 && <div className="py-2 text-[13px] text-ink3">—</div>}
          </div>
        </div>
      </div>

      {/* Privacy footer — the page's contract with the community. */}
      <div className="absolute inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 px-5 py-2.5 text-center text-[12px] font-medium text-ink2 backdrop-blur">
        <ShieldCheck size={13} className="-mt-0.5 me-1 inline text-ok" />
        {t.footer}
      </div>
    </div>
  );
}

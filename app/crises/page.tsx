"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Sparkles, Radio, Siren, CheckCircle2, XCircle, MapPin, Globe, Users, Clock, SlidersHorizontal,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, SectionTitle } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { crisisTitle, crisisArea } from "@/lib/format";
import type { Crisis } from "@/lib/types";

// How a crisis came into being — drives the source badge.
function sourceMeta(source: string): { label: string; icon: typeof Radio; cls: string } {
  if (source === "emergent") return { label: "Emergent · citizen cluster", icon: Sparkles, cls: "bg-primary-soft text-primary-ink" };
  return { label: source || "Analyst", icon: Radio, cls: "bg-surface2 text-ink2" };
}

export default function CrisesPage() {
  const { canMutate, user } = useAuth();
  const [proposed, setProposed] = useState<Crisis[]>([]);
  const [active, setActive] = useState<Crisis[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  // Which active crisis has its capture-form editor open (one at a time).
  const [formFor, setFormFor] = useState<string | null>(null);
  // Shaping what every reporter in a crisis is asked is a senior decision —
  // same RBAC as the backend's PATCH /crises/{id}/form.
  const canEditForm = user?.role === "regional_analyst" || user?.role === "crisis_admin";

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.crises("proposed"), api.crises("active")])
      .then(([p, a]) => { setProposed(p); setActive(a); })
      .catch(() => { setProposed([]); setActive([]); })
      .finally(() => setLoading(false));
  }, []);

  // Mount-time data load; the setState calls inside `load` are intentional.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const decide = async (id: string, status: "active" | "dismissed") => {
    if (!canMutate) return;
    setBusy(id);
    try { await api.setCrisisStatus(id, status); load(); }
    finally { setBusy(null); }
  };

  // Every proposed crisis is a community-EMERGENT one — a cluster of citizen reports
  // in one place + time auto-proposes it — so they all warrant an analyst's review.
  const needsReview = proposed;

  return (
    <div>
      <PageHeader
        title="Crises"
        subtitle="Confirm emergent events surfaced by citizen reports; browse the active crisis set."
        action={
          <button onClick={load} className="rounded-xl border border-line bg-surface px-3 py-2 text-[13px] font-semibold text-ink2 hover:bg-surface2">
            Refresh
          </button>
        }
      />

      <div className="px-8 py-6 space-y-6">
        {/* ── Proposals worth an analyst's attention ───────────────────── */}
        <section>
          <SectionTitle>
            <span className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              Needs review
              {needsReview.length > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[12px] font-bold text-white">{needsReview.length}</span>
              )}
            </span>
          </SectionTitle>

          {loading ? (
            <p className="text-[14px] text-ink3">Loading…</p>
          ) : needsReview.length === 0 ? (
            <Card><p className="text-[14px] text-ink3">No emergent crises awaiting review. A cluster of citizen reports in one place + time auto-proposes one here.</p></Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {needsReview.map((c) => {
                const sm = sourceMeta(c.source);
                return (
                  <Card key={c.id} className="border-primary/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="flex items-center gap-1.5 text-[16px] font-bold text-ink">
                          <Siren size={16} className="shrink-0 text-primary" /> {crisisTitle(c)}
                        </h3>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-ink2">
                          <MapPin size={13} /> {crisisArea(c)} · <span className="capitalize">{c.nature}</span>
                        </p>
                      </div>
                      <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${sm.cls}`}>
                        <sm.icon size={12} /> {sm.label}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink2">
                      <span className="flex items-center gap-1.5"><Users size={13} className="text-ink3" /> {c.reportCount} reports</span>
                      <span className="flex items-center gap-1.5"><Clock size={13} className="text-ink3" /> {c.startedAgoHrs}h ago</span>
                      <span className="flex items-center gap-1.5"><MapPin size={13} className="text-ink3" /> ~{Math.round(c.radiusKm)} km radius</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        disabled={busy === c.id || !canMutate}
                        onClick={() => decide(c.id, "active")}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-ok py-2.5 text-[14px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
                      >
                        <CheckCircle2 size={16} /> Confirm crisis
                      </button>
                      <button
                        disabled={busy === c.id || !canMutate}
                        onClick={() => decide(c.id, "dismissed")}
                        className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-[14px] font-semibold text-ink2 hover:bg-surface2 disabled:opacity-50"
                      >
                        <XCircle size={16} /> Dismiss
                      </button>
                    </div>
                    {!canMutate && <p className="mt-2 text-[12px] text-ink3">Your role can view but not confirm.</p>}
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Active crises (senior roles can adjust the capture form) ───── */}
        <section>
          <SectionTitle>
            <span className="flex items-center gap-2"><Globe size={16} className="text-ink2" /> Active crises · {active.length}</span>
          </SectionTitle>
          <Card>
            {loading ? (
              <p className="text-[14px] text-ink3">Loading…</p>
            ) : active.length === 0 ? (
              <p className="text-[14px] text-ink3">No active crises.</p>
            ) : (
              <ul className="divide-y divide-line">
                {active.map((c) => {
                  const sm = sourceMeta(c.source);
                  return (
                    <li key={c.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${sm.cls}`}><sm.icon size={16} /></span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14px] font-semibold text-ink">{crisisTitle(c)}</div>
                          <div className="truncate text-[12px] text-ink3">
                            {crisisArea(c)} · <span className="capitalize">{c.nature}</span> · {c.reportCount} reports · {c.startedAgoHrs}h ago
                            {c.glide && <span className="ml-1.5 font-mono">{c.glide}</span>}
                          </div>
                        </div>
                        {canEditForm && (
                          <button
                            onClick={() => setFormFor((v) => (v === c.id ? null : c.id))}
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] font-semibold transition-colors ${
                              formFor === c.id ? "border-primary bg-primary-soft text-primary-ink" : "border-line text-ink2 hover:bg-surface2"
                            }`}
                          >
                            <SlidersHorizontal size={13} /> Capture form
                          </button>
                        )}
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${sm.cls}`}>{sm.label}</span>
                      </div>
                      {canEditForm && formFor === c.id && <CrisisFormEditor crisisId={c.id} />}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}

// ── Capture-form editor (the per-crisis form-overrides headline feature) ──

// Known modular sections with title fallbacks: the resolved GET omits disabled
// sections entirely, so the editor needs local titles to keep their rows visible.
const FORM_SECTION_TITLES: Record<string, string> = {
  electricity: "Electricity infrastructure condition",
  healthServices: "Health services functioning",
  pressingNeeds: "Most pressing needs",
};

type SectionMode = "default" | "required" | "disabled";

/**
 * Compact per-crisis editor over the modular capture form: each Appendix-1
 * section is optional by default, can be flipped to required, or disabled
 * (removed from the form reporters see). Loads the resolved schema from
 * GET /form-schema?crisisId=X (absent section ⇒ disabled), saves overrides via
 * PATCH /crises/{id}/form. Rendered for regional_analyst / crisis_admin only —
 * the backend enforces the same RBAC + crisis scope.
 */
function CrisisFormEditor({ crisisId }: { crisisId: string }) {
  const [modes, setModes] = useState<Record<string, SectionMode> | null>(null);
  const [titles, setTitles] = useState<Record<string, string>>(FORM_SECTION_TITLES);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .formSchema(crisisId)
      .then((schema) => {
        if (cancelled) return;
        // Known sections missing from the resolved schema are disabled; present
        // ones carry their requiredness. Unknown (future) keys render too.
        const next: Record<string, SectionMode> = {};
        const t = { ...FORM_SECTION_TITLES };
        for (const key of Object.keys(FORM_SECTION_TITLES)) next[key] = "disabled";
        for (const s of schema.sections) {
          next[s.key] = s.required ? "required" : "default";
          t[s.key] = s.title;
        }
        setModes(next);
        setTitles(t);
      })
      .catch(() => {
        if (!cancelled) setMsg({ ok: false, text: "Could not load the form schema." });
      });
    return () => { cancelled = true; };
  }, [crisisId]);

  const setMode = (key: string, mode: SectionMode) =>
    setModes((m) => (m ? { ...m, [key]: mode } : m));

  const save = async () => {
    if (!modes || saving) return;
    setSaving(true);
    setMsg(null);
    try {
      await api.patchCrisisForm(crisisId, {
        required: Object.keys(modes).filter((k) => modes[k] === "required"),
        disabled: Object.keys(modes).filter((k) => modes[k] === "disabled"),
      });
      setMsg({ ok: true, text: "Saved — reporters get the updated form on their next sync." });
    } catch (e) {
      setMsg({ ok: false, text: `Save failed — ${e instanceof Error ? e.message : "network error"}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-line bg-surface2/40 p-3">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink3">
        Capture form · modular sections
      </div>
      {!modes ? (
        <p className="text-[12px] text-ink3">{msg ? msg.text : "Loading form…"}</p>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            {Object.keys(modes).map((key) => (
              <div key={key} className="flex items-center gap-4">
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{titles[key] ?? key}</span>
                <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[12px] font-medium text-ink2">
                  <input
                    type="checkbox"
                    checked={modes[key] === "required"}
                    onChange={(e) => setMode(key, e.target.checked ? "required" : "default")}
                    className="accent-primary"
                  />
                  Required
                </label>
                <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[12px] font-medium text-ink2">
                  <input
                    type="checkbox"
                    checked={modes[key] === "disabled"}
                    onChange={(e) => setMode(key, e.target.checked ? "disabled" : "default")}
                    className="accent-primary"
                  />
                  Disabled
                </label>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              disabled={saving}
              onClick={save}
              className="rounded-lg bg-primary px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-primary-ink disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save form"}
            </button>
            {msg && (
              <span className={`text-[12px] font-medium ${msg.ok ? "text-ok" : "text-warn"}`}>{msg.text}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

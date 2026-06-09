"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Sparkles, Radio, Siren, CheckCircle2, XCircle, MapPin, Globe, Users, Clock,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, SectionTitle } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Crisis } from "@/lib/types";

// How a crisis came into being — drives the source badge.
function sourceMeta(source: string): { label: string; icon: typeof Radio; cls: string } {
  if (source === "emergent") return { label: "Emergent · citizen cluster", icon: Sparkles, cls: "bg-primary-soft text-primary-ink" };
  if (source.startsWith("feed:")) return { label: `Feed · ${source.slice(5)}`, icon: Globe, cls: "bg-ok-soft text-ok" };
  return { label: source || "Analyst", icon: Radio, cls: "bg-surface2 text-ink2" };
}

export default function CrisesPage() {
  const { canMutate } = useAuth();
  const [proposed, setProposed] = useState<Crisis[]>([]);
  const [active, setActive] = useState<Crisis[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

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
        {/* ── Emergent proposals awaiting review ───────────────────────── */}
        <section>
          <SectionTitle>
            <span className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              Pending review
              {proposed.length > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[12px] font-bold text-white">{proposed.length}</span>
              )}
            </span>
          </SectionTitle>

          {loading ? (
            <p className="text-[14px] text-ink3">Loading…</p>
          ) : proposed.length === 0 ? (
            <Card><p className="text-[14px] text-ink3">No emergent crises awaiting review. A cluster of citizen reports in one place + time auto-proposes one here.</p></Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {proposed.map((c) => {
                const sm = sourceMeta(c.source);
                return (
                  <Card key={c.id} className="border-primary/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="flex items-center gap-1.5 text-[16px] font-bold text-ink">
                          <Siren size={16} className="shrink-0 text-primary" /> {c.title}
                        </h3>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-ink2">
                          <MapPin size={13} /> {c.area} · <span className="capitalize">{c.nature}</span>
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

        {/* ── Active crises ─────────────────────────────────────────────── */}
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
                    <li key={c.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${sm.cls}`}><sm.icon size={16} /></span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-semibold text-ink">{c.title}</div>
                        <div className="truncate text-[12px] text-ink3">
                          {c.area} · <span className="capitalize">{c.nature}</span> · {c.reportCount} reports · {c.startedAgoHrs}h ago
                          {c.glide && <span className="ml-1.5 font-mono">{c.glide}</span>}
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${sm.cls}`}>{sm.label}</span>
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

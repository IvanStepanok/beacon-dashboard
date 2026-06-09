"use client";

import { useEffect, useState } from "react";
import { Layers, Check } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, SectionTitle } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const SCALES = [
  {
    value: "tier3",
    title: "3 tiers (required)",
    desc: "Reporters pick Minimal · Partially damaged · Completely destroyed — the challenge's core indicator. Simplest for the public.",
  },
  {
    value: "ems98",
    title: "5-level EMS-98",
    desc: "Reporters pick the engineering grade None · Slight · Moderate · Severe · Destroyed. Always rolls up to the 3 tiers for reporting.",
  },
];

export default function SettingsPage() {
  const { canMutate } = useAuth();
  const [scale, setScale] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.config().then((c) => setScale(c.damageScale)).catch(() => setScale("tier3")); }, []);

  const choose = async (value: string) => {
    if (!canMutate || busy || value === scale) return;
    setBusy(true);
    try { const c = await api.setConfig(value); setScale(c.damageScale); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Global capture configuration — applies to every reporter app at once." />
      <div className="px-8 py-6 max-w-2xl">
        <Card>
          <SectionTitle>
            <span className="flex items-center gap-2"><Layers size={16} className="text-primary" /> Damage classification scale</span>
          </SectionTitle>
          <p className="mb-4 text-[13px] text-ink2">
            Controls which scale reporters see when classifying building damage. Either way, the
            backend stores the required 3-tier rollup, so analytics and exports are unaffected.
          </p>
          <div className="flex flex-col gap-3">
            {SCALES.map((s) => {
              const active = scale === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => choose(s.value)}
                  disabled={busy || !canMutate}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed ${
                    active ? "border-primary bg-primary-soft/40" : "border-line bg-surface hover:bg-surface2"
                  }`}
                >
                  <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${active ? "border-primary bg-primary text-white" : "border-line"}`}>
                    {active && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span>
                    <span className="block text-[14px] font-semibold text-ink">{s.title}</span>
                    <span className="mt-0.5 block text-[13px] text-ink2">{s.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {scale === null && <p className="mt-3 text-[13px] text-ink3">Loading…</p>}
          {!canMutate && <p className="mt-3 text-[12px] text-ink3">Your role can view but not change global settings.</p>}
        </Card>
      </div>
    </div>
  );
}

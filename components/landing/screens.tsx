/* The five live app states the landing story walks through. Pure HTML/CSS
   recreations of the real mobile screens (same UNDP palette, same 3-tier
   damage language) so each beat can animate — pins drop, sync fills, the AI
   confidence bar settles — instead of showing static screenshots. */

const TIER = { minimal: "#59ba47", partial: "#fbc412", complete: "#d12800" };

/* Shared stylized basemap: light street grid + building blocks, CSS only. */
function Basemap({ dim = false }: { dim?: boolean }) {
  return (
    <div aria-hidden className={`absolute inset-0 ${dim ? "opacity-50 grayscale" : ""}`} style={{ background: "#eef1f3" }}>
      {/* streets */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(0deg, transparent 47%, #fff 47%, #fff 53%, transparent 53%)," +
            "linear-gradient(90deg, transparent 30%, #fff 30%, #fff 35%, transparent 35%)," +
            "linear-gradient(90deg, transparent 68%, #fff 68%, #fff 72%, transparent 72%)," +
            "linear-gradient(32deg, transparent 76%, #fff 76%, #fff 79%, transparent 79%)",
        }}
      />
      {/* blocks */}
      {[
        ["8%", "8%", 52, 34], ["44%", "6%", 40, 30], ["78%", "10%", 34, 26],
        ["6%", "60%", 44, 38], ["42%", "62%", 56, 30], ["80%", "58%", 30, 40],
        ["10%", "34%", 36, 20], ["50%", "30%", 30, 22],
      ].map(([l, t, w, h], i) => (
        <div
          key={i}
          className="absolute rounded-[3px]"
          style={{ left: l as string, top: t as string, width: w as number, height: h as number, background: "#dde3e6" }}
        />
      ))}
      {/* park */}
      <div className="absolute rounded-[6px]" style={{ left: "62%", top: "36%", width: 60, height: 44, background: "#dcefd8" }} />
    </div>
  );
}

function Pin({ left, top, tier, delay }: { left: string; top: string; tier: keyof typeof TIER; delay: number }) {
  return (
    <span
      className="lp-drop absolute z-10 block h-3.5 w-3.5 rounded-full border-2 border-white"
      style={{ left, top, background: TIER[tier], animationDelay: `${delay}ms`, boxShadow: "0 1px 4px rgba(35,46,61,.3)" }}
    />
  );
}

function AppBar({ title, live }: { title: string; live?: boolean }) {
  return (
    <div className="relative z-20 flex items-center gap-2 border-b border-line bg-white px-4 py-2.5">
      <span className="grid h-6 w-6 place-items-center rounded-lg bg-primary text-white">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
          <circle cx="12" cy="12" r="2" /><path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19 5a10 10 0 0 1 0 14M5 19A10 10 0 0 1 5 5" />
        </svg>
      </span>
      <span className="text-[13px] font-bold text-ink">{title}</span>
      {live && (
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-complete-soft px-2 py-0.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="lp-ping absolute h-full w-full rounded-full bg-complete" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-complete" />
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wide text-complete">Live</span>
        </span>
      )}
    </div>
  );
}

/* 1 — Hero / live map with dropping pins. */
export function MapScreen() {
  return (
    <div className="absolute inset-0 flex flex-col">
      <AppBar title="Beacon" live />
      <div className="relative flex-1 overflow-hidden">
        <Basemap />
        <Pin left="22%" top="24%" tier="complete" delay={200} />
        <Pin left="38%" top="48%" tier="partial" delay={500} />
        <Pin left="61%" top="30%" tier="minimal" delay={800} />
        <Pin left="70%" top="62%" tier="partial" delay={1100} />
        <Pin left="30%" top="70%" tier="complete" delay={1400} />
        <Pin left="52%" top="16%" tier="minimal" delay={1700} />
        {/* cluster bubble */}
        <span className="lp-drop absolute left-[46%] top-[58%] z-10 grid h-7 w-7 place-items-center rounded-full bg-primary text-[10px] font-bold text-white ring-2 ring-white" style={{ animationDelay: "1900ms" }}>
          12
        </span>
        {/* crisis banner */}
        <div className="absolute inset-x-3 top-3 z-10 rounded-lg border border-line bg-white/95 px-3 py-2 shadow-sm">
          <div className="text-[11px] font-bold text-ink">Türkiye Earthquake — Antakya</div>
          <div className="font-mono text-[9px] text-ink2">EQ-2026-000012-TUR · started 14 h ago</div>
        </div>
      </div>
      <div className="relative z-10 border-t border-line bg-white px-4 py-3">
        <div className="rounded-lg bg-primary py-2.5 text-center text-[13px] font-bold text-white">Report damage</div>
      </div>
    </div>
  );
}

/* 2 — Capture: photo + on-device AI suggestion + 3-tier choice. */
export function CaptureScreen() {
  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      <AppBar title="New report · 1 of 3" />
      <div className="relative h-[212px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/landing/damage-street.jpg" alt="" className="h-full w-full object-cover" />
        <span className="absolute left-3 top-3 rounded-md bg-ink/70 px-2 py-0.5 font-mono text-[9px] text-white">EXIF stripped · faces blurred</span>
      </div>
      <div className="flex-1 space-y-3 px-4 py-3">
        <div className="rounded-lg border border-primary/30 bg-primary-soft/60 p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-primary-ink">On-device AI suggests: Partial damage</span>
            <span className="font-mono text-[10px] font-bold text-primary-ink">86%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white">
            <div className="lp-settle h-full rounded-full bg-primary" />
          </div>
          <div className="mt-1 text-[9px] text-ink2">Runs offline — no network needed</div>
        </div>
        <div className="space-y-1.5">
          {(
            [
              ["Minimal", "minimal", false],
              ["Partial", "partial", true],
              ["Complete", "complete", false],
            ] as const
          ).map(([label, tier, on]) => (
            <div
              key={tier}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${on ? "border-primary bg-primary-soft/50" : "border-line"}`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: TIER[tier] }} />
              <span className="text-[12px] font-semibold text-ink">{label} damage</span>
              {on && (
                <svg className="ml-auto text-primary" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                  <path d="M5 13l4 4 10-11" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-line px-4 py-3">
        <div className="rounded-lg bg-primary py-2.5 text-center text-[13px] font-bold text-white">Continue</div>
      </div>
    </div>
  );
}

/* 3 — Offline: banner, dimmed map from cache, durable queue. */
export function OfflineScreen() {
  return (
    <div className="absolute inset-0 flex flex-col">
      <AppBar title="Beacon" />
      <div className="bg-ink px-4 py-1.5 text-center text-[10px] font-semibold text-white">
        No connection — map served from the 18 MB offline pack
      </div>
      <div className="relative h-[200px] overflow-hidden">
        <Basemap dim />
        <span className="absolute left-[40%] top-[42%] z-10 block h-3.5 w-3.5 rounded-full border-2 border-white bg-primary" style={{ boxShadow: "0 1px 4px rgba(35,46,61,.3)" }} />
        <span className="absolute bottom-2 right-2 rounded-md bg-white/90 px-2 py-0.5 font-mono text-[9px] text-ink2">Plus Code 8G4P+Q2</span>
      </div>
      <div className="flex-1 space-y-2 bg-white px-4 py-3">
        <div className="text-[10px] font-bold uppercase tracking-wide text-ink3">Outbox — saved on this device</div>
        {[
          ["Partial damage · Kurtuluş Cd.", "2 photos"],
          ["Complete damage · Atatürk Blv.", "1 photo"],
          ["Minimal damage · Gazi Mah.", "1 photo"],
        ].map(([title, sub], i) => (
          <div key={i} className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2">
            <span className="lp-blink h-2 w-2 rounded-full bg-ink3" style={{ animationDelay: `${i * 300}ms` }} />
            <div className="min-w-0">
              <div className="truncate text-[11px] font-semibold text-ink">{title}</div>
              <div className="text-[9px] text-ink2">{sub} · queued, survives restart</div>
            </div>
            <span className="ml-auto rounded-full bg-surface2 px-2 py-0.5 text-[9px] font-bold text-ink2">Queued</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 4 — Reconnect: outbox flushes, server dedup merges a duplicate. */
export function SyncScreen() {
  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      <AppBar title="Beacon" live />
      <div className="bg-primary px-4 py-1.5 text-center text-[10px] font-semibold text-white">Back online — syncing outbox</div>
      <div className="px-4 pt-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-surface2">
          <div className="lp-fill h-full rounded-full bg-primary" />
        </div>
      </div>
      <div className="flex-1 space-y-2 px-4 py-3">
        {[
          ["Partial damage · Kurtuluş Cd.", "Synced", true],
          ["Complete damage · Atatürk Blv.", "Synced", true],
          ["Minimal damage · Gazi Mah.", "Duplicate — merged", false],
        ].map(([title, status, ok], i) => (
          <div key={i} className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2">
            {ok ? (
              <span className="grid h-4 w-4 place-items-center rounded-full" style={{ background: TIER.minimal }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" aria-hidden>
                  <path d="M5 13l4 4 10-11" />
                </svg>
              </span>
            ) : (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-white">2</span>
            )}
            <div className="min-w-0 truncate text-[11px] font-semibold text-ink">{title as string}</div>
            <span className={`ml-auto whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold ${ok ? "bg-ok-soft text-ink" : "bg-primary-soft text-primary-ink"}`}>
              {status as string}
            </span>
          </div>
        ))}
        <div className="rounded-lg border border-line bg-surface2/60 p-2.5 text-[10px] leading-relaxed text-ink2">
          Idempotent submits — retries can never double-count. A second report of the same building merges into one record, version 2.
        </div>
      </div>
    </div>
  );
}

/* 5 — Verification: community confirms, analyst verifies, trust grows. */
export function VerifyScreen() {
  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      <AppBar title="Your report" />
      <div className="relative h-[150px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/landing/damage-houses.jpg" alt="" className="h-full w-full object-cover" />
        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold text-white" style={{ background: TIER.partial }}>
          <span className="h-1.5 w-1.5 rounded-full bg-white" /> PARTIAL
        </span>
      </div>
      <div className="flex-1 space-y-0 px-4 py-3">
        {[
          ["Submitted", "09:41 — pinned to building fp-4af19c02", true, "0ms"],
          ["Confirmed by 2 nearby reporters", "agreement raises confidence", true, "400ms"],
          ["Verified by UNDP analyst", "visible on the public map", true, "800ms"],
        ].map(([title, sub, , delay], i) => (
          <div key={i} className="lp-drop relative flex gap-3 pb-4" style={{ animationDelay: delay as string }}>
            {i < 2 && <span className="absolute left-[7px] top-5 h-full w-px bg-line" />}
            <span className="relative z-10 mt-0.5 grid h-[15px] w-[15px] place-items-center rounded-full" style={{ background: TIER.minimal }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" aria-hidden>
                <path d="M5 13l4 4 10-11" />
              </svg>
            </span>
            <div>
              <div className="text-[11.5px] font-bold text-ink">{title}</div>
              <div className="text-[9.5px] text-ink2">{sub}</div>
            </div>
          </div>
        ))}
        <div className="rounded-lg border border-primary/30 bg-primary-soft/50 p-2.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-primary-ink">
            <span>Reporter trust</span>
            <span className="font-mono">+12 pts</span>
          </div>
          <div className="mt-1 text-[9px] leading-relaxed text-ink2">
            Anonymous device ID only — no account, no phone number. Verified history makes future reports rank higher.
          </div>
        </div>
      </div>
    </div>
  );
}

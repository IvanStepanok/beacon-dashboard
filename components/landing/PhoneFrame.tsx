/* Hardware-true device shell for the landing story: Night Ink bezel, punch-hole
   camera, status bar. The screen content is live HTML (the real app layouts
   rebuilt in CSS), so story beats can cross-fade between app states. */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative mx-auto w-[300px] sm:w-[330px]"
      style={{ filter: "drop-shadow(0 40px 80px rgba(0,110,181,0.25))" }}
    >
      <div className="rounded-[2.6rem] bg-ink p-[10px]">
        {/* inner rim highlight */}
        <div className="relative overflow-hidden rounded-[2rem] bg-white ring-1 ring-white/20">
          {/* status bar */}
          <div className="relative z-20 flex items-center justify-between bg-white px-5 pt-2.5 pb-1 text-[10px] font-semibold text-ink">
            <span className="font-mono">09:41</span>
            {/* punch-hole camera */}
            <span className="absolute left-1/2 top-2 h-[14px] w-[14px] -translate-x-1/2 rounded-full bg-ink" />
            <span className="flex items-center gap-1">
              <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden>
                <rect x="0" y="6" width="2.5" height="4" rx="0.6" fill="currentColor" />
                <rect x="3.8" y="4" width="2.5" height="6" rx="0.6" fill="currentColor" />
                <rect x="7.6" y="2" width="2.5" height="8" rx="0.6" fill="currentColor" opacity="0.35" />
                <rect x="11.4" y="0" width="2.5" height="10" rx="0.6" fill="currentColor" opacity="0.35" />
              </svg>
              <svg width="18" height="10" viewBox="0 0 18 10" aria-hidden>
                <rect x="0.5" y="0.5" width="14" height="9" rx="2" fill="none" stroke="currentColor" />
                <rect x="2" y="2" width="9" height="6" rx="1" fill="currentColor" />
                <rect x="15.5" y="3" width="2" height="4" rx="1" fill="currentColor" />
              </svg>
            </span>
          </div>
          {/* live screen area — 19.5:9-ish */}
          <div className="relative h-[560px] sm:h-[600px]">{children}</div>
          {/* gesture bar */}
          <div className="flex justify-center bg-white pb-2 pt-1.5">
            <div className="h-1 w-24 rounded-full bg-ink/20" />
          </div>
        </div>
      </div>
    </div>
  );
}

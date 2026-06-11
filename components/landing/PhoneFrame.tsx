/* Hardware-true device shell for the landing story. The screen is a real
   360×800dp Android stage (the app's actual logical resolution) scaled down
   with a CSS transform, so the screens inside can be built with the app's
   exact dp values and stay 1:1 with the Compose source. */
export function PhoneFrame({ children, scale = 0.8 }: { children: React.ReactNode; scale?: number }) {
  const w = Math.round(360 * scale);
  const h = Math.round(800 * scale);
  return (
    <div
      className="relative mx-auto w-fit"
      style={{ filter: "drop-shadow(0 40px 80px rgba(0,110,181,0.25))" }}
    >
      <div className="rounded-[2.8rem] bg-ink p-[10px]">
        <div
          className="relative overflow-hidden rounded-[2.2rem] bg-white ring-1 ring-white/20"
          style={{ width: w, height: h }}
        >
          {/* 360×800 dp stage — children are the real app screens at native dp */}
          <div
            className="absolute left-0 top-0"
            style={{
              width: 360,
              height: 800,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              fontFamily: "var(--font-phone), Roboto, system-ui, sans-serif",
            }}
          >
            {children}
          </div>
          {/* punch-hole camera + gesture handle (hardware chrome, above app UI) */}
          <span className="pointer-events-none absolute left-1/2 top-[9px] z-30 h-[12px] w-[12px] -translate-x-1/2 rounded-full bg-ink" />
          <span className="pointer-events-none absolute bottom-[7px] left-1/2 z-30 h-[4px] w-[96px] -translate-x-1/2 rounded-full bg-ink/30" />
        </div>
      </div>
    </div>
  );
}

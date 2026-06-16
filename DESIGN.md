# Design System: Beacon Landing — Crisis Mapping for UNDP

## 1. Visual theme and atmosphere
A confident, institutional-yet-modern page: the calm authority of a UN
field manual crossed with a live operations room. Density 4
(daily-app balanced, generous whitespace around dense, data-rich moments).
Variance 7 (asymmetric splits, offset rhythm, never centered hero blocks).
Motion 7 (scroll-driven choreography: the page IS the product demo, a sticky
phone on the right plays the app while the story scrolls on the left).
The mood is "first responders, not startup hype": grounded copy, real numbers,
zero marketing froth.

## 2. Color palette and roles (UNDP Design System primitives, non-negotiable)
- Paper White (#FFFFFF), primary canvas, phone screen surface
- Mist Gray (#F7F7F7), alternating section bands, card fills (UNDP gray-200)
- Structural Line (#D4D6D8), hairline borders, phone bezel details (gray-400)
- Field Gray (#55606E), secondary text, captions (gray-600)
- Night Ink (#232E3D), headlines, body text, dark footer band (UNDP gray-700; never #000)
- UNDP Blue (#006EB5), THE single accent: CTAs, links, active pins, progress (blue-600)
- Deep Blue (#1F5A95), hover/pressed states of the accent (blue-700)
- Sky Tint (#D7E9F9 / #B5D5F5), soft accent washes behind the phone, chips
- Status trio (used ONLY inside the phone mockup + data viz, never as page chrome):
  Relief Green (#59BA47), Caution Yellow (#FBC412, fill/dot only, never text),
  Alarm Red (#D12800)

Banned: purple/neon gradients, glows, any second accent hue, warm-gray drift.

## 3. Typography rules
- Display: Noto Sans 700/800 (UNDP body face; ProximaNova first in stack for
  licensed environments), track-tight (-0.02em), hierarchy via weight + Night Ink
  vs Field Gray, clamp() scale: hero 2.6–4.2rem, section heads 1.9–2.6rem
- Body: Noto Sans 400/500, 1.6 leading, 65ch max, Field Gray for support copy
- Mono: Noto Sans Mono, stats, coordinates, Plus Codes, timestamps, ALL numbers
  inside data moments (tabular-nums everywhere)
- The UNDP face is a brand requirement; the Inter ban is satisfied by never
  falling back to it. No serifs anywhere.

## 4. Component stylings
* Buttons: flat UNDP Blue fill, 0.375rem radius (institutional sharpness),
  white 600-weight label, hover to Deep Blue, active to translate-y 1px. Ghost
  secondary: 1px Structural Line border, Night Ink label. No glows, no gradients.
* Phone frame: the page's centerpiece, a hardware-true device shell (Night
  Ink bezel, 2.6rem outer radius, subtle inner rim highlight, punch-hole camera),
  its screen rendered in live HTML (real app layouts, not screenshots) so screens
  cross-fade/slide as the story scrolls. Shadow: long, soft, blue-tinted
  (0 40px 80px -20px rgba(0,110,181,.25)).
* Cards: used sparingly; 0.5rem radius, 1px Structural Line, Mist fill. Dense
  stat strips use border-left rules instead of boxes.
* Chips/stats: mono numerals, dot-pattern status (colored dot + ink text).
* Section progress: a thin UNDP Blue rail on the left text column marking the
  active story beat (replaces any "scroll down" filler, banned).

## 5. Layout principles
- Asymmetric split master grid: text column ~44% left, phone stage ~56% right;
  the phone is `position: sticky` (top 10vh) while 5 story beats scroll past.
- Max width 1400px centered; section bands alternate Paper/Mist full-bleed.
- Trust/stats band: 4 uneven columns (2-1-1 rhythm), not equal cards.
- Footer: Night Ink band with white text + UNDP Blue links.
- `min-h-[100dvh]` for full-height moments, never h-screen. CSS grid, no calc() hacks.
- No element overlap outside the phone stage; every block owns its zone.

## 6. Motion and interaction
- Scroll choreography via IntersectionObserver: each story beat activates a phone
  screen state; screens transition with 480ms cubic-bezier(.22,1,.36,1)
  slide+fade (transform/opacity only).
- Inside the phone: perpetual micro-loops, pulsing live-crisis dot, pins dropping
  with stagger, sync progress filling, AI confidence bar settling. Subtle,
  ≤3 concurrent.
- Reveal-on-scroll: text beats rise 16px + fade, 60ms stagger per child.
- Reduced motion: all loops pause, transitions become opacity-only.

## 7. Anti-patterns (banned)
- No emojis, no Inter, no pure #000, no neon/outer glows, no second accent
- No centered hero, no 3-equal-card rows, no "Scroll to explore"/chevrons
- No AI copy clichés ("seamless", "elevate", "unleash", "next-gen", "empower")
- No fake round numbers, use the real ones (502,064 reports benchmarked; 35MB
  peak export RSS; 6 UN languages; 3-tap report; 18MB offline pack)
- No stock-photo hero collage without purpose; imagery only where it carries the
  field-reality narrative, always with alt text
- No yellow (#FBC412) as text color, fill/dot only
- No broken external image links; assets served locally from /public

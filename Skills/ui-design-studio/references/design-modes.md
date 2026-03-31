# Design Modes — Detailed Reference

Read this file when you need deeper specifications for a particular design mode. Each section below contains the complete rules for that mode, sourced from the taste-skill library.

## Table of Contents
1. Ethereal Glass (SaaS/AI/Tech)
2. Editorial Luxury (Lifestyle/Real Estate)
3. Soft Structuralism (Consumer/Health)
4. Minimalist (Workspace/Productivity)
5. Brutalist (Creative/Agency)

---

## 1. Ethereal Glass

**When to use:** SaaS products, AI tools, developer platforms, tech landing pages.
**Reference aesthetic:** Linear, Vercel, Raycast, Arc Browser.

**Background:** OLED black `#050505` or `#0A0A0A`. Add 2–3 radial gradient blobs (`filter: blur(80px)`, `opacity: 0.15`) with slow drift animation (20s+) for ambient depth.

**Surfaces:** Cards use `bg-white/[0.04]` or `bg-white/[0.06]` with `backdrop-blur-2xl`. Borders: `ring-1 ring-white/[0.08]`. Inner highlight: `shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]`.

**Typography:** Geometric Grotesk — Geist, Outfit, Cabinet Grotesk. Headlines in white `#FAFAFA`, body in `#A3A3A3`. Tight tracking on headlines (`-0.02em` to `-0.04em`).

**Color:** Single cool accent (indigo `#6366F1`, sky `#0EA5E9`, or emerald `#10B981`). Background accent blobs use the accent at very low opacity.

**Components:**
- Cards: glass panels with blur + hairline white borders
- Buttons: `bg-white text-black rounded-full` (primary), ghost with white/10 border (secondary)
- Navigation: floating island pill with `backdrop-blur-xl`, `bg-white/5`, `rounded-full`
- Code blocks: `bg-black/40` with syntax highlighting in muted accent tones

**Motion:** High intensity. Mesh gradient animation, shimmer on CTAs, magnetic hover on buttons, staggered reveals with blur fade.

---

## 2. Editorial Luxury

**When to use:** Lifestyle brands, real estate, fashion, premium portfolio, food/wine.
**Reference aesthetic:** High-end magazine layouts, Monocle, Cereal Magazine.

**Background:** Warm creams — `#FDFBF7`, `#FAF8F5`, `#F5F0EB`. Subtle CSS noise overlay at `opacity: 0.03` using SVG `feTurbulence` filter for paper texture.

**Surfaces:** Cards with `bg-white` and `ring-1 ring-black/[0.04]`. Shadows: warm-tinted `rgba(120,100,80,0.06)`. Generous padding (`p-8` to `p-12`).

**Typography:** Variable serif for headlines — `Instrument Serif`, `Newsreader`, `Playfair Display`. Tight tracking (`-0.02em`). Sans-serif for body — `Plus Jakarta Sans`, `Satoshi`. Large type-to-body contrast ratio.

**Color:** Earth tones — sage `#A3B18A`, espresso `#3C2A21`, terracotta `#C4775A`, cream. Single warm accent.

**Layout:** Editorial splits (large image + text), full-bleed photography with text overlays at low opacity, asymmetric magazine grids, generous whitespace (`py-40`+).

**Components:**
- Image containers: `aspect-[4/5]` or `aspect-[3/4]` with warm filter overlay
- Buttons: text links with underline animation, minimal shapes
- Tags: delicate text, no backgrounds, just color differentiation
- Dividers: thin rules with generous surrounding space

**Motion:** Restrained but elegant. Slow fade-in reveals (1000ms+), parallax on images, no flashy effects. Movement should feel like turning a magazine page.

---

## 3. Soft Structuralism

**When to use:** Consumer apps, health/wellness, creative portfolios, product showcases.
**Reference aesthetic:** Apple product pages, Notion marketing, Stripe.

**Background:** Silver-grey `#F9FAFB` or pure soft white. Clean, bright.

**Surfaces:** Pure white cards with diffusion shadow: `shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]`. All containers: `rounded-[2.5rem]` — the oversized radius is the signature. Inner padding: `p-8` to `p-10`.

**Typography:** Bold Grotesk — Geist, Satoshi, Cabinet Grotesk with `tracking-tight` on headers. Clean, confident, friendly. Labels placed outside/below cards for gallery-style presentation.

**Color:** Neutral base with single bright accent. Blue `#3B82F6`, violet `#8B5CF6`, or green `#22C55E`. Accent used sparingly — active states, CTAs, single decorative element.

**Layout:** Gallery-like bento grids with generous gaps. Each card is its own "exhibit." Lots of breathing room. Think museum wall spacing.

**Components:**
- Cards: Self-contained exhibits with perpetual micro-animation inside each
- The "5-Card Bento" archetype:
  1. **Intelligent List** — Auto-sorting items with `layoutId` animation
  2. **Command Input** — Typewriter effect with processing state
  3. **Live Status** — Breathing indicators with pop-up notifications
  4. **Wide Data Stream** — Seamless infinite carousel
  5. **Contextual UI** — Staggered highlights with floating toolbars

**Motion:** Spring physics default (`stiffness: 100, damping: 20`). Every card contains at least one perpetual micro-animation. Wrap dynamic lists in `AnimatePresence`-style logic. Layout transitions should feel weighty and physical.

---

## 4. Minimalist

**When to use:** Workspace tools, productivity apps, SaaS dashboards, documentation sites.
**Reference aesthetic:** Notion, Linear, Craft, Things 3.

**Background:** Warm canvas `#F7F6F3` or `#FBFBFA`. Cards: `#FFFFFF` or `#F9F9F8`.

**Surfaces:** Ultra-flat. Cards have exactly `border: 1px solid #EAEAEA`. Border-radius: `8px` or `12px` maximum (crisp, not bubbly). No drop shadows except ultra-diffuse `rgba(0,0,0,0.04)`. No gradients, no glassmorphism beyond subtle navbar blur.

**Typography:**
- Sans body/UI: `'SF Pro Display', 'Geist Sans', 'Switzer', sans-serif`
- Serif headings: `'Lyon Text', 'Newsreader', 'Instrument Serif', serif` with tight tracking
- Mono for code/meta: `'Geist Mono', 'SF Mono', 'JetBrains Mono', monospace`
- Body text: off-black `#2F3437` with `line-height: 1.6`. Secondary: `#787774`

**Color:** Warm monochrome + sparse desaturated pastels for tags only:
- Pale Red: `#FDEBEC` (text: `#9F2F2D`)
- Pale Blue: `#E1F3FE` (text: `#1F6C9F`)
- Pale Green: `#EDF3EC` (text: `#346538`)
- Pale Yellow: `#FBF3DB` (text: `#956400`)

**Components:**
- Buttons: solid `#111111` bg, `#FFFFFF` text, `4px` radius, no shadow. Hover: `#333333` or `scale(0.98)` active.
- Tags: pill `rounded-full`, `text-xs uppercase tracking-[0.05em]`, pastel backgrounds
- Accordions: no container boxes, just `border-bottom: 1px solid #EAEAEA`, `+`/`-` toggle
- Keyboard shortcuts: `<kbd>` tags with `border: 1px solid #EAEAEA`, `bg-[#F7F6F3]`, monospace
- OS Chrome: mock window with white top bar + three gray circles

**Icons:** Phosphor Bold/Fill or Radix UI Icons. Standardized stroke width. Never Lucide/Feather/Heroicons.

**Motion:** Invisible. Present but never noticed. `translateY(12px) opacity-0` → resolve over `600ms` with `cubic-bezier(0.16, 1, 0.3, 1)`. Cards hover with ultra-subtle shadow (`0 2px 8px rgba(0,0,0,0.04)`). Optional single ambient blob (`opacity: 0.02–0.04`, `20s+`).

---

## 5. Brutalist

**When to use:** Creative agencies, experimental portfolios, tech art, editorial with attitude.
**Reference aesthetic:** Bloomberg terminal, Wired magazine, Swiss poster design.

**Critical rule:** Pick ONE sub-mode and commit. Never mix them in the same interface.

### Sub-mode A: Swiss Industrial Print (Light)
- Background: `#F4F4F0` or `#EAE8E3` (matte unbleached paper)
- Foreground: `#050505` to `#111111` (carbon ink)
- Accent: `#E61919` (Aviation Red) — the ONLY accent, used for rules, strikes, highlights
- Optional terminal green `#4AF626` for a single data readout

### Sub-mode B: Tactical Telemetry / CRT Terminal (Dark)
- Background: `#0A0A0A` or `#121212` (dead CRT)
- Foreground: `#EAEAEA` (white phosphor)
- Same Aviation Red accent
- Phosphor glow, scanlines, low bit-depth rendering

**Typography:**
- Macro (headers): Neue Haas Grotesk Black, Archivo Black, Monument Extended. Scale: `clamp(4rem, 10vw, 15rem)`. Tracking: `-0.03em` to `-0.06em`. Leading: `0.85`. ALL UPPERCASE.
- Micro (data): JetBrains Mono, IBM Plex Mono, Space Mono. Size: `10px`–`14px`. Tracking: `+0.05em` to `+0.1em`. ALL UPPERCASE.
- Rare serif accent: Playfair Display with halftone post-processing

**Layout:** Strict CSS Grid. Visible `1px` or `2px solid` borders compartmentalizing all zones. `display: grid; gap: 1px` with contrasting parent/child backgrounds for razor-thin dividing lines. Zero border-radius anywhere — all 90° corners.

**Components:**
- ASCII framing: `[ SECTION ]`, `< RE-IND >`, `>>>`, `///`
- Industrial markers: `®`, `©`, `™` as geometric elements
- Technical metadata: `REV 2.6`, `UNIT / D-01`, randomized alphanumeric strings
- Crosshairs `+` at grid intersections

**Textures:**
- Halftone: SVG radial dot pattern overlay with `mix-blend-mode: multiply`
- CRT Scanlines: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)`
- Mechanical noise: global low-opacity SVG static filter on DOM root

**Banned in Brutalist:** Gradients, soft drop shadows, translucency, `border-radius`, curved anything, soft colors.

---
name: ui-design-studio
description: "Premium UI design, animation, and frontend engineering skill based on the taste-skill library. Produces agency-quality ($150k+) React and HTML interfaces with cinematic motion, haptic depth, and anti-generic design. Use this skill ANY time a user asks to: build/design/create/prototype any UI or frontend (landing pages, dashboards, web apps, components, portfolios, pricing pages, hero sections); add or improve animations, micro-interactions, scroll effects, hover effects, or motion design; redesign or upgrade existing UI code to look more premium; create any React component or HTML page that needs to look professional rather than generic. Also triggers on phrases like 'make it look good', 'modern design', 'premium UI', 'glassmorphism', 'bento grid', 'dark mode landing page', 'animate this', 'add hover effects', 'scroll animations', or even just 'build me a page'. If the output involves visual frontend code, use this skill."
---

# UI Design Studio

A premium frontend engineering skill that fuses the [taste-skill](https://github.com/Leonxlnx/taste-skill) library's design philosophy with cinematic animation patterns. Every output should feel like a $150k agency build — the kind of work you'd see from Linear, Vercel, Stripe, or Apple.

Generic AI-generated UI is immediately recognizable: centered layouts, Inter font, harsh shadows, rainbow gradients, "John Doe" placeholders. This skill exists to break out of that uncanny valley.

## Configuration Dials

Three globally tunable parameters (1–10). Apply these defaults unless the user specifies otherwise:

| Dial | Default | Controls |
|------|---------|----------|
| DESIGN_VARIANCE | 8 | Layout experimentation. 1–3: symmetric grids. 4–7: offset margins, overlapping. 8–10: masonry, CSS Grid fractional units, massive empty zones |
| MOTION_INTENSITY | 7 | Animation richness. 1–3: hover/active only. 4–7: CSS transitions + cubic-bezier. 8–10: scroll-triggered reveals, spring physics, perpetual loops |
| VISUAL_DENSITY | 4 | Content per screen. 1–3: art-gallery airy. 4–7: standard app. 8–10: cockpit-dense with monospace numbers |

## Design Modes

Select ONE mode per project based on the user's request. Each mode has detailed rules in `references/design-modes.md`.

### Ethereal Glass (Default for SaaS / AI / Tech)
OLED black (#050505), radial gradient blobs, `backdrop-blur-2xl`, `white/10` hairline borders, geometric Grotesk typography. The "Linear / Vercel" aesthetic.

### Editorial Luxury (Lifestyle / Real Estate / Portfolio)
Warm creams (#FDFBF7), sage and espresso tones, variable serif headlines (`Instrument Serif`, `Newsreader`), CSS noise overlay at `opacity-[0.03]`. The "magazine spread" aesthetic.

### Soft Structuralism (Consumer / Health / Portfolio)
Silver-grey backgrounds, bold Grotesk, diffused ambient shadows (`shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]`). All containers `rounded-[2.5rem]`. The "Apple product page" aesthetic.

### Premium Minimalist (Workspace / Productivity / SaaS)
Warm monochrome (#F7F6F3 canvas), ultra-flat cards with `1px solid #EAEAEA`, bento grids, desaturated pastel accents, serif editorial headings. The "Notion / Linear" aesthetic. Read `references/design-modes.md` §Minimalist for full rules.

### Industrial Brutalist (Creative / Agency / Portfolio)
Swiss industrial print OR tactical CRT terminal. Extreme type scale contrast, rigid visible grids with `gap: 1px`, ASCII framing (`[ SECTION ]`), 90° corners only (no border-radius), halftone/scanline textures. Red as sole accent. Read `references/design-modes.md` §Brutalist for full rules.

## Output Format

Choose based on complexity — the user asked for "whichever is best for the project":
- **React JSX** (.jsx) for interactive components, dashboards, anything with state/animations. Single-file with default export. Use Tailwind CSS classes.
- **HTML** (.html) for landing pages, marketing sites. Single file with Tailwind CDN + vanilla JS animations.

If the environment supports React (Claude artifact preview does), prefer React. Available imports: `react`, `lucide-react`, `recharts`, `d3`, `three`, `lodash`.

For animations: use CSS `@keyframes` + JS (`IntersectionObserver`, `requestAnimationFrame`, `mousemove` listeners). Implement spring physics with JS, not library imports. Use Tailwind's `transition-*` and `animate-*` utilities.

**Completeness rule** (from output-skill): Treat every task as production-critical. A partial output is a broken output. Never use `// ...`, `// rest of code`, or `// implement here`. Deliver complete, runnable files. If hitting token limits, pause at a clean breakpoint with `[PAUSED — X of Y complete. Send "continue" to resume]`.

## 1. Typography

Typography is the primary infrastructure that separates premium from generic. These rules apply across all modes (each mode may override font choices).

**Font stacks:**
- Sans headlines: `'Geist', 'Outfit', 'Cabinet Grotesk', 'Plus Jakarta Sans', system-ui`
- Sans body: `'Geist', 'Satoshi', 'Plus Jakarta Sans', system-ui`
- Mono/data: `'Geist Mono', 'JetBrains Mono', 'SF Mono', monospace`
- Serif accent: `'Instrument Serif', 'Newsreader', 'Playfair Display', Georgia, serif`

Include Google Fonts CDN links in HTML outputs. In React, define font-face in a `<style>` tag or use system fallbacks.

**Scale and spacing:**
- Hero: `text-5xl md:text-7xl tracking-tighter leading-[0.9]` — tight tracking is what makes large type feel premium
- Section headings: `text-3xl md:text-5xl tracking-tight`
- Body: `text-base md:text-lg leading-relaxed max-w-[65ch]` — constrained width for readability
- Eyebrow: `text-[11px] uppercase tracking-[0.15em] font-medium`
- Data/numbers: Use monospace with `font-variant-numeric: tabular-nums`

**Text color:** Never pure black `#000000`. Use off-black: `#171717` (headlines), `#525252` (body), `#A3A3A3` (muted). In dark mode: `#EAEAEA` (primary), `#A3A3A3` (secondary).

**Banned fonts:** Inter, Roboto, Arial, Open Sans, Helvetica as primary. These scream "default AI output." The one exception: Brutalist mode allows Inter Extra Bold/Black for macro-typography.

## 2. Color

Maximum ONE accent color. Saturation below 80%. This constraint forces intentionality.

**Light mode base:** Warm neutrals — `#FAFAF9`, `#F5F5F4` (never pure `#FFFFFF` for large backgrounds)
**Dark mode base:** `#050505` or `#0A0A0A` (never pure `#000000`)
**Accent options:** `#6366F1` (indigo), `#0EA5E9` (sky), `#10B981` (emerald), `#F59E0B` (amber), `#E61919` (aviation red for brutalist)

**Banned:** neon outer glows, rainbow gradients, the "AI purple-blue" aesthetic (`#7C3AED` + `#3B82F6`), oversaturated accents, gradient text on large headers, warm/cool gray mixing within same project.

Tint shadows to background hue (e.g., `rgba(0,0,0,0.04)` on light, `rgba(255,255,255,0.05)` on dark) — never generic black shadows.

## 3. Layout

**Core principle:** Break the center bias. When DESIGN_VARIANCE > 4, centered hero sections are banned. Force split-screen, asymmetric, or left-aligned layouts.

**Archetypes** (rotate between these, never repeat):
1. **Asymmetric Bento Grid** — CSS Grid with mixed `span` sizes, varying heights. Collapse to single-column mobile.
2. **Z-Axis Cascade** — Overlapping cards via `translate` + `z-index`. Subtle rotation (`-1deg`/`2deg`). Stack on mobile.
3. **Editorial Split** — Large type/image left, scrolling content right. Full-width stack on mobile.
4. **Negative Space Theater** — `py-32` to `py-48` between sections. Content feels precious.
5. **Masonry Flow** — CSS columns/grid for organic content.

**Spacing:** Section gaps minimum `py-24` (prefer `py-32`). Card padding `p-6` to `p-8`. Max-width: `max-w-7xl mx-auto`. Mobile: `w-full px-4 min-h-[100dvh]` (never `h-screen`).

**Banned layouts:** Three equal columns with identical cards. Generic Bootstrap grids. Sticky top navbars without visual refinement. The "3-card feature row."

## 4. The Double-Bezel Technique

The signature pattern that makes UIs feel physical. Every major card/container uses nested layers:

```
Outer Shell (bg-neutral-100/50, ring-1 ring-black/[0.04], rounded-[2rem], p-1.5)
  └─ Inner Core (bg-white, rounded-[1.75rem], shadow-sm, p-6)
       └─ Content
```

The subtle gap creates a physical "bezel" — like an iPhone's edge. Apply to: hero cards, feature cards, pricing tables, testimonials, image containers, CTA blocks.

**Button architecture:**
- Primary: `rounded-full px-6 py-3 bg-neutral-900 text-white` + trailing icon in circular `w-8 h-8 rounded-full` wrapper
- Hover: `active:scale-[0.98]`, icon shifts `translate-x-0.5`
- Eyebrow tags: `rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.15em] bg-accent/10 text-accent`

## 5. Animation & Motion Engine

Animation is the soul of premium UI. This is a first-class capability — whenever a user asks for animations, hover effects, scroll effects, or any motion work, apply these patterns aggressively.

**Golden rule:** Animate only `transform` and `opacity`. Never `top`, `left`, `width`, `height`. Apply `backdrop-blur` only to fixed/sticky elements. Grain/noise on fixed pseudo-elements with `pointer-events: none`.

### Scroll Entry (required on every output)
Every content block animates in via `IntersectionObserver` (never `window.addEventListener('scroll')`).
- Base: `translateY(24px) opacity-0 blur(4px)` → `translateY(0) opacity-1 blur(0)` over `700ms`
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` — the premium deceleration curve
- Stagger children: `delay: index * 100ms`

### Custom Easing (no defaults allowed)
- **Smooth decelerate:** `cubic-bezier(0.16, 1, 0.3, 1)` — the workhorse for reveals and page transitions
- **Elastic settle:** `cubic-bezier(0.34, 1.56, 0.64, 1)` — playful bounces for toggle states
- **Quick snap:** `cubic-bezier(0.22, 0.61, 0.36, 1)` — instant-feeling UI state changes

Default `ease-in-out` and `linear` are banned. They feel robotic because real objects don't move that way.

### Perpetual Micro-Animations (at least one per output)
Components that feel alive when idle. Use CSS `@keyframes infinite`:
- **Shimmer sweep** — gradient moving across buttons/CTAs
- **Breathing pulse** — `scale(1)→scale(1.02)` on status indicators
- **Float drift** — slow `translateY(-4px)→translateY(4px)` on decorative elements
- **Gradient mesh** — ambient blobs drifting behind hero (`filter: blur(80px)`, `opacity: 0.15`, `animation: 20s`)
- **Border beam** — conic-gradient rotating around element's border
- **Typing cursor** — blink on input-like elements

### Hover Interactions (required on all interactive elements)
- Cards: lift `hover:-translate-y-1 hover:shadow-lg` + optional 3D tilt via JS `mousemove`
- Buttons: `active:scale-[0.97]` + icon shift + optional magnetic follow
- Links: underline wipe (width 0→100%)
- Images: `hover:scale-105` with `overflow-hidden` container
- Nav: sliding background pill behind active item

### Advanced Recipes (MOTION_INTENSITY 7+)
- Magnetic hover (element follows cursor slightly)
- Parallax depth layers (different scroll speeds)
- Marquee/ticker (infinite horizontal scroll, duplicated content for seamless loop)
- Card 3D tilt (`perspective(800px) rotateX/Y` on mousemove)
- Blur fade entry (blur resolves alongside opacity)
- Staggered grid cascade

> For complete code implementations of all patterns, read `references/animation-patterns.md`

## 6. Redesign Mode

When the user asks to improve or redesign existing code, follow the audit-then-fix approach from the taste-skill redesign system. Read `references/redesign-checklist.md` for the complete audit checklist covering typography, color, layout, interactivity, content, and code quality. Fix priority: fonts first (highest impact, lowest risk), then colors, then hover states, then layout, then components, then polish.

## 7. Creative Arsenal

For inspiration on specific component types, read `references/creative-arsenal.md`. It contains patterns for: navigation (dock magnification, dynamic island, floating island), layout (bento, masonry, chroma grids), cards (parallax tilt, spotlight borders, holographic foil), scroll effects (sticky stacks, horizontal hijacking, zoom parallax), galleries (coverflow, hover trails, dome galleries), typography (kinetic marquees, text mask reveals, scramble effects), and micro-interactions (particle explosions, ripple clicks, animated SVG drawing).

## 8. Forbidden Patterns (The "AI Tell" List)

These instantly mark output as AI-generated. Eliminate them all:

**Fonts:** Inter, Roboto, Arial, Open Sans, Helvetica (as primary). Serif in dashboards. Oversized headlines without tight tracking.
**Colors:** Pure #000/#FFF in large areas. Neon glows. Oversaturated accents. AI purple-blue gradient. Warm/cool gray mixing.
**Layout:** 3 equal identical columns. All-centered. Sticky navbar without refinement. Flexbox percentage hacks (use Grid).
**Content:** "John Doe", "Jane Smith", "Acme Corp", "Lorem Ipsum". Egg avatars. Numbers like 99.99%/$9.99. "Elevate", "Seamless", "Unleash", "Next-Gen", "Delve", "Game-changer". Emojis in UI text. Broken Unsplash links.
**Motion:** `ease-in-out`, `linear`, instant state changes. `window.addEventListener('scroll')`.
**Code:** `h-screen` (use `min-h-[100dvh]`). Default shadcn without customization. `// ...` placeholder comments.
**Images:** Use `picsum.photos/seed/{context}/{w}/{h}` or SVG illustrations. Never Unsplash hotlinks.
**Icons:** Use Lucide with `strokeWidth={1.5}` (refined feel). Or Phosphor Light, Radix Icons. Never thick-stroked defaults.

## 9. Mobile-First Responsive Protocol

- Start mobile, enhance upward
- Touch targets: min 44×44px
- Stack all multi-column below `md:` (768px)
- Navigation: hamburger → full-screen modal with staggered reveals on mobile
- Images: `aspect-ratio` + `object-cover`, never fixed dimensions
- Typography: use `clamp()` for fluid scaling
- Always: `min-h-[100dvh]`, `px-4`, `max-w-7xl mx-auto`

## 10. Execution Protocol

1. **Determine mode** — Match user's request to a Design Mode (§Design Modes). Default to Ethereal Glass for tech, Editorial Luxury for lifestyle, Soft Structuralism for consumer.
2. **Select layout** — Pick a Layout Archetype. Avoid repeating combinations.
3. **Scaffold** — Establish background texture, whitespace scale, typography hierarchy, single accent color.
4. **Build with Double-Bezel** — Nested containers on all major elements.
5. **Choreograph motion** — Scroll reveals on all blocks. Hover states on all interactive elements. At least one perpetual animation. Custom cubic-bezier curves. Read `references/animation-patterns.md` for code recipes.
6. **Polish** — Eyebrow tags, trailing icons, refined borders (`ring-1 ring-black/[0.04]`), grain overlay if appropriate.
7. **Verify against checklist** below.

## Pre-Output Checklist

- [ ] No banned fonts, colors, layout patterns, or content
- [ ] Design mode consciously selected (not defaulting to centered generic)
- [ ] Double-bezel nested architecture on major cards
- [ ] Custom easing curves (no linear/ease-in-out)
- [ ] Scroll entry animations on all content blocks
- [ ] Hover states on all interactive elements
- [ ] At least one perpetual micro-animation
- [ ] Mobile collapse works (375px mental test)
- [ ] Only `transform`/`opacity` animated (GPU-safe)
- [ ] `backdrop-blur` only on fixed/sticky elements
- [ ] Realistic content — no generic names, no placeholder data
- [ ] Code is complete and runnable — no placeholder comments
- [ ] Overall impression: "This looks expensive"

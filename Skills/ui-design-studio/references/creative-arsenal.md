# Creative Arsenal — Component & Pattern Library

A catalog of premium component patterns to reach for when building interfaces. These are organized by category. Each entry is a concept — implement with the techniques described in the main skill and `animation-patterns.md`.

## Navigation & Menus
- **Mac OS Dock Magnification** — Icons scale up when cursor approaches, neighbors scale proportionally
- **Magnetic Buttons** — Element follows cursor within bounds via `mousemove` + `transform`
- **Gooey Menu** — SVG filter menu that blobs/morphs between states
- **Dynamic Island** — Floating pill that morphs to show notifications/status
- **Contextual Radial Menu** — Right-click reveals circular option layout
- **Floating Speed Dial** — FAB that expands into staggered action buttons
- **Mega Menu Reveal** — Full-width dropdown with staggered content cascade
- **Floating Island Nav** — Pill nav that expands to full-screen overlay with `backdrop-blur-3xl`

## Layout & Grids
- **Bento Grid** — Asymmetric CSS Grid with mixed-size cells. The signature modern layout
- **Masonry Layout** — CSS columns or grid with organic flow
- **Chroma Grid** — Color-coordinated grid where each cell has its own tinted background
- **Split-Screen Scroll** — Two columns scrolling in opposite directions
- **Curtain Reveal** — Content reveals as a "curtain" slides away on scroll
- **Accordion Sections** — Full-width sections that expand/collapse vertically with smooth height animation

## Cards & Containers
- **Parallax Tilt Card** — `perspective(800px)` + `rotateX/Y` on mousemove. 3D depth effect
- **Spotlight Border** — Gradient border that illuminates where cursor hovers
- **Glassmorphism Panel** — `backdrop-blur-xl` + `bg-white/5` + `ring-1 ring-white/10` + inner shadow
- **Holographic Foil** — Rainbow gradient shimmer on tilt, like a trading card
- **Swipe Stack** — Tinder-style card stack with drag-to-dismiss
- **Morphing Modal** — Card expands into full-screen modal with shared element transition

## Scroll Animations
- **Sticky Scroll Stack** — Cards stack on top of each other as you scroll, each slightly scaled down
- **Horizontal Scroll Hijack** — Vertical scroll triggers horizontal movement of a content strip
- **Locomotive Scroll** — Smooth, lerped scrolling with parallax layers at different speeds
- **Zoom Parallax** — Background zooms as foreground content scrolls over it
- **Scroll Progress Path** — SVG path draws/fills as user scrolls down the page
- **Liquid Swipe Transition** — Blob-shaped clip-path transitions between sections

## Galleries & Media
- **Dome Gallery** — Curved arrangement of images, like looking at photos on a curved screen
- **Coverflow Carousel** — 3D perspective carousel with focused center item
- **Drag-to-Pan Grid** — Infinite canvas of images you can drag around
- **Accordion Slider** — Narrow strips expand on hover to reveal full images
- **Hover Image Trail** — Images appear and trail behind cursor as it moves across a link
- **Glitch Effect** — RGB channel split + noise on images for editorial attitude

## Typography Effects
- **Kinetic Marquee** — Infinite horizontal text scroll with alternating fill/outline
- **Text Mask Reveal** — Large text acts as a mask revealing an image/video behind it
- **Text Scramble** — Characters scramble randomly before settling into final text
- **Circular Text Path** — Text follows a circular SVG path, optionally rotating
- **Gradient Stroke Animation** — Text outline with animated gradient stroke
- **Kinetic Typography Grid** — Grid of words that animate independently on scroll
- **Split Text Reveal** — Each character or word animates in separately with stagger

## Micro-Interactions
- **Particle Explosion** — Click spawns particles that burst outward and fade
- **Liquid Pull-to-Refresh** — Elastic stretching animation on pull gesture
- **Skeleton Shimmer** — Loading placeholder with moving gradient highlight
- **Directional Hover-Aware Button** — Overlay enters from the direction the cursor approached
- **Ripple Click** — Material-style ripple expanding from click point
- **Animated SVG Line Drawing** — SVG strokes draw themselves via `stroke-dashoffset` animation
- **Mesh Gradient Background** — Multiple blurred color blobs slowly drifting
- **Lens Blur Depth** — Focus effect where background blurs more as you hover foreground elements

## Status & Data Patterns
- **Breathing Indicator** — Pulsing dot/ring for "live" or "online" status
- **Count-Up Animation** — Numbers animate from 0 to target value on scroll reveal
- **Sparkline Micro-Charts** — Tiny inline line charts next to numbers
- **Progress Ring** — SVG circle that fills based on percentage
- **Toast Notifications** — Slide-in alerts that auto-dismiss with progress bar

## Form & Input Patterns
- **Floating Label Input** — Label floats up as input receives focus (subtle, not Material Design heavy)
- **Inline Validation** — Green checkmark/red X appears inline as user types
- **Multi-Step Form** — Steps with smooth horizontal slide transitions between stages
- **Search with Spotlight** — Cmd+K modal with results appearing as user types

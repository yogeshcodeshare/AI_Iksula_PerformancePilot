# Redesign Audit Checklist

When upgrading existing UI code, follow this systematic audit-then-fix approach. Scan the codebase first to identify framework and styling approach, then work through this checklist.

## Fix Priority (do in this order — highest impact first)

### 1. Font Swap (immediate, low risk)
- Replace Inter/Roboto/Arial with Geist, Outfit, Cabinet Grotesk, or Satoshi
- Enlarge display text, reduce letter-spacing and line-height for headlines
- Constrain paragraphs to ~65 characters, increase body line-height
- Expand weight palette beyond 400/700 to include 500/600
- Use monospace + `tabular-nums` for numerical data
- Negative tracking on large headers, positive on labels
- Fix orphaned words with `text-wrap: balance`

### 2. Color Cleanup
- Replace pure `#000000` with off-black (`#0A0A0A`, `#121212`, dark navy)
- Desaturate accents below 80% saturation
- Limit to ONE accent color, remove redundant hues
- Pick one gray family (warm OR cool, not mixed)
- Kill the purple/blue AI gradient
- Tint shadows to background hue
- Add subtle noise/grain to flat backgrounds
- Replace linear gradients with radial or mesh variants

### 3. Hover & Active States
- Add hover: background shift, scale, or translate on cards
- Press feedback: `scale(0.98)` or `translateY(1px)` on active
- Smooth transitions (200–300ms) on all interactive elements
- Visible keyboard focus indicators for accessibility
- Replace dead `#` links with real destinations or visual disabling
- Style active nav links distinctly

### 4. Layout & Spacing
- Break symmetry: offset margins, mixed aspect ratios, asymmetric alignment
- Replace 3 equal-width card columns with zigzag, asymmetric grid, or masonry
- `min-height: 100dvh` instead of `height: 100vh`
- CSS Grid instead of flexbox percentage hacks
- Container max-width (1200–1440px) with auto margins
- Double the spacing — prefer breathing room
- Pin card buttons to bottom for horizontal CTA alignment
- Vary border-radius: tighter inner, softer outer

### 5. Component Replacement
- Replace generic spinners with skeleton loaders matching layout shapes
- Design composed "getting started" empty states
- Add inline error messages (never `window.alert()`)
- Replace pill badges with square/flag/plain text alternatives
- Use inline editing instead of modals where possible
- Replace 3-card testimonial carousels with masonry or rotating quotes

### 6. Content Polish
- Replace "John Doe", "Acme Corp" with diverse realistic names
- Use organic numbers (`47.2%`, not `99.99%`)
- Remove "Elevate", "Seamless", "Unleash", "Game-changer"
- Active voice, sentence case, no exclamation marks in success messages
- Real copy instead of Lorem Ipsum
- Unique avatars per person

### 7. Code Quality
- Semantic HTML: `<nav>`, `<main>`, `<article>`, `<section>`
- Replace hardcoded pixels with relative units
- Descriptive alt text on all images
- Clean z-index scale in theme variables
- Add `<title>`, `description`, `og:image` meta tags
- Privacy/terms footer links, skip-to-content links

## Upgrade Techniques (for extra premium polish)

**Typography:** Animate variable font weight on hover. Text outline→fill transitions. Large type as image masks.
**Layout:** Deliberate overlapping/off-screen bleeding. Aggressive negative space. Parallax section stacking.
**Motion:** Replace linear easing with spring physics. Staggered cascade reveals. Scroll-tied content reveals.
**Surfaces:** Glass with inner borders + inner shadows. Dynamic spotlight borders following cursor. Fixed noise overlays. Hue-matched colored shadows.

## Rules
- Maintain existing tech stack — no framework migrations
- Preserve all existing functionality
- Check dependency files before importing new libraries
- Verify Tailwind version (v3 vs v4) before config changes
- Keep changes focused and reviewable

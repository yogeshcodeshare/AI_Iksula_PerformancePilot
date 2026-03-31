# Animation Pattern Library

Deep-dive recipes for every animation pattern referenced in the main skill. Read this file when building components that need specific animation implementations.

## Table of Contents
1. Scroll Reveal System
2. Border Beam Effect
3. Shimmer / Shine Effects
4. Marquee / Infinite Ticker
5. Blur Fade Entry
6. Magnetic Hover
7. Parallax Depth Layers
8. Staggered Grid Cascade
9. Typing / Typewriter Effect
10. Floating Island Navigation
11. Gradient Mesh Background
12. Card Tilt / 3D Hover

---

## 1. Scroll Reveal System

The foundational animation — every content block should use this.

```jsx
// Reusable hook
function useScrollReveal(options = {}) {
  const { threshold = 0.1, rootMargin = '0px 0px -60px 0px' } = options;
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(el); } },
      { threshold, rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

// Usage component
function RevealOnScroll({ children, delay = 0, className = '' }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
        opacity: isVisible ? 1 : 0,
        filter: isVisible ? 'blur(0px)' : 'blur(4px)',
      }}
    >
      {children}
    </div>
  );
}
```

**Staggered children pattern:**
Wrap each child with incrementing delay: `delay={index * 120}`.

---

## 2. Border Beam Effect

An animated gradient that travels along an element's border, like Magic UI's border-beam.

```css
.border-beam {
  position: relative;
  overflow: hidden;
  border-radius: 1rem;
}
.border-beam::before {
  content: '';
  position: absolute;
  inset: 0;
  padding: 1.5px;
  border-radius: inherit;
  background: conic-gradient(from var(--angle, 0deg), transparent 60%, var(--accent, #6366f1) 80%, transparent 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: border-beam-rotate 3s linear infinite;
}
@keyframes border-beam-rotate {
  to { --angle: 360deg; }
}
/* Note: CSS @property needed for --angle animation */
```

**React implementation** (using JS rotation since @property may not be supported):
```jsx
function BorderBeam({ children, className = '' }) {
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    let frame;
    const animate = () => { setAngle(a => (a + 1.5) % 360); frame = requestAnimationFrame(animate); };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className={`relative rounded-2xl ${className}`}>
      <div
        className="absolute inset-0 rounded-2xl opacity-60"
        style={{
          background: `conic-gradient(from ${angle}deg, transparent 60%, #6366f1 80%, transparent 100%)`,
          padding: '1.5px',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      >
        <div className="w-full h-full rounded-[inherit] bg-transparent" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
```

---

## 3. Shimmer / Shine Effects

A light sweep across a surface — for buttons, loading skeletons, or card highlights.

```css
.shimmer {
  position: relative;
  overflow: hidden;
}
.shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    110deg,
    transparent 25%,
    rgba(255, 255, 255, 0.15) 50%,
    transparent 75%
  );
  animation: shimmer-sweep 2.5s ease-in-out infinite;
}
@keyframes shimmer-sweep {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

**Skeleton loading variant:**
```css
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-pulse 1.8s ease-in-out infinite;
}
@keyframes skeleton-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## 4. Marquee / Infinite Ticker

Seamless horizontal scrolling for logos, testimonials, features.

```jsx
function Marquee({ children, speed = 40, reverse = false, className = '' }) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        className="flex gap-8 w-max"
        style={{
          animation: `marquee ${speed}s linear infinite ${reverse ? 'reverse' : ''}`,
        }}
      >
        {children}
        {children} {/* Duplicate for seamless loop */}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
```

**Key detail:** The content is duplicated so when the first set scrolls out, the second fills in seamlessly. The `-50%` matches one full copy.

---

## 5. Blur Fade Entry

Elements enter with both blur and opacity, creating a dreamy reveal.

```jsx
function BlurFade({ children, delay = 0 }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      style={{
        transition: `all 600ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        opacity: isVisible ? 1 : 0,
        filter: isVisible ? 'blur(0px)' : 'blur(10px)',
        transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
      }}
    >
      {children}
    </div>
  );
}
```

---

## 6. Magnetic Hover

Element subtly follows the cursor when hovering, as if pulled magnetically.

```jsx
function MagneticButton({ children, strength = 0.3 }) {
  const ref = useRef(null);
  const [transform, setTransform] = useState('translate(0px, 0px)');

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * strength;
    const y = (e.clientY - rect.top - rect.height / 2) * strength;
    setTransform(`translate(${x}px, ${y}px)`);
  };

  const handleMouseLeave = () => setTransform('translate(0px, 0px)');

  return (
    <button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform, transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      {children}
    </button>
  );
}
```

---

## 7. Parallax Depth Layers

Different elements move at different speeds on scroll, creating depth.

```jsx
function useParallax(speed = 0.5) {
  const [offset, setOffset] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const scrollProgress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      setOffset((scrollProgress - 0.5) * speed * 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return { ref, style: { transform: `translateY(${offset}px)` } };
}
```

---

## 8. Staggered Grid Cascade

Bento grid items animate in with cascade timing based on their grid position.

```jsx
function StaggeredGrid({ items, columns = 3, baseDelay = 80 }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-4`}>
      {items.map((item, i) => (
        <RevealOnScroll key={i} delay={i * baseDelay}>
          {item}
        </RevealOnScroll>
      ))}
    </div>
  );
}
```

---

## 9. Typing / Typewriter Effect

Text appears character by character, optionally with cursor blink.

```jsx
function Typewriter({ text, speed = 50, delay = 0 }) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++; }
      else clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [started, text, speed]);

  return (
    <span>
      {displayed}
      <span className="animate-pulse ml-0.5 inline-block w-[2px] h-[1em] bg-current align-middle" />
    </span>
  );
}
```

---

## 10. Floating Island Navigation

A navigation bar that floats as a rounded pill, expanding into full-screen menu.

Key CSS pattern:
```css
.nav-island {
  position: fixed;
  top: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 9999px;
  backdrop-filter: blur(20px);
  background: rgba(255,255,255,0.8);
  border: 1px solid rgba(0,0,0,0.06);
  padding: 0.5rem 1.5rem;
  z-index: 50;
  transition: all 500ms cubic-bezier(0.16, 1, 0.3, 1);
}
.nav-island.expanded {
  inset: 1rem;
  border-radius: 2rem;
  transform: none;
  padding: 2rem;
}
```

Menu items use staggered reveal: `translate-y-3 opacity-0` → `translate-y-0 opacity-1` with `delay: index * 60ms`.

---

## 11. Gradient Mesh Background

Animated blob-like gradients for ambient background motion.

```css
.mesh-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  overflow: hidden;
}
.mesh-blob {
  position: absolute;
  width: 40vw;
  height: 40vw;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
  animation: mesh-drift 20s ease-in-out infinite alternate;
}
.mesh-blob:nth-child(1) { background: #6366f1; top: -10%; left: -10%; }
.mesh-blob:nth-child(2) { background: #0ea5e9; bottom: -10%; right: -10%; animation-delay: -7s; }
.mesh-blob:nth-child(3) { background: #10b981; top: 50%; left: 50%; animation-delay: -14s; }

@keyframes mesh-drift {
  0% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -20px) scale(1.05); }
  66% { transform: translate(-20px, 30px) scale(0.95); }
  100% { transform: translate(10px, 10px) scale(1.02); }
}
```

---

## 12. Card Tilt / 3D Hover

Cards tilt toward the cursor on hover, creating a 3D perspective effect.

```jsx
function TiltCard({ children, className = '' }) {
  const ref = useRef(null);
  const [style, setStyle] = useState({});

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setStyle({
      transform: `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)`,
      transition: 'transform 0.15s ease-out',
    });
  };

  const handleMouseLeave = () => setStyle({
    transform: 'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)',
    transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
  });

  return (
    <div ref={ref} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} style={style} className={className}>
      {children}
    </div>
  );
}
```

---
name: 3d-animation-design
description: >
  3D scenes (Three.js/React Three Fiber), GSAP timelines, Framer Motion page transitions,
  Lottie animations, and WebGL shaders for production React apps. Anti-AI-generic design
  system with micro-animations, scroll-driven effects, and 3D product showcases.
  Use when FrontendAgent or DesignStudioAgent needs 3D, interactive, or cinematic UI.
---

# Skill: 3D & Animation Design

## Cuándo usar este skill

- FrontendAgent | DesignStudioAgent necesita:
  - Hero section con modelo 3D o partículas
  - Animaciones de página (entrada, salida, scroll-driven)
  - Loading states con Lottie (no spinners genéricos)
  - Micro-animaciones en botones, tarjetas, formularios
  - Dashboard con métricas animadas
  - Escenas de producto 3D interactivas

---

## Tech Stack de Animación

| Librería | Cuándo | CDN / npm |
|----------|--------|-----------|
| **Framer Motion** | Page transitions, micro-animations, layout animations | `framer-motion` |
| **React Three Fiber (R3F)** | Escenas 3D completas en React, modelos GLTF | `@react-three/fiber @react-three/drei three` |
| **GSAP + ScrollTrigger** | Animaciones complejas, scroll-driven, timelines | `gsap` |
| **Lottie React** | JSON animations de alta calidad (dotLottie / LottieFiles) | `@lottiefiles/dotlottie-react` |
| **Tailwind CSS + transitions** | Micro-animations simples (hover, focus, loading) | nativo |

> **Regla de prioridad:** Framer Motion → Tailwind para micro-animaciones. R3F solo para 3D real.
> GSAP cuando Framer Motion no puede (ScrollTrigger, morphing SVG, física).

---

## Framer Motion — Patrones de Producción

### Page Transitions (layout animations)
```typescript
// layouts/MainLayout.tsx
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const pageVariants = {
  initial:  { opacity: 0, y: 20 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:     { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

export function MainLayout({ children }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} variants={pageVariants}
        initial="initial" animate="animate" exit="exit">
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

### Staggered List Items
```typescript
const containerVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// Uso
<motion.ul variants={containerVariants} initial="hidden" animate="show">
  {items.map(item => (
    <motion.li key={item.id} variants={itemVariants}>{item.name}</motion.li>
  ))}
</motion.ul>
```

### Layout Animation (Shared Element)
```typescript
// Efecto "magic move" entre lista y detalle
<motion.div layoutId={`card-${item.id}`} className="...">
  <motion.h2 layoutId={`title-${item.id}`}>{item.title}</motion.h2>
</motion.div>
```

### Hover Card Elevación
```typescript
<motion.div
  whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
  className="bg-white rounded-2xl p-6 cursor-pointer"
>
  {children}
</motion.div>
```

### Count-Up Animado (métricas dashboard)
```typescript
import { useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

function AnimatedCounter({ value, prefix = '', suffix = '' }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 20 });
  const display = useTransform(spring, v => prefix + Math.round(v).toLocaleString() + suffix);
  useEffect(() => { mv.set(value); }, [value]);
  return <motion.span>{display}</motion.span>;
}
```

---

## React Three Fiber — Escenas 3D

### Setup básico
```bash
npm install @react-three/fiber @react-three/drei three
npm install @types/three --save-dev
```

### Hero 3D con modelo GLTF
```typescript
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import type { Mesh } from 'three';

function AnimatedModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const ref = useRef<Mesh>(null!);
  useFrame((_, delta) => { ref.current.rotation.y += delta * 0.4; });
  return <primitive ref={ref} object={scene} scale={1.5} />;
}

export function Hero3D() {
  return (
    <div className="h-[500px] w-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} />
        <Suspense fallback={null}>
          <AnimatedModel url="/models/product.glb" />
          <Environment preset="city" />
        </Suspense>
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
```

### Partículas de fondo (sin modelo)
```typescript
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function Particles({ count = 2000 }) {
  const positions = Float32Array.from(
    Array.from({ length: count * 3 }, () => (Math.random() - 0.5) * 12)
  );
  return (
    <Points positions={positions}>
      <PointMaterial size={0.015} color="#6366f1" transparent opacity={0.6} />
    </Points>
  );
}
```

### Performance rules para R3F
```
✅ Siempre <Suspense fallback={<Loader3D />}> alrededor de modelos
✅ useGLTF.preload('/models/product.glb') en el nivel de módulo
✅ frameloop="demand" en <Canvas> cuando la escena no necesita update constante
✅ Usar instancedMesh para muchos objetos del mismo tipo (no crear N Mesh individuales)
✅ dispose() en useEffect cleanup para liberar memoria GPU
❌ NUNCA Three.js directo + React state — usar useFrame y useRef
❌ NUNCA crear materiales/geometrías dentro de render (crear fuera o con useMemo)
```

---

## GSAP + ScrollTrigger

```typescript
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export function ScrollRevealSection({ children }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    gsap.fromTo(el,
      { opacity: 0, y: 60 },
      {
        opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      }
    );
    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, []);

  return <div ref={ref}>{children}</div>;
}
```

---

## Lottie — Animaciones JSON

```bash
npm install @lottiefiles/dotlottie-react
```

```typescript
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

// Loading state
export function LoadingState() {
  return (
    <DotLottieReact
      src="/animations/loading.lottie"
      loop autoplay
      style={{ width: 120, height: 120 }}
    />
  );
}

// Success / Error states
export function SuccessState() {
  return <DotLottieReact src="/animations/success.lottie" autoplay style={{ width: 80 }} />;
}
```

**Dónde obtener .lottie gratuitos:**
- https://lottiefiles.com/featured (licencia CC0 / free)
- https://dotlottie.io/players/

**Archivos necesarios en public/animations/:**
- `loading.lottie` — spinner/loader animado
- `success.lottie` — checkmark animado al guardar
- `error.lottie` — X animada para errores
- `empty-state.lottie` — ilustración para listas vacías

---

## Micro-Animaciones con Tailwind CSS

### Sistema de transiciones estándar
```css
/* tailwind.config.js — extend.transitionTimingFunction */
'smooth-out': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
'bounce-sm': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
```

### Clases de componentes
```html
<!-- Botón con feedback táctil -->
<button class="
  transform transition-all duration-150 ease-smooth-out
  hover:-translate-y-0.5 hover:shadow-lg
  active:scale-95 active:shadow-sm
">
  Guardar
</button>

<!-- Tarjeta con hover elevation -->
<div class="
  transition-all duration-200 ease-smooth-out
  hover:-translate-y-1 hover:shadow-xl
">

<!-- Input con focus ring animado -->
<input class="
  transition-all duration-150
  focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
  focus:scale-[1.01] focus:outline-none
">
```

---

## Anti-AI-Generic — Animaciones Prohibidas

```
❌ PROHIBIDO: Gradient orbs animados flotando (fondo con 3-4 círculos de colores)
❌ PROHIBIDO: "Fade in from right" genérico sin propósito semántico
❌ PROHIBIDO: Particles.js con flechas conectando puntos
❌ PROHIBIDO: Loading spinner con 3 puntos rebotando (usar Lottie en su lugar)
❌ PROHIBIDO: Parallax de fondo con textura de código (fondo de "developer")
❌ PROHIBIDO: Globe 3D girando con líneas de conexión (se ve en todos los AI startups)
```

```
✅ REQUERIDO: Las animaciones tienen propósito: guiar la atención, confirmar acciones
✅ REQUERIDO: Micro-animaciones en respuesta a interacciones del usuario
✅ REQUERIDO: 3D solo cuando añade valor informativo o de producto (no como decoración)
✅ REQUERIDO: prefers-reduced-motion respetado en todas las animaciones
```

### prefers-reduced-motion
```typescript
import { useReducedMotion } from 'framer-motion';

function AnimatedComponent() {
  const shouldReduceMotion = useReducedMotion();
  
  const variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0, transition: { duration: shouldReduceMotion ? 0.01 : 0.35 } },
  };
  // ...
}
```

---

## Composición en la arquitectura del proyecto

```
frontend/{project}-web/src/
├── components/
│   ├── animations/
│   │   ├── PageTransition.tsx    ← AnimatePresence wrapper
│   │   ├── FadeIn.tsx            ← Reusable scroll reveal
│   │   ├── StaggerList.tsx       ← Staggered list container
│   │   ├── Counter.tsx           ← AnimatedCounter para métricas
│   │   └── LoadingLottie.tsx     ← Lottie wrappers
│   └── 3d/
│       ├── Hero3D.tsx            ← R3F Canvas para hero
│       └── ProductViewer3D.tsx  ← Modelo interactivo de producto
├── hooks/
│   └── useAnimationState.ts     ← Estado de animaciones compartido
└── public/
    ├── animations/              ← .lottie files
    └── models/                  ← .glb GLTF files
```

---

## Performance Checklist

```
[ ] Lazy load de <Canvas> (solo cargar cuando es visible)
[ ] Code splitting: dynamic import() para componentes 3D
[ ] Lottie: usar .lottie (binario ~80% menor que JSON)
[ ] GSAP: importar solo los plugins necesarios (no import gsap/all)
[ ] framer-motion: usar LazyMotion + domAnimation para reducir bundle ~5KB
[ ] Verificar en Lighthouse que LCP y CLS no se degradan con animaciones
[ ] Desactivar animaciones en modo de bajo rendimiento (useReducedMotion)
```

### LazyMotion para bundle más pequeño
```typescript
import { LazyMotion, domAnimation, m } from 'framer-motion';

// En el root layout
<LazyMotion features={domAnimation}>
  {/* Usar <m.div> en lugar de <motion.div> */}
  <m.div animate={{ opacity: 1 }}>...</m.div>
</LazyMotion>
```

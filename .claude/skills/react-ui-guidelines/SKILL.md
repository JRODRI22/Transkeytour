---
name: react-ui-guidelines
description: Catalog of guidelines for writing React/Tailwind/GSAP UI code in this project's visualizer and frontend components. Read at the start of any UI task before writing changes. Each guideline captures a lesson learned in production to prevent common mistakes from recurring. New guidelines should be added when a recurring UI mistake is discovered.
---

# react-ui-guidelines

Catálogo de guidelines para escribir código UI en React 18 + Tailwind CSS + GSAP.
Leer al inicio de cualquier tarea de UI — antes de escribir el cambio.

**Cómo usar este skill:**
- Leer los guidelines una vez al inicio de cualquier tarea de UI
- Cada guideline es independiente — no todos aplican a cada tarea
- Si un guideline aplica, seguirlo
- Cuando se descubra un error UI recurrente que hubiera evitado una regla escrita, agregar aquí

---

## Guideline: Animaciones — preferir GSAP sobre CSS @keyframes

**Problema recurrente**: Usar `@keyframes` + `animation: X infinite` en CSS cuando ya está
instalado GSAP. Las animaciones CSS no tienen cleanup automático y son difíciles de controlar.

**Regla:**
- Usar `useGSAP` + `gsap.to(..., { repeat: -1 })` para loops de animación
- Usar `gsap.from(ref.current, {...})` para entrance animations
- Nunca usar `@keyframes` para animaciones que GSAP ya puede manejar

**Correcto:**
```jsx
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
gsap.registerPlugin(useGSAP);

function AgentNode({ isWorking }) {
  const pulseRef = useRef(null);

  useGSAP(() => {
    if (!isWorking || !pulseRef.current) return;
    gsap.to(pulseRef.current, {
      scale: 1.2,
      autoAlpha: 0.6,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }, { dependencies: [isWorking] });
  // ...
}
```

**Incorrecto:**
```css
/* No usar esto cuando GSAP está disponible */
@keyframes agent-pulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 0.4; }
}
.agent-pulse { animation: agent-pulse 2s ease-in-out infinite; }
```

---

## Guideline: Scope de useGSAP es obligatorio en componentes

**Problema recurrente**: Usar `gsap.to(element)` sin scope → GSAP afecta elementos
fuera del componente, causando bugs difíciles de rastrear.

**Regla:**
- Siempre pasar `{ scope: containerRef }` como segundo argumento a `useGSAP`
- Para animaciones de un solo elemento, el scope puede ser el ref del propio elemento
- El cleanup es automático cuando el componente se desmonta

**Correcto:**
```jsx
const cardRef = useRef(null);
useGSAP(() => {
  gsap.from(cardRef.current, { autoAlpha: 0, y: 12, duration: 0.4 });
}, { scope: cardRef });  // ← scope obligatorio
```

---

## Guideline: Animaciones de entrada con back.out para elementos interactivos

**Patrón establecido**: Los elementos clickeables (cards, nodes, botones importantes)
tienen mejor UX con `ease: 'back.out(1.7)'` que con eases lineales.

**Convenciones del proyecto:**
- Entrance de cards: `{ autoAlpha: 0, y: 12, scale: 0.95, duration: 0.4, ease: 'power2.out' }`
- Entrance de nodos de grafo: `{ scale: 0.5, autoAlpha: 0, duration: 0.6, ease: 'back.out(1.7)' }`
- Stagger de listas: `{ stagger: 0.05 }` — no más de 0.1s por item
- Pulse de "working": `{ scale: 1.2, yoyo: true, repeat: -1, ease: 'sine.inOut' }`

---

## Guideline: No mezclar Framer Motion y GSAP para el mismo elemento

**Problema recurrente**: Un elemento tiene tanto `<motion.div>` como `useGSAP` →
conflictos de transform matrix, comportamiento impredecible.

**Regla:**
- Un elemento usa **uno solo**: GSAP **o** Framer Motion
- Para transiciones simples de estado: usar Tailwind `transition-*` classes
- Para `AnimatePresence` (mount/unmount): puede coexistir con GSAP en otros elementos,
  pero no en el mismo nodo DOM

**Patrón actual del proyecto (ActivityFeed.jsx):**
- Items del feed: GSAP (se removió `<motion.div>`)
- Live indicator dot: Framer Motion (elemento diferente, sin conflicto)

---

## Guideline: Clases Tailwind — no hardcodear colores hex inline

**Problema recurrente**: Mezclar `style={{ color: '#06b6d4' }}` con Tailwind clases →
inconsistencia de design system, difícil de mantener.

**Regla:**
- Usar `text-cyan-400`, `bg-slate-800`, etc. — nunca hex/rgb directo en `style`
- Si el color no existe en Tailwind: agregarlo a `tailwind.config.js` como `extend.colors`
- Excepción permitida: SVG `stroke` / `fill` para colores animados por GSAP

```jsx
// Correcto
<span className="text-cyan-400 font-mono">running</span>

// Incorrecto
<span style={{ color: '#06b6d4' }}>running</span>

// Excepción válida (SVG animado por GSAP)
<circle ref={pulseRef} stroke="#06b6d4" />
```

---

## Guideline: Polling en useEffect — limpiar el intervalo

**Problema recurrente**: `setInterval` en `useEffect` sin cleanup → múltiples polls
acumulados cuando el componente re-monta o el hot reload dispara.

**Regla:**
```jsx
// Correcto
useEffect(() => {
  const poll = setInterval(fetchData, 3000);
  fetchData(); // fetch inmediato al montar
  return () => clearInterval(poll); // ← cleanup obligatorio
}, []);

// Incorrecto
useEffect(() => {
  setInterval(fetchData, 3000); // sin return → memory leak
}, []);
```

---

## Guideline: SVG en React — usar viewBox y sin width/height fijos

**Patrón establecido en AgentGraph.jsx:**
- `<svg viewBox="0 0 800 800">` sin `width` / `height` fijos → se adapta al container
- Container CSS: `width: 100%; aspect-ratio: 1` → cuadrado responsivo
- Coordenadas SVG: centro en `cx=400, cy=400` para layout radial

---

## Guideline: Estado de error en componentes de polling — mostrar banner, no crashear

**Problema recurrente**: Un fetch fallido lanza uncaught error → pantalla en blanco.

**Regla:**
```jsx
// Correcto
const [error, setError] = useState(null);
try {
  const data = await fetch('/api/agents').then(r => r.json());
  setAgents(data);
  setError(null);
} catch (e) {
  setError('JarvisDB offline');  // mostrar banner, no throw
}

// En JSX:
{error && (
  <div className="text-amber-400 text-xs px-3 py-1 bg-amber-900/20 rounded">
    ⚠️ {error}
  </div>
)}
```

---

## Agregar nuevas guidelines

Cuando descubras un error UI recurrente que hubiera evitado una regla escrita:

1. Agregar una nueva sección `## Guideline: [nombre descriptivo]`
2. Incluir: **Problema recurrente** (qué salió mal), **Regla** (qué hacer), y
   **Ejemplo correcto/incorrecto** si aplica
3. Mantener el lenguaje concreto — no vago como "usar buenos estilos"

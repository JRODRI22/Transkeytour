---
name: frontend-pro
description: Consolidated frontend skill covering React 18, Next.js patterns, performance, component architecture, UI/UX best practices, and anti-AI-generic design. Superset of frontend-design + frontend-patterns + vercel-react-best-practices + ui-ux-pro-max key rules.
triggers:
  - React
  - frontend
  - UI components
  - Vite
  - Tailwind
  - design system
  - anti-AI-generic
---

# Frontend Pro — React 18 + Vite 5 + Tailwind (Consolidated Skill)

> Superset de: `frontend-design` + `frontend-patterns` + `vercel-react-best-practices` + `ui-ux-pro-max`
> Carga esta skill en lugar de las 4 individuales — reduce overhead de contexto ~65%.

---

## 1. ARQUITECTURA DE COMPONENTES

### Jerarquía obligatoria
```
src/
├── pages/          ← Una por ruta. Solo orquesta — nada de lógica de negocio
├── components/
│   ├── ui/         ← Átomos/moléculas: Button, Input, Card, Badge, Alert (shadcn/ui base)
│   ├── features/   ← Organismos: ClienteCard, FacturaRow, DashboardChart
│   └── layout/     ← PageTransition, Sidebar, Navbar, Footer
├── hooks/          ← useClientes, useFactura, useAuth — lógica de negocio en hooks
├── services/       ← clientesService.js (axios calls), uno por módulo
├── stores/         ← Zustand stores (solo si estado global complejo)
└── lib/            ← utils, formatters, validators (funciones puras)
```

### Regla de separación
- **Pages:** solo `import`, `useHook()`, `<ComponenteFeature />`, sin `useState` de lógica de negocio
- **Hooks:** toda la lógica — async, estado local complejo, efectos secundarios
- **Services:** solo llamadas HTTP — retornan datos crudos, sin transformar estado
- **Components/ui:** stateless o mínimo estado visual — reutilizables sin contexto de negocio

### Composición sobre props booleanas
```tsx
// ❌ NUNCA: prop drilling + booleanas
<Button loading disabled variant="primary" size="lg" icon="trash" iconPosition="left" />

// ✅ SIEMPRE: composición explícita
<Button variant="primary" size="lg">
  <LoadingSpinner size="sm" />
  <TrashIcon /> Eliminar
</Button>
```

---

## 2. PERFORMANCE

### Server Components vs Client Components (Next.js / RSC)
```tsx
// Componentes sin interactividad: RSC por defecto (0 JS al cliente)
// Solo agregar 'use client' cuando NECESARIO:
"use client"  // solo si usa: useState, useEffect, onClick, event handlers, browser APIs

// ❌ EVITAR: 'use client' en layout wrappers o páginas enteras
// ✅ AISLAR: client components al nivel más bajo posible (leaf nodes)
```

### Lazy loading obligatorio
```tsx
// Todas las páginas y componentes pesados: lazy + Suspense
const ClientesPage  = lazy(() => import('./pages/ClientesPage'));
const ChartModule   = lazy(() => import('./components/features/ChartModule'));
const HeavyModal    = lazy(() => import('./components/features/HeavyModal'));

// Wrapper global en App.tsx:
<Suspense fallback={<PageSkeleton />}>
  <Routes>...</Routes>
</Suspense>
```

### Memoización (solo cuando mide)
```tsx
// useMemo: cálculos costosos referenciados en render
const filteredData = useMemo(
  () => clientes.filter(c => c.nombre.includes(search)),
  [clientes, search]  // solo re-calcula si cambia clientes o search
);

// useCallback: funciones pasadas como props a children memoizados
const handleDelete = useCallback((id: string) => {
  deleteCliente(id);
}, [deleteCliente]);

// memo: componentes con renders costosos recibiendo las mismas props
const ClienteCard = memo(({ cliente, onDelete }: ClienteCardProps) => {
  return <div>...</div>;
});
```

### Listas: virtualización para >50 items
```tsx
// Para tablas/listas grandes usar @tanstack/react-virtual
import { useVirtualizer } from '@tanstack/react-virtual';
```

---

## 3. GESTIÓN DE ESTADO

### Reglas de jerarquía
```
useState    → Estado local de un componente / interacción UI puntual
useContext  → Estado compartido entre pocos (<5) componentes próximos (tema, user)
Zustand     → Estado global complejo: carrito, multi-módulo, sincronización entre páginas
React Query → Estado del servidor: data fetching, caching, invalidación, optimistic updates
```

### Pattern React Query + Service
```tsx
// services/clientesService.ts
export const clientesService = {
  getAll: (params: ClienteParams) => 
    api.get<Cliente[]>('/api/clientes', { params }),
  create: (data: CreateClienteRequest) => 
    api.post<Cliente>('/api/clientes', data),
  update: (id: string, data: UpdateClienteRequest) => 
    api.put<Cliente>(`/api/clientes/${id}`, data),
  delete: (id: string) => 
    api.delete(`/api/clientes/${id}`),
};

// hooks/useClientes.ts
export function useClientes(params: ClienteParams) {
  return useQuery({
    queryKey: ['clientes', params],
    queryFn: () => clientesService.getAll(params),
    staleTime: 5 * 60 * 1000,  // 5 min cache
  });
}
export function useCreateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clientesService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
    onError: (err) => toast.error(extractApiError(err)),
  });
}
```

---

## 4. FORMULARIOS

```tsx
// Siempre React Hook Form + Zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(200),
  email: z.string().email('Email inválido'),
  amount: z.number().positive('Debe ser positivo').max(999999),
});

type FormData = z.infer<typeof schema>;

export function ClienteForm({ onSubmit }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Nombre" error={errors.name?.message}>
        <Input {...register('name')} />
      </FormField>
      <Button type="submit" loading={isSubmitting}>Guardar</Button>
    </form>
  );
}
```

---

## 5. DISEÑO ANTI-AI-GENERIC (CRÍTICO)

### LISTA PROHIBIDA — nunca usar esto
```
× Purple gradients como color primario (#7C3AED, #8B5CF6 como brand)
× Gradient orbs de fondo (blob azul-morado flotante)
× "glassmorphism" sin jerarquía real — backdrop-filter en todo
× Hero text: "We help you [verb] X [faster/better/easier]"
× Centered layout sin jerarquía — todo en columna centrada
× Helvetica/Inter como única fuente sin personalidad
× Spinner CSS genérico (border-t-transparent) — usar Lottie
× negro puro #000000 — usar #0A0A0A o #111827
× rounded-full en botones de acción primaria (parece móvil)
× box-shadow genérico sin color de profundidad
```

### Paletas por industria (usar como punto de partida)
```
Healthcare/Salud:
  primary: #2563EB (azul claro, confianza)
  accent: #10B981 (verde menta, salud)
  surface: #F8FAFF | text: #1E293B

Finance/Finanzas:
  primary: #1E3A5F (azul marino profundo)
  accent: #C9A84C (dorado, autoridad)
  surface: #FAFAF8 | text: #0F172A

Restaurant/Gastronomía:
  primary: #C1440E (terracota vibrante)
  accent: #4A7C59 (verde oliva)
  surface: #FAF3E0 | text: #292524

Technology/SaaS:
  primary: #4F46E5 (índigo tech)
  accent: #06B6D4 (cyan, innovación)
  surface: #020617 | text: #E2E8F0  [dark mode]

Real Estate/Inmobiliaria:
  primary: #374151 (gris carbón)
  accent: #B87333 (cobre, valor)
  surface: #F5F0E8 | text: #1C1917

Legal/Jurídico:
  primary: #1B2E4B (azul Prusia)
  accent: #8B7355 (dorado antiguo)
  surface: #FAFAFA | text: #111827

Education/Educación:
  primary: #1D4ED8 (azul académico)
  accent: #F59E0B (ámbar energético)
  surface: #FFFBEB | text: #1F2937

Retail/Comercio:
  primary: #4A1942 (morado profundo)
  accent: #FF6B6B (coral energético)
  surface: #FFF9F9 | text: #1A1A2E
```

### Tipografía (pairings curados)
```
Finance/Legal:    Playfair Display (headings) + Source Sans Pro (body)
Tech/SaaS:        Space Grotesk (headings) + Inter (body)
Healthcare:       Nunito (headings) + Open Sans (body)
Restaurant:       Cormorant Garamond (headings) + Lato (body)
General:          DM Serif Display (headings) + DM Sans (body)
Modern:           Cabinet Grotesk (headings) + Satoshi (body)
```

### Tokens en tailwind.config.js (obligatorio)
```js
// tailwind.config.js — NUNCA hardcodear clases con colores directos
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: { 50: '#...', 500: '#...', 900: '#...' },
        accent: { 500: '#...' },
        surface: '#...',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
        'card-colored': '0 8px 25px -5px color-mix(in srgb, var(--color-primary) 30%, transparent)',
        'xl-deep': '0 25px 50px -10px rgba(0,0,0,0.25)',
      },
    },
  },
};
// Uso: className="bg-primary-500 font-display shadow-card" — NO: className="bg-indigo-500"
```

---

## 6. MICRO-ANIMACIONES (estándares mínimos)

### Framer Motion — en TODOS los componentes interactivos
```tsx
// Transición de página global (obligatorio en App.tsx o Layout)
import { AnimatePresence, motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Cards con hover
const cardVariants = {
  idle: { scale: 1, boxShadow: '0 4px 6px rgba(0,0,0,0.07)' },
  hover: { scale: 1.02, boxShadow: '0 20px 40px rgba(0,0,0,0.12)', transition: { duration: 0.2 } },
};
<motion.div variants={cardVariants} initial="idle" whileHover="hover">

// Lista staggered (aparición escalonada de ítems)
const containerVariants = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
};
```

### Loading states con Lottie (reemplazar spinner CSS genérico)
```tsx
import Lottie from 'lottie-react';
import loadingAnimation from '@/assets/lottie/loading.json';  // from lottiefiles.com

<Lottie animationData={loadingAnimation} loop style={{ width: 48, height: 48 }} />

// Estados recomendados con Lottie:
// - loading.json    → loading spinner / skeleton
// - success.json    → checkmark animado
// - error.json      → X animado
// - empty.json      → empty state illustration
// Fuente: lottiefiles.com (gratis) / iconscout.com
```

---

## 7. ACCESIBILIDAD (a11y)

```tsx
// Siempre: aria-labels en iconos, focus-visible, roles semánticos
<button
  aria-label="Eliminar cliente"
  className="focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none"
  onClick={handleDelete}
>
  <TrashIcon aria-hidden="true" />
</button>

// Reducir movimiento (respeta prefers-reduced-motion)
const shouldReduceMotion = useReducedMotion();
const transition = shouldReduceMotion ? { duration: 0 } : { duration: 0.3 };

// Contraste mínimo: AA (4.5:1 texto normal, 3:1 texto grande)
// Verificar: https://webaim.org/resources/contrastchecker/
```

---

## 8. MANEJO DE ERRORES Y FEEDBACK

```tsx
// Toast global con react-hot-toast (en Layout)
import toast from 'react-hot-toast';
// <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

// Helpers para mensajes consistentes
export const notify = {
  success: (msg: string) => toast.success(msg),
  error:   (msg: string) => toast.error(msg),
  loading: (msg: string) => toast.loading(msg),
  apiError: (err: unknown) => {
    const message = err instanceof AxiosError
      ? err.response?.data?.message ?? 'Error del servidor'
      : 'Error inesperado';
    toast.error(message);
  },
};

// Error boundaries en secciones críticas
import { ErrorBoundary } from 'react-error-boundary';
<ErrorBoundary FallbackComponent={SectionErrorFallback}>
  <ComponenteCritico />
</ErrorBoundary>
```

---

## 9. CHECKLIST PRE-ENTREGA

```
UI / Diseño
[ ] ¿Tiene Design System con tokens en tailwind.config.js? (no hardcoded)
[ ] ¿Usa 2 fonts (display + body)?
[ ] ¿Hay al menos 1 elemento animado en hero/landing?
[ ] ¿Todos los loading states usan Lottie (no spinner CSS)?
[ ] ¿Las cards tienen sombras con profundidad real (no genéricas)?
[ ] ¿Pasó el Anti-AI-Generic check? (nada de purple gradient, orbs, centered-all)

Performance
[ ] ¿Todas las páginas están lazy-loaded?
[ ] ¿Los componentes pesados (charts, modals) están lazy + Suspense?
[ ] ¿useQuery/React Query para datos del servidor?
[ ] ¿Sin useEffect para fetching (usar useQuery)?

Calidad
[ ] ¿Todos los formularios usan react-hook-form + zod?
[ ] ¿PageTransition wrapper con Framer Motion?
[ ] ¿Toaster de react-hot-toast en Layout?
[ ] ¿aria-labels en todos los iconos sin texto?
[ ] ¿focus-visible en elementos interactivos?

Seguridad
[ ] ¿JWT en memory/sessionStorage (no localStorage)?
[ ] ¿Sin datos sensibles en query params?
[ ] ¿DOMPurify en cualquier content renderizado como HTML?
```

---
applyTo: "frontend/**"
description: "Fase 3: genera la app React 18 + Vite 5 + Tailwind completa (pages, components, services, layouts) con design system anti-AI-generic."
---

# FrontendAgent — Fase 3

## Activación automática
Se activa cuando `backend/` existe pero `frontend/src/` **no existe todavía**.
También por keywords: "frontend", "React", "páginas", "UI", "vistas", "componentes".

**Skills auto-cargados:** `frontend-design`, `frontend-patterns`, `vercel-react-best-practices`, `ui-ux-pro-max`

---

## Contrato INPUT / OUTPUT (Agent Teams Lite)

### INPUT (recibido del OrchestratorAgent)
```json
{
  "routes_md": "contenido de docs/ROUTES.md",
  "tasks_md_slice": "filas de docs/TASKS.md con Fase=Frontend y Scope=[v1]",
  "PROJECT_MD_sections": "secci\u00f3n 5 (Config) para port y DB name",
  "context": "phases.backend == done, frontend/src/ no existe"
}
```

### OUTPUT (retornado al OrchestratorAgent)
```json
{
  "agent": "FrontendAgent",
  "status": "done | error",
  "files_generated": ["frontend/{project}-web/src/pages/...", "frontend/{project}-web/src/components/...", "..."],
  "errors": [],
  "next_suggested": "IntegrationAgent",
  "state_updates": { "phases.frontend": "done" }
}
```

> **Regla:** Al completar, retorna el OUTPUT JSON al OrchestratorAgent y **DETENTE**.

### Suggested next agent
Al finalizar exitosamente, incluir al final del OUTPUT:
```
### Suggested next agent
Agent: IntegrationAgent
Reason: Frontend listo — conectar Axios + JWT con backend
```
Si hay errores de build en el frontend:
```
### Suggested next agent
Agent: DebugAgent
Reason: Errores de build detectados en FrontendAgent
```

---

> **Protocolo v1**: Este agente SOLO genera las páginas marcadas `[v1]` en `docs/TASKS.md`.
> Al terminar, actualiza el estado de cada tarea a `✅ Done`.

## Antes de iniciar
1. **[OBLIGATORIO]** Llamar `log_agent_run({agent_name: "FrontendAgent", status: "started", project_name, phase: "frontend"})` ← MCP jarvisdb
2. Lee `docs/TASKS.md` — filtra filas con `Fase = Frontend` y `Estado = ⬜ Pending` y `Scope = [v1]`.
2. Confirma que FASE 2 (BackendAgent) está `✅ Done`.
3. Lee `docs/ROUTES.md` para saber qué páginas generar.

---

## PASO OBLIGATORIO: Generar Design System (ANTES de cualquier código UI)

> **HARD GATE:** No escribir NINGÚN componente React, JSX, ni CSS hasta completar este paso.
> Saltar este paso produce UI genérica de AI — esto está PROHIBIDO.

### Workflow

1. **Identificar la industria** del proyecto desde `PROJECT.md` §1 (Descripción general)
2. **Leer** la skill `ui-ux-pro-max` y aplicar el **Industry-Specific Reasoning Engine**:
   - Seleccionar la tabla de industria que corresponda (Tech/SaaS, Finance, Healthcare, E-Commerce, Services, Creative, Emerging Tech)
   - Extraer: Recommended Pattern, Style Priority, Color Mood, Typography Mood, Key Effects, Anti-Patterns
3. **Generar** `design-system/MASTER.md` con este contenido mínimo:

   > **Nota de merge strategy:** Este es el **v1 base** del Design System (Tailwind tokens, paleta, tipografía).
   > Si el usuario activa DesignStudioAgent (20) posteriormente, ese agente **extiende** este archivo
   > agregando tokens 3D, animaciones y componentes industry-specific. No lo sobrescribe desde cero.
   ```markdown
   # Design System — {ProjectName}
   
   ## Industry: {industria identificada}
   ## Pattern: {recommended pattern}
   ## Style: {style priority}
   
   ### Color Palette
   - Primary: {hex} — {nombre descriptivo}
   - Secondary: {hex}
   - Accent: {hex} — usado < 10% para impacto máximo
   - Surface Light: {hex}
   - Surface Dark: {hex}
   - Text Primary: {hex}
   - Text Secondary: {hex}
   - Error: {hex}
   - Success: {hex}
   
   ### Typography
   - Display/Heading: {font from Google Fonts} — {weight}
   - Body: {font from Google Fonts} — {weight}
   - Mono (optional): {font}
   
   ### Effects & Motion
   - {effect 1 from reasoning engine}
   - {effect 2}
   
   ### Anti-Patterns to AVOID
   - {anti-pattern 1 from reasoning engine}
   - {anti-pattern 2}
   
   ### Differentiation Techniques (pick 3+)
   - {technique 1}
   - {technique 2}
   - {technique 3}
   ```
4. **Aplicar** las reglas ANTI-AI-GENERIC de `ui-ux-pro-max`:
   - Verificar BANNED list: nada de la lista debe estar presente
   - Verificar REQUIRED list: todo debe estar implementado
   - Seleccionar 3+ DIFFERENTIATION TECHNIQUES

### Integración con Tailwind

El Design System se traduce a `tailwind.config.js` así:
```js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '{primary}', dark: '{primary-dark}' },
        secondary: '{secondary}',
        accent: '{accent}',
        surface: { light: '{surface-light}', dark: '{surface-dark}' },
      },
      fontFamily: {
        display: ['{Display Font}', 'sans-serif'],
        body: ['{Body Font}', 'sans-serif'],
      },
    },
  },
};
```

> **Todo componente usa tokens del Design System** — nunca `text-blue-500` directo,
> siempre `text-primary`, `bg-surface-light`, `font-display`.

---

## Estructura a generar

```
frontend/{project}-web/
├── package.json
├── vite.config.js
├── index.html
├── .env.development          ← VITE_API_URL=http://localhost:PORT
├── .env.production
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx
    ├── App.jsx               ← React Router setup
    ├── layouts/
    │   ├── MainLayout.jsx    ← navbar + sidebar + outlet
    │   └── AuthLayout.jsx    ← centrado, solo para login
    ├── pages/
    │   ├── LoginPage.jsx
    │   ├── DashboardPage.jsx
    │   └── {Modulo}/
    │       ├── {Modulo}ListPage.jsx
    │       ├── {Modulo}FormPage.jsx
    │       └── {Modulo}DetailPage.jsx
    ├── components/
    │   ├── ui/
    │   │   ├── Button.jsx
    │   │   ├── Input.jsx
    │   │   ├── Modal.jsx
    │   │   └── DataTable.jsx
    │   └── {Modulo}/
    │       └── {Modulo}Card.jsx
    ├── services/
    │   └── {modulo}Service.js   ← uno por módulo, usa api.js
    ├── hooks/
    │   ├── useAuth.js
    │   └── use{Modulo}.js
    └── context/
        └── AuthContext.jsx
```

> **Nota:** `services/api.js` (instancia Axios + interceptor JWT) lo genera **IntegrationAgent (Fase 4)**.
> FrontendAgent solo crea los services de módulo que llaman a `api.js`.

---

## Convenciones React obligatorias

### App.jsx — React Router 6
```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { useAuth } from './hooks/useAuth';

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/{modulo}" element={<{Modulo}ListPage />} />
          <Route path="/{modulo}/nuevo" element={<{Modulo}FormPage />} />
          <Route path="/{modulo}/:id" element={<{Modulo}FormPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

### AuthContext.jsx — manejo de token
```jsx
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem('token');
    if (!t) return null;
    try { return JSON.parse(atob(t.split('.')[1])); } catch { return null; }
  });

  const login = (jwt) => {
    localStorage.setItem('token', jwt);
    setToken(jwt);
    try { setUser(JSON.parse(atob(jwt.split('.')[1]))); } catch { setUser(null); }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return <AuthContext.Provider value={{ token, user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
```

### Service de módulo
```js
// services/productosService.js
import api from './api'; // generado por IntegrationAgent

export const productosService = {
  getAll: (page = 1, pageSize = 20) =>
    api.get('/productos', { params: { page, pageSize } }),
  getById: (id) => api.get(`/productos/${id}`),
  create: (data) => api.post('/productos', data),
  update: (id, data) => api.put(`/productos/${id}`, data),
  remove: (id) => api.delete(`/productos/${id}`),
};
```

### Página de listado con paginación
```jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productosService } from '../../services/productosService';
import DataTable from '../../components/ui/DataTable';
import { toast } from 'react-hot-toast';

export default function ProductosListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const PAGE_SIZE = 20;

  useEffect(() => {
    setLoading(true);
    productosService.getAll(page, PAGE_SIZE)
      .then(({ data }) => { setItems(data.items); setTotal(data.totalCount); })
      .catch(() => toast.error('Error al cargar productos'))
      .finally(() => setLoading(false));
  }, [page]);

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este registro?')) return;
    await productosService.remove(id);
    toast.success('Eliminado');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
        <Link to="/productos/nuevo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + Nuevo
        </Link>
      </div>
      <DataTable
        loading={loading}
        columns={[
          { key: 'nombre', label: 'Nombre' },
          { key: 'precio', label: 'Precio', render: (v) => `$${v.toFixed(2)}` },
          { key: 'stock', label: 'Stock' },
        ]}
        data={items}
        onEdit={(row) => navigate(`/productos/${row.id}`)}
        onDelete={(row) => handleDelete(row.id)}
        page={page}
        totalCount={total}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
}
```

### Formulario con validación (react-hook-form)
```jsx
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { productosService } from '../../services/productosService';
import { toast } from 'react-hot-toast';
import { useEffect } from 'react';

export default function ProductoFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (isEdit) {
      productosService.getById(id)
        .then(({ data }) => reset(data))
        .catch(() => toast.error('No se pudo cargar el producto'));
    }
  }, [id]);

  const onSubmit = async (data) => {
    try {
      isEdit ? await productosService.update(id, data) : await productosService.create(data);
      toast.success(isEdit ? 'Actualizado' : 'Creado');
      navigate('/productos');
    } catch { toast.error('Error al guardar'); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">{isEdit ? 'Editar' : 'Nuevo'} Producto</h1>
      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre</label>
        <input {...register('nombre', { required: 'Requerido', maxLength: 200 })}
          className="mt-1 block w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
        {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Precio</label>
        <input type="number" step="0.01"
          {...register('precio', { required: 'Requerido', min: { value: 0.01, message: 'Debe ser > 0' } })}
          className="mt-1 block w-full border rounded-md px-3 py-2" />
        {errors.precio && <p className="text-red-500 text-sm mt-1">{errors.precio.message}</p>}
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={isSubmitting}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" onClick={() => navigate(-1)}
          className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200">
          Cancelar
        </button>
      </div>
    </form>
  );
}
```

---

## package.json requerido
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-router-dom": "^6.0.0",
    "axios": "^1.0.0",
    "react-hook-form": "^7.0.0",
    "react-hot-toast": "^2.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.0.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0"
  }
}
```
> **React Bits deps (opt-in):** Algunos componentes requieren `motion` (`npm i motion`) o `gsap` (`npm i gsap`).
> Instala solo lo que uses. Revisa la sección de dependencias en [reactbits.dev](https://reactbits.dev).

---

## Developer Branding (OBLIGATORIO en cada proyecto)

> **Regla:** Todo proyecto generado debe incluir los créditos del desarrollador.
> Ver CLAUDE.md §15 para datos completos.

### 1. Copiar logo a public/

Al generar el frontend, copiar `assets/logo-developer.png` a `frontend/{project}-web/public/logo-developer.png`.

### 2. Componente DeveloperFooter.jsx

Crear `components/DeveloperFooter.jsx`:

```jsx
export default function DeveloperFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white py-4 px-6">
      <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
        <img src="/logo-developer.png" alt="JR Digital Solutions" className="h-8" />
        <span>Desarrollado por <strong>JR Digital Solutions</strong></span>
        <a href="https://wa.me/50661969427" target="_blank" rel="noopener noreferrer"
           className="text-green-600 hover:text-green-700 ml-2">
          WhatsApp
        </a>
      </div>
    </footer>
  );
}
```

### 3. Integrar en layouts

- **MainLayout.jsx:** Incluir `<DeveloperFooter />` al final del layout (después del `<Outlet />`).
- **AuthLayout.jsx:** Incluir `<DeveloperFooter />` al final (debajo del formulario de login).

### 4. Diseño adaptable

El footer debe usar los tokens del Design System para `border-color` y `bg-color`, adaptándose al tema del proyecto. El logo y los datos del desarrollador son fijos.

---

## React Bits — Librería de UI Creativa (Opt-in)

**React Bits** ([reactbits.dev](https://reactbits.dev) · [GitHub](https://github.com/DavidHDev/react-bits)) es una colección de
110+ componentes React animados e interactivos. **Son opt-in** — úsalos en puntos de alto impacto para hacer
la UI memorable, sin saturar las páginas de trabajo (formularios, tablas).

### Instalación

Cada componente se copia desde la documentación (pestaña Code) o vía CLI:

```bash
# CLI shadcn (variante JS + Tailwind)
npx shadcn@latest add @react-bits/SplitText-JS-TW
npx shadcn@latest add @react-bits/Aurora-JS-TW
npx shadcn@latest add @react-bits/SpotlightCard-JS-TW
```

---

### 💬 Text Animations

| Componente | Uso ideal |
|-----------|-----------|
| `SplitText` | Hero headline — aparición letra por letra (dep: `motion`) |
| `BlurText` | Subtítulos — aparición con desenfoque (dep: `motion`) |
| `GradientText` | Títulos con gradiente animado (CSS puro) |
| `ShinyText` | Badges, labels llamativos (CSS puro) |
| `GlitchText` | Efectos tecnológicos / dark themes |
| `RotatingText` | Texto que rota entre múltiples palabras (dep: `motion`) |
| `DecryptedText` | Decodificación tipo terminal al hover |
| `CountUp` | Estadísticas/métricas con counter animado |
| `FuzzyText` | Efecto hover interactivo en títulos grandes |
| `ScrollReveal` | Párrafos que aparecen en scroll (dep: `motion`) |
| `ScrollVelocity` | Texto marquee que acelera con el scroll (dep: `motion`) |
| `TrueFocus` | Resalta una palabra a la vez en un párrafo |
| `VariableProximity` | Grosor tipográfico variable por posición del cursor |
| `ASCIIText` | Render de texto como ASCII art animado (dep: `ogl`) |
| `CircularText` | Texto dispuesto en círculo giratorio |
| `FallingText` | Letras que caen con gravedad (dep: `motion`) |
| `ScrambledText` | Texto scramble al entrar en viewport |
| `ScrollFloat` | Texto que flota al hacer scroll |
| `TextCursor` | Añade cursor parpadeante al texto |
| `TextPressure` | Deformación tipográfica por presión del cursor |
| `TextType` | Efecto typewriter clásico |
| `Shuffle` | Letras que se reordenan aleatoriamente |

---

### 🌀 Animations

| Componente | Uso ideal |
|-----------|-----------|
| `AnimatedContent` | Wrapper para animar cualquier sección al aparecer (dep: `motion`) |
| `FadeContent` | Fade-in suave de secciones al entrar en viewport |
| `SplashCursor` | Cursor tipo fluid WebGL — efecto "wow" para hero (dep: `ogl`) |
| `BlobCursor` | Cursor blob siguiendo al mouse (solo uno por proyecto) |
| `GhostCursor` | Cursor fantasma con trail |
| `Magnet` | Elementos magnéticos que atraen el cursor al hover |
| `MagnetLines` | Líneas que reaccionan al cursor |
| `GlareHover` | Efecto de brillo en hover sobre cards |
| `GradualBlur` | Desenfoque gradual de sección (dep: `motion`) |
| `ElectricBorder` | Bordes eléctricos animados |
| `StarBorder` | Bordes con estrellas orbitando (CSS) |
| `ClickSpark` | Partículas/chispas al hacer click |
| `PixelTransition` | Transición pixelada entre rutas (dep: `gsap`) |
| `PixelTrail` | Trail de píxeles siguiendo el cursor (dep: `ogl`) |
| `ImageTrail` | Trail de imágenes siguiendo el cursor (dep: `motion`) |
| `MagicRings` | Anillos decorativos animados (dep: `motion`) |
| `MetaBalls` | Esferas líquidas interactivas (dep: `ogl`) |
| `MetallicPaint` | Efecto pintura metálica WebGL (dep: `ogl`) |
| `Ribbons` | Cintas 3D decorativas (dep: `ogl`) |
| `Noise` | Overlay de textura/ruido animado (dep: `ogl`) |
| `Cubes` | Cubos 3D flotantes decorativos (dep: `three`) |
| `Antigravity` | Elementos que flotan con física antigravedad |
| `LaserFlow` | Flujo de rayos láser decorativo |
| `LogoLoop` | Loop de logos en marquee |
| `ShapeBlur` | Formas con blur interactivo |
| `StickerPeel` | Efecto sticker que se despega |
| `OrbitImages` | Imágenes orbitando un punto central |
| `Crosshair` | Cursor tipo crosshair personalizado |
| `TargetCursor` | Cursor target con animación |

---

### 🖼️ Backgrounds

| Componente | Uso ideal |
|-----------|-----------|
| `Aurora` | Login / hero — gradiente aurora boreal suave |
| `Silk` | Hero corporativo suave multicolor (dep: `ogl`) |
| `Iridescence` | Fondo iridiscente WebGL de alto impacto (dep: `ogl`) |
| `Particles` | Dashboard — partículas flotantes discretas (dep: `ogl`) |
| `Waves` | Fondos ondulantes suaves |
| `Orb` | Orbes de luz degradados |
| `DotGrid` | Cuadrícula de puntos con parallax al cursor |
| `Squares` | Cuadros que se iluminan al hover |
| `Beams` | Haces de luz angulares |
| `Galaxy` | Fondo tipo galaxia/espacio estelar |
| `LightRays` | Rayos de luz tipo crepuscular |
| `LightPillar` | Pilares de luz verticales |
| `Lightning` | Relámpagos decorativos |
| `Threads` | Hilos/líneas fluyentes orgánicas (dep: `ogl`) |
| `GridMotion` | Grid con movimiento parallax por cursor |
| `GridDistortion` | Distorsión del grid al hover (dep: `ogl`) |
| `GridScan` | Efecto scan tipo radar |
| `LiquidChrome` | Efecto cromado líquido (dep: `ogl`) |
| `LiquidEther` | Éter líquido animado (dep: `ogl`) |
| `Hyperspeed` | Efecto velocidad hiperespacial (dep: `three`) |
| `Plasma` | Plasma colorido animado |
| `Prism` | Descomposición prismática de luz |
| `PrismaticBurst` | Destello prismático |
| `Grainient` | Gradiente con efecto grain/ruido |
| `GradientBlinds` | Persianas de gradiente |
| `ColorBends` | Curvas de color fluidas |
| `Balatro` | Efecto barajas Balatro |
| `Ballpit` | Piscina de bolas con física |
| `DarkVeil` | Velo oscuro animado |
| `Dither` | Efecto dithering retro |
| `FaultyTerminal` | Terminal con glitch |
| `FloatingLines` | Líneas flotantes decorativas |
| `LetterGlitch` | Letras con glitch de fondo |
| `PixelBlast` | Explosión de píxeles |
| `PixelSnow` | Nieve pixelada |
| `RippleGrid` | Grid con ondas al hover |

---

### 🧩 Components

| Componente | Uso ideal |
|-----------|-----------|
| `SpotlightCard` | Cards con spotlight de cursor (muy popular, CSS) |
| `TiltedCard` | Cards con efecto tilt 3D en hover (dep: `motion`) |
| `GlassSurface` | Superficie glassmorphism reutilizable |
| `FluidGlass` | Vidrio con distorsión líquida (dep: `ogl`) |
| `ReflectiveCard` | Card con reflejo dinámico |
| `DecayCard` | Card con efecto de decaimiento |
| `PixelCard` | Card pixelada animada |
| `ProfileCard` | Card de perfil de usuario con 3D tilt |
| `MagicBento` | Grid bento con spotlight por celda |
| `BounceCards` | Cards con animación de rebote al aparecer |
| `ChromaGrid` | Grid colorido interactivo |
| `AnimatedList` | Lista con animaciones de entrada escalonadas |
| `Counter` | Contador animado de números |
| `Stepper` | Steps/wizard animado |
| `ElasticSlider` | Slider con física elástica |
| `Carousel` | Carrusel animado con arrastre |
| `Stack` | Cards apiladas con selección interactiva |
| `ScrollStack` | Cards que se apilan en scroll |
| `FlyingPosters` | Pósters que vuelan en 3D (dep: `three`) |
| `CircularGallery` | Galería circular 3D (dep: `ogl`) |
| `DomeGallery` | Galería tipo domo 3D |
| `Masonry` | Layout masonry animado |
| `FlowingMenu` | Menú fluido con imagen en hover (dep: `gsap`) |
| `GooeyNav` | Navbar con efecto gooey líquido |
| `PillNav` | Navegación tipo pill con slide animado |
| `Dock` | Dock estilo macOS con magnify |
| `StaggeredMenu` | Menú con aparición escalonada |
| `InfiniteMenu` | Menú infinito circular |
| `BubbleMenu` | Menú con burbujas |
| `CardNav` | Navegación basada en cards |
| `CardSwap` | Cards que se intercambian |
| `GlassIcons` | Iconos con efecto vidrio |
| `Folder` | Animación de carpeta con contenido |
| `Lanyard` | Lanyard/badge 3D (dep: `@react-three/fiber`, assets `.glb`) |
| `ModelViewer` | Visor de modelos 3D (dep: `@react-three/fiber`) |

---

### Guía de uso por página

| Página | React Bits recomendados |
|--------|------------------------|
| **LoginPage** | Fondo: `Aurora` o `Silk` · Título: `SplitText` · Botón: `Magnet` |
| **DashboardPage** | KPIs: `CountUp` · Secciones: `FadeContent` · Fondo sutil: `Particles` |
| **ListPage** | Entrada de tabla: `AnimatedContent` · Lista de cards: `AnimatedList` |
| **FormPage** | Solo `FadeContent` en el header — no saturar áreas de formulario |
| **Error/404** | Texto: `GlitchText` · Fondo: `Aurora` o `Squares` |
| **Landing/Hero** | Cursor: `SplashCursor` · Título: `BlurText` + `SplitText` · Fondo: `Aurora`/`Galaxy` |

### Reglas de uso

1. **Máximo 2-3 efectos por página** — menos es más.
2. **No en tablas ni formularios** — los efectos distraen en áreas de trabajo.
3. **Fondos animados** (`Aurora`, `Particles`, etc.) solo en hero/login, nunca en todo el layout.
4. **Cursor effects** (`SplashCursor`, `BlobCursor`) → solo **uno** por proyecto, en el root `App.jsx`.
5. **WebGL/Three.js** components son de alto impacto pero pesados — solo para secciones especiales.
6. Siempre revisar las **dependencias requeridas** en [reactbits.dev](https://reactbits.dev) antes de copiar.

---

## Formato de salida al completar

```
✅ FASE 3 COMPLETADA — FrontendAgent
Scope: v1 (API + React + Clean Architecture)
Archivos generados:
  - App.jsx + main.jsx
  - 2 layouts (MainLayout, AuthLayout)
  - [N] páginas (list + form por entidad)
  - [N] services de módulo
  - AuthContext.jsx + useAuth.js
  - components/ui/ (Button, Input, Modal, DataTable)
  - DeveloperFooter.jsx (branding JR Digital Solutions)
React Bits aplicados:
  - [listar componentes usados o "ninguno" si no se usaron]
Para correr: cd frontend/{project}-web && npm install && npm run dev
→ Siguiente: FASE 4 — IntegrationAgent (conectar Axios + JWT)
```

---

## OUTPUT JSON

```json
{
  "status": "completed",
  "agent": "FrontendAgent",
  "scope": "v1",
  "files_generated": [
    "frontend/{project}-web/src/App.jsx",
    "frontend/{project}-web/src/main.jsx",
    "frontend/{project}-web/src/layouts/MainLayout.jsx",
    "frontend/{project}-web/src/layouts/AuthLayout.jsx",
    "frontend/{project}-web/src/components/ui/"
  ],
  "pages_count": 0,
  "services_count": 0,
  "react_bits_used": [],
  "design_system_read": false,
  "state_updates": {
    "phases.frontend": "completed",
    "lastAgent": "FrontendAgent"
  },
  "errors": [],
  "next_agent": "IntegrationAgent"
}
```

---
applyTo: "**/*.jsx,**/*.tsx,**/*.js,**/*.ts"
---

# Convenciones React 18 + Vite 5 — Stack del Proyecto

> Cargado automáticamente al editar archivos React/JavaScript/TypeScript.
> Incluye lecciones aprendidas de proyectos reales del sistema.

---

## Estado inicial — SIEMPRE inicializar

```javascript
// ✅ Listas → array vacío (nunca undefined)
const [clientes, setClientes] = useState([]);

// ✅ Objetos opcionales → null
const [usuario, setUsuario] = useState(null);

// ✅ Render defensivo con optional chaining
{clientes?.map(c => <div key={c.id}>{c.nombre}</div>)}

// ❌ NUNCA — Cannot read properties of undefined (reading 'map')
const [clientes, setClientes] = useState();   // undefined → crash en render
```

---

## Axios — instancia global con interceptor JWT

```javascript
// services/api.js — ÚNICA instancia en todo el proyecto
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5159/api',  // ← puerto del backend
});

// Auto-adjuntar token en CADA request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 → redirect a login automático
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

**Regla:** NUNCA `import axios from 'axios'` directamente en componentes. Siempre importar desde `services/api.js`.

---

## Notificaciones — react-hot-toast (nunca alert())

```javascript
import toast from 'react-hot-toast';

// ✅ Éxito
toast.success('Cliente creado exitosamente');

// ✅ Error
toast.error('Error al cargar los datos');

// ✅ Loading
const id = toast.loading('Guardando...');
toast.dismiss(id);

// ❌ NUNCA
alert('Cliente creado');   // bloquea el thread, UX terrible
```

---

## Providers en main.jsx — orden correcto

```jsx
// ✅ main.jsx
import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
      <Toaster position="top-right" />
    </AuthProvider>
  </BrowserRouter>
);

// ❌ NUNCA — App sin BrowserRouter → useNavigate() crash
ReactDOM.createRoot(...).render(<App />);
```

---

## Formularios — inputs hidden y null binding

```jsx
// ❌ PROBLEMA: input hidden con value={null} → el backend recibe "null" string
<input type="hidden" name="clienteId" value={clienteId} />

// ✅ CORRECTO: siempre string vacío o valor real
<input type="hidden" name="clienteId" value={clienteId ?? ''} />

// ✅ Alternativa: enviar como JSON en el body (no form-data)
await api.post('/clientes', { clienteId, ...data });
```

---

## GSAP — Animaciones

```javascript
// ✅ En React: siempre con useGSAP y cleanup
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const containerRef = useRef(null);

useGSAP(() => {
  gsap.from('.card', {
    opacity: 0,
    y: 20,
    stagger: 0.1,
    ease: 'power2.out'
  });
}, { scope: containerRef });

// ❌ NUNCA gsap fuera de useGSAP en React — memory leaks
gsap.to('.card', { opacity: 1 });   // sin cleanup → memory leak
```

---

## React Router — navegación programática

```javascript
// ✅ Siempre useNavigate()
const navigate = useNavigate();
navigate('/clientes');

// ❌ NUNCA
window.location.href = '/clientes';  // pierde el estado de React
```

---

## Estructura de carpetas

```
src/
├── pages/          ← Una página por módulo (route)
├── components/     ← UI reutilizables (Tailwind)
├── services/
│   ├── api.js      ← Instancia Axios + interceptores JWT
│   └── {modulo}Service.js  ← Un archivo por módulo
├── layouts/        ← MainLayout, AuthLayout
└── hooks/          ← useAuth, useClientes, etc.
```

---

## Sin console.log en producción

```javascript
// ❌ NUNCA en código de producción
console.log('data:', data);
console.debug('response:', response);

// ✅ Si necesitas debug temporal: comentar o usar condición de entorno
if (import.meta.env.DEV) console.log('debug:', data);
```

---

## Performance básico

```javascript
// ✅ React.memo para componentes que reciben mismas props frecuentemente
export const AgentCard = React.memo(({ agent }) => { ... });

// ✅ useCallback para handlers pasados como props
const handleDelete = useCallback((id) => {
  deleteCliente(id);
}, []);

// ✅ Lazy loading de páginas
const ClientesPage = React.lazy(() => import('./pages/ClientesPage'));
```

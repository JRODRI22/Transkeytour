# rules/react — Convenciones React 18 + Vite 5 + Tailwind

Aplica a: FrontendAgent, IntegrationAgent, DebugAgent, ReviewAgent al revisar código React

---

## Estructura de carpetas

```
frontend/{project}-web/src/
├── pages/          ← Una página por módulo (React Router routes)
├── components/     ← UI base (Tailwind) — componentes reutilizables
├── services/       ← Un archivo por módulo de API
│   └── api.js      ← Instancia Axios + interceptor JWT global
├── layouts/        ← MainLayout, AuthLayout
└── hooks/          ← Custom hooks (useClientes, useAuth)
```

## Servicios

- Un service por módulo: `clientesService.js`, `facturaService.js`, `productosService.js`
- Importar instancia Axios de `services/api.js` — nunca `import axios from 'axios'` directamente
- Funciones exportadas nombradas: `export const getClientes = async () => {...}`
- Siempre `try/catch` en las funciones de service — propagar error limpio (no stack trace crudo)

## Axios + JWT

- Interceptor de request en `services/api.js` que auto-agrega `Authorization: Bearer {token}`
- Interceptor de response para 401 → redirect a `/login` y limpiar localStorage
- Token en `localStorage.getItem('token')` — nunca en variables de módulo global
- Global error handler: 500 → toast de error, 401 → redirect login

## Componentes y estilos

- TailwindCSS para TODOS los estilos — mínimo CSS personalizado salvo casos especiales
- Componentes funcionales con hooks — nunca class components
- Nombres de componentes en PascalCase: `ClienteListPage`, `FacturaForm`
- Props tipadas (PropTypes o JSDoc) en componentes reutilizables/shared
- Sin `console.log` en código de componentes — usar el hook de debug o eliminarlo

## UX — Feedback al usuario

- `react-hot-toast` para TODOS los mensajes de success/error/warning — no `alert()`
- Loading states en operaciones async: spinner o skeleton, nunca pantalla en blanco
- Confirmación antes de operaciones destructivas (eliminar) — modal o confirm dialog
- Formularios: validación client-side + mostrar errores inline (no solo alert)

## React Router

- Rutas definidas en un solo archivo de configuración o en `App.jsx`
- Rutas protegidas con componente `<ProtectedRoute>` que verifica token
- Rutas de admin con verificación de rol además del token
- `useNavigate()` para navegación programática — no `window.location.href`

## Performance

- `React.memo()` en componentes que reciben las mismas props frecuentemente
- `useCallback` en handlers pasados como props a componentes hijos
- `useMemo` en cálculos derivados costosos (no en cada valor)
- Lazy loading de rutas/páginas con `React.lazy()` + `Suspense`

## Paquetes estándar

| Paquete | Uso |
|---|---|
| `axios` | HTTP client |
| `react-router-dom` v6+ | Routing |
| `react-hot-toast` | Notificaciones |
| `tailwindcss` v3 | Estilos |
| `@heroicons/react` | Iconos (alternativa: `lucide-react`) |

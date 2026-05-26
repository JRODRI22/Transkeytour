---
applyTo: "frontend/**/services/**,frontend/**/api.js"
description: "Fase 4: genera services/api.js (Axios + interceptor JWT global) y authService.js conectando frontend con el backend."
---

# IntegrationAgent — Fase 4

## Activación automática
Se activa cuando `frontend/src/` existe pero `frontend/src/services/api.js` **no existe todavía**.
También por keywords: "integración", "conectar", "JWT", "Axios", "login", "auth".

**Skills auto-cargados:** `systematic-debugging`

---

## Contrato INPUT / OUTPUT (Agent Teams Lite)

### INPUT (recibido del OrchestratorAgent)
```json
{
  "routes_md": "contenido de docs/ROUTES.md (especialmente la secci\u00f3n de auth endpoints)",
  "backend_port": "puerto del backend desde PROJECT.md \u00a75",
  "context": "phases.frontend == done, frontend/src/services/api.js no existe"
}
```

### OUTPUT (retornado al OrchestratorAgent)
```json
{
  "agent": "IntegrationAgent",
  "status": "done | error",
  "files_generated": ["frontend/src/services/api.js", "frontend/src/services/authService.js"],
  "errors": [],
  "next_suggested": "ReviewAgent",
  "state_updates": { "phases.integration": "done" }
}
```

> **Regla:** Al completar, retorna el OUTPUT JSON al OrchestratorAgent y **DETENTE**.

---

> Una vez generado `api.js`, el JWT flow queda completo y el frontend puede comunicarse con el backend.

## [OBLIGATORIO] Al activarte
1. **Primer paso siempre:** `log_agent_run({agent_name: "IntegrationAgent", status: "started", project_name, phase: "integration", trigger_reason: "api.js solicitado"})` ← [MCP log_agent_run]

---

## Antes de iniciar
1. Confirma que FASE 2 (BackendAgent) y FASE 3 (FrontendAgent) están `✅ Done`.
2. Lee `PROJECT.md` sección 5 para obtener puerto del backend.
3. Lee `docs/ROUTES.md` para entender los endpoints de auth.

---

## Archivos a generar / modificar

### `frontend/src/services/api.js` — instancia Axios + interceptor JWT

```js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — adjunta JWT automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — manejo de errores global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (error.response?.status >= 500) {
      import('react-hot-toast').then(({ default: toast }) =>
        toast.error('Error del servidor. Intenta de nuevo.')
      );
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

### `frontend/src/services/authService.js` — login / logout / refresh

```js
import api from './api';

export const authService = {
  // POST /api/auth/login
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    // data.token — JWT access token
    // data.user  — info del usuario
    return data;
  },

  // POST /api/auth/refresh (si el backend lo implementa)
  refresh: async () => {
    const { data } = await api.post('/auth/refresh');
    return data;
  },
};
```

---

### `frontend/src/pages/LoginPage.jsx` — formulario de login completo

```jsx
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async ({ email, password }) => {
    try {
      const { token } = await authService.login(email, password);
      login(token);
      toast.success('Bienvenido');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Credenciales inválidas';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Iniciar sesión</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Correo</label>
            <input type="email"
              {...register('email', { required: 'Requerido' })}
              className="mt-1 block w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="usuario@ejemplo.com" />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input type="password"
              {...register('password', { required: 'Requerido', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })}
              className="mt-1 block w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
            {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {isSubmitting ? 'Iniciando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

### `frontend/.env.development`
```env
VITE_API_URL=http://localhost:5000/api
```

### `frontend/.env.production`
```env
VITE_API_URL=https://api.tudominio.com/api
```

---

## Verificación de integración

Después de generar, verificar que:
```
[ ] api.js está en frontend/src/services/
[ ] El interceptor adjunta Authorization: Bearer {token} en cada request
[ ] El interceptor redirige a /login en 401
[ ] LoginPage guarda el token en localStorage via useAuth().login()
[ ] Los services de módulo importan de './api' (no de 'axios' directo)
[ ] .env.development tiene VITE_API_URL correcto
[ ] Logout limpia localStorage y redirige a /login
```

---

## Formato de salida al completar

```
✅ FASE 4 COMPLETADA — IntegrationAgent
Archivos generados/actualizados:
  - frontend/src/services/api.js (Axios + interceptores)
  - frontend/src/services/authService.js
  - frontend/src/pages/LoginPage.jsx (actualizado con flow real)
  - frontend/.env.development
  - frontend/.env.production
→ Siguiente: FASE 5 — ReviewAgent
```

---

## OUTPUT JSON

```json
{
  "status": "completed",
  "agent": "IntegrationAgent",
  "files_generated": [
    "frontend/src/services/api.js",
    "frontend/src/services/authService.js",
    "frontend/src/pages/LoginPage.jsx",
    "frontend/.env.development",
    "frontend/.env.production"
  ],
  "jwt_interceptor": true,
  "global_error_handler": true,
  "state_updates": {
    "phases.integration": "completed",
    "lastAgent": "IntegrationAgent"
  },
  "errors": [],
  "next_agent": "ReviewAgent"
}
```

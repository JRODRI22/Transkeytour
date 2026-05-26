# SKILL: React — Errores de estado, contexto y Axios
> [SKILL EVOLUCIONADA — generada por EvolutionAgent en 2026-04-03]
> Origen: 4 lecciones de proyectos React/Vite reales (Charlotte Fashion, ContaFlowCR)

## Cuándo aplicar
Al generar componentes React, el archivo `api.js`, o al configurar providers en `main.jsx`.
Al depurar errores de frontend con DebugAgent.

## Lo que NO hacer (antipatrones)

```javascript
// ❌ Estado no inicializado → Cannot read properties of undefined (reading 'map')
const [clientes, setClientes] = useState();  // undefined, no array

// ❌ Provider ausente → useContext must be inside Provider
// main.jsx sin envolver App
ReactDOM.createRoot(...).render(<App />)  // sin AuthProvider, BrowserRouter

// ❌ baseURL incorrecta → Network Error / ERR_NETWORK sin detalle útil
const api = axios.create({ baseURL: 'http://localhost:3000/api' });  // puerto incorrecto

// ❌ Puerto ocupado sin verificar
// → EADDRINUSE: address already in use :::5173
```

## Lo que SÍ hacer (patrón correcto)

```javascript
// ✅ Estado siempre inicializado como array vacío para listas
const [clientes, setClientes] = useState([]);  // nunca undefined
const [usuario, setUsuario] = useState(null);  // null para objetos opcionales

// ✅ Optional chaining defensivo en renders
{clientes?.map(c => <div key={c.id}>{c.nombre}</div>)}

// ✅ main.jsx — providers en orden correcto (router > auth > app)
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);

// ✅ services/api.js — baseURL desde variable de entorno o constante documentada
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5159/api'
});
// El puerto 5159 debe coincidir con el puerto del backend en appsettings.json
```

```bash
# ✅ Puerto 5173 ocupado → liberar o cambiar
netstat -ano | findstr :5173
taskkill /PID [PID] /F

# O en vite.config.js:
export default defineConfig({
  server: { port: 5174 }  // puerto alternativo
})
```

## Por qué importa
- `useState()` sin valor inicial → primer render intenta `.map()` sobre `undefined` → crash inmediato
- Provider faltante → error críptico que no indica el componente específico que lo necesita
- `baseURL` incorrecta → "Network Error" sin detalle, muy difícil de diagnosticar
- El stack .NET backend corre en **5159** por defecto (no 3000, no 8080)

## Aplicable en
- [ ] Agent: BackendAgent (03)
- [x] Agent: FrontendAgent (04)
- [x] Agent: IntegrationAgent (05)
- [x] Agent: DebugAgent (10)

## Severity: high | Scope: stack | Type: pattern

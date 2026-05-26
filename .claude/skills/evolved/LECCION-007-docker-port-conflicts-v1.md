# LECCION-007: Docker & Puerto Conflicts
**Versión:** v1  
**Tipo:** bugfix  
**Severidad:** medium  
**Agentes que aplican:** DevOpsAgent, DebugAgent, BackendAgent, FrontendAgent  
**Fuente:** JarvisDB · ERR-013, ERR-008  
**Creado:** por EvolutionAgent desde lecciones acumuladas  

---

## Problema 1 — `docker-compose up` falla con `port is already allocated`

### Síntoma
```
Error response from daemon: driver failed programming external connectivity on endpoint:
Bind for 0.0.0.0:5159 failed: port is already allocated
```

### Causa raíz
Otro proceso (o container previo no detenido) ya está usando el puerto mapeado en `docker-compose.yml`.

### Solución
```powershell
# 1. Identificar qué proceso usa el puerto
netstat -ano | findstr :5159

# 2a. Terminar el proceso
taskkill /PID <PID> /F

# 2b. O cambiar el puerto en docker-compose.yml (si no puedes liberar el puerto)
ports:
  - "5160:5159"   # host:container — usar puerto host diferente
```

```bash
# Linux / Git Bash
lsof -ti :5159 | xargs kill -9
# O cambiar puerto
```

### Prevention
- Siempre `docker-compose down` antes de `docker-compose up` en pipelines
- Usar `docker-compose down --remove-orphans` cuando hay containers colgados
- Verificar puertos libres antes de levantar: `netstat -ano | findstr :5159`

---

## Problema 2 — Vite: `EADDRINUSE: address already in use :::5173`

### Síntoma
```shell
Error: listen EADDRINUSE: address already in use :::5173
```

### Causa raíz
Una instancia previa de Vite/Node sigue corriendo en el puerto 5173.

### Solución
```powershell
# Windows — encontrar y matar el proceso
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

```bash
# Alternativa: cambiar el puerto en vite.config.js
export default defineConfig({
  server: {
    port: 5174,      // usar puerto alternativo
    host: '0.0.0.0'  // exponer en LAN si es necesario
  }
})
```

---

## Patrones generales para conflictos de puertos

| Situación | Comando |
|-----------|---------|
| Ver qué usa un puerto | `netstat -ano \| findstr :<PORT>` |
| Matar proceso por PID | `taskkill /PID <PID> /F` |
| Ver todos los containers Docker | `docker ps -a` |
| Parar todos los containers | `docker-compose down` |
| Limpiar containers huérfanos | `docker-compose down --remove-orphans` |
| Listar puertos usados por Docker | `docker ps --format "{{.Ports}}"` |

---

## Checklist antes de `docker-compose up`

```
□ docker-compose down --remove-orphans    ← siempre primero
□ netstat -ano | findstr :<PORT>          ← verificar puerto libre
□ Revisar docker-compose.yml ports:      ← confirmar mapeo correcto
□ docker-compose up --build              ← rebuild si cambiaron deps
```

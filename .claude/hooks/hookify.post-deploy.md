---
name: post-deploy-notification
enabled: true
event: bash
action: warn
conditions:
  - field: command
    operator: regex_match
    pattern: docker-compose up|azd up|azd deploy|dotnet ef database update|kubectl apply
---

🚀 **Despliegue detectado — Acciones post-deploy recomendadas**

Se detectó un comando de despliegue o migración exitoso. Antes de cerrar la sesión:

**1. Verificar estado de la aplicación:**
- Confirmar que los contenedores están corriendo: `docker-compose ps`
- Verificar endpoint de salud: `GET /health` o el endpoint raíz de la API

**2. Actualizar estado en el pipeline:**
- Marcar fase `devops` como ✅ Done en `docs/TASKS.md`
- Actualizar `state.json`:  `phases.devops = "done"`

**3. Acciones automáticas pendientes (según `reactions.conf`):**
- **SentinelAgent** verificará consistencia post-deploy si no corrió en esta fase
- **SecurityAgent** se activará automáticamente si es la primera vez que la app está desplegada
- **MemorySyncAgent** guardará el estado de esta fase

**4. Si es despliegue a producción:**
- Hacer backup de la BD antes de ejecutar migraciones nuevas
- Registrar la versión en `docs/CHANGELOG.md`

---
*Este hook es informativo — no bloquea el despliegue.*

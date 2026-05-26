---
applyTo: "**"
description: "On-demand: recomienda APIs externas desde el registro interno (100+ APIs, 14 categorías). Activa con \"qué API uso para\", \"API externa\"."
---

# APIDiscoveryAgent (14) — Descubrimiento de APIs

## Rol
Recomendar APIs externas del registro `.claude/api-registry.md` según el objetivo del proyecto.
Proporcionar ejemplos de integración listos para el stack (.NET / React).

## Trigger
- Keywords: "API externa", "integración third-party", "webhook", "scraping", "qué API uso para", "automatización externa", "conectar con servicio"

## Protocolo

### 1. Leer api-registry.md
```
- Leer .claude/api-registry.md
- Identificar categorías relevantes para el query del usuario
```

### 2. Filtrar por caso de uso
Mapear el objetivo a categorías:
| Objetivo | Categorías relevantes |
|----------|----------------------|
| Envío de emails | Communication |
| Pagos / cobros | Payments |
| Autenticación externa | Auth |
| Geolocalización | Maps & Geolocation |
| Notificaciones push | Communication |
| Automatización de procesos | Automation |
| Scraping / extracción de datos | Data Extraction |
| Inteligencia artificial | AI & ML |
| Almacenamiento de archivos | Storage |
| Monitoreo / alertas | Monitoring |

### 3. Generar recomendaciones

Para cada API recomendada:
```markdown
## [Nombre API] — [Categoría]
**URL:** https://...
**Documentación:** https://...
**Caso de uso:** [Para qué sirve en este proyecto]
**Integración (.NET):**
```csharp
// Ejemplo mínimo de uso
```
**Integración (React):**
```javascript
// Ejemplo mínimo de uso
```
**Notas:** [Limitaciones, pricing, alternativas]
```

### 4. Registrar en el proyecto (si se solicita)

Si el usuario confirma usar una API, agregar a CLAUDE-decisions.md:
```
ADR-XXX — Usar [API Name] para [objetivo]
Decisión: [nombre] sobre alternativas [lista]
Razón: [por qué esta]
```

## OUTPUT JSON

```json
{
  "status": "completed",
  "agent": "APIDiscoveryAgent",
  "query": "[objetivo buscado]",
  "category": "[categoría detectada]",
  "recommendations": [
    {
      "name": "Nombre API",
      "category": "Payments",
      "url": "https://...",
      "use_case": "Descripción de uso"
    }
  ],
  "count": 3,
  "summary": "Encontradas 3 APIs para [objetivo]",
  "files_generated": [],
  "state_updates": {},
  "errors": [],
  "next_suggested": null
}
```

## Reglas
- Máximo 5 recomendaciones por query (calidad sobre cantidad)
- Siempre incluir alternativa gratuita cuando exista
- Incluir ejemplos de .NET Y React (este proyecto usa ambos)
- NO recomendar APIs de las que no hay datos en api-registry.md
- Retornar OUTPUT JSON y DETENERSE

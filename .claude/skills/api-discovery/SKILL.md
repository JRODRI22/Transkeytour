# api-discovery — Skill de Descubrimiento de APIs

## Propósito
Guía al APIDiscoveryAgent para buscar, evaluar y recomendar APIs externas del registro.

## Cuándo se activa
Cuando el usuario menciona:
- "API externa", "integración third-party"
- "webhook", "scraping", "datos externos"
- "qué API uso para", "automáticamente con"
- "enviar email", "procesar pagos", "notificaciones push"
- "mapas", "geolocalización", "autenticación social"

## Protocolo de descubrimiento

### Paso 1 — Identificar el objetivo
```
Usuario: "quiero agregar envío de emails al proyecto"
→ Categoría: Communication & Email
→ Subcategoría: Email transaccional
→ Stack: .NET backend + React frontend
```

### Paso 2 — Leer el registro
```
Archivo: .claude/api-registry.md
→ Sección: Communication & Email
→ Filtrar: APIs con tier gratuito (si aplica)
→ Filtrar: APIs con SDK .NET disponible
```

### Paso 3 — Comparar opciones

Para cada candidata evaluar:
| Criterio | Peso |
|----------|------|
| Tier gratuito disponible | Alto |
| SDK oficial .NET | Alto |
| SDK oficial React/JS | Medio |
| Facilidad de integración | Medio |
| Documentación clara | Medio |
| Confiabilidad / uptime | Alto |

### Paso 4 — Generar ejemplo de integración

**Formato para .NET (NuGet):**
```csharp
// 1. Instalar: dotnet add package [NuGET]
// 2. appsettings.json:
"EmailSettings": {
  "ApiKey": "YOUR_KEY",
  "From": "noreply@tudominio.com"
}
// 3. ServiceExtensions.cs:
services.AddTransient<IEmailService, EmailService>();
// 4. EmailService.cs — ejemplo mínimo funcional
```

**Formato para React/JS (npm):**
```javascript
// 1. Instalar: npm install [package]
// 2. services/emailService.js — ejemplo mínimo
import api from './api';
export const sendEmail = (data) => api.post('/email/send', data);
```

### Paso 5 — Registrar decisión (si se confirma usar)

Cuando el usuario confirma una API, agregar a `CLAUDE-decisions.md`:
```
ADR-NNN — Usar [API] para [objetivo]
Fecha: [hoy]
Estado: Aprobado
Contexto: Necesitamos [funcionalidad] en el proyecto
Decisión: Usar [API seleccionada] vs alternativas [lista]
Razón: [precio / SDK / facilidad / tier gratuito]
```

## Reglas de calidad

- Siempre incluir opción gratuita cuando exista
- Incluir TANTO ejemplo .NET COMO React (el proyecto usa los dos)
- Máximo 3-5 opciones por query (no abrumar)
- Mencionar trade-offs claramente
- Para proyectos en Costa Rica: preferir APIs con soporte LATAM
- Si se requiere Hacienda/BCCR: referir a sección "Costa Rica" del registro

## Integraciones pre-verificadas para este stack

Las siguientes APIs tienen integración verificada en .NET 8 + React 18:

| API | NuGet | npm | Verificado |
|-----|-------|-----|------------|
| Stripe | `Stripe.net` | `@stripe/stripe-js` | ✅ |
| SendGrid | `SendGrid` | `@sendgrid/mail` | ✅ |
| Resend | `Resend` | `resend` | ✅ |
| Twilio | `Twilio` | `twilio` | ✅ |
| Cloudinary | `CloudinaryDotNet` | `cloudinary-react` | ✅ |
| Sentry | `Sentry.AspNetCore` | `@sentry/react` | ✅ |
| Auth0 | `Auth0.AspNetCore.Authentication` | `@auth0/auth0-react` | ✅ |
| Firebase | `FirebaseAdmin` | `firebase` | ✅ |

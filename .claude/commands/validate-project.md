---
description: Valida PROJECT.md antes de arrancar el pipeline - 7 checks (secciones, entidades, puertos, conexión)
---

# /validate-project

Ejecuta **7 checks de pre-vuelo** sobre el archivo `PROJECT.md` antes de que el OrchestratorAgent lance el ArchitectAgent. Detecta errores comunes que causarían fallos costosos más adelante en el pipeline.

---

## Cuándo usar este comando

- Antes de escribir `"arranca el proyecto"` por primera vez
- Después de modificar `PROJECT.md` manualmente
- Si el ArchitectAgent se queja de información incompleta

---

## Los 7 Checks

### Check 1 — Secciones obligatorias presentes

Verifica que `PROJECT.md` contiene exactamente las 5 secciones requeridas:

| Sección esperada | Resultado si falta |
|-----------------|-------------------|
| `## 1. Descripción general` | ❌ ArchitectAgent no puede determinar el dominio del proyecto |
| `## 2. Entidades principales` | ❌ DatabaseAgent no puede generar schema.sql |
| `## 3. Funcionalidades v1` | ❌ TASKS.md quedará vacío |
| `## 4. Reglas de negocio` | ⚠️ BackendAgent puede generar lógica incorrecta |
| `## 5. Configuración` | ❌ FrontendAgent y IntegrationAgent no sabrán los puertos |

**Cómo corregir:** Copiar el template de `CLAUDE.md §2` y llenar las secciones faltantes.

---

### Check 2 — Sin nombres de entidad reservados en C#

Verifica que ninguna entidad en `## 2.` usa palabras reservadas del lenguaje o .NET Framework:

**Nombres prohibidos:** `System`, `Object`, `String`, `Task`, `Thread`, `Event`, `Action`, `Type`, `Class`, `Record`, `Base`, `Model`, `Service`, `Controller`, `Context`, `Extension`

**Por qué falla:** BackendAgent generará nombres de clase que colisionan con tipos de .NET, causando errores de compilación en el backend.

**Cómo corregir:** Renombrar la entidad. Ejemplo: `Sistema` → `SistemaInventario`, `Evento` → `EventoCalendario`

---

### Check 3 — Sin entidades duplicadas

Verifica que no hay nombres de entidad repetidos en `## 2.`

**Por qué falla:** DatabaseAgent generará tablas duplicadas y BackendAgent generará clases con el mismo nombre, causando errores de compilación.

**Cómo corregir:** Consolidar las entidades duplicadas o diferenciarlas con nombres más específicos.

---

### Check 4 — Puertos configurados correctamente

Verifica en `## 5. Configuración` que los campos de puerto están presentes:

| Campo | Valor esperado |
|-------|----------------|
| `Puerto backend:` | Número de puerto válido (1024–65535), recomendado `5159` |
| `Puerto frontend:` | Número de puerto válido, recomendado `5173` |

**Por qué falla:** DevOpsAgent configurará Dockerfiles con puerto `0` o variable sin reemplazar. FrontendAgent no sabrá dónde apunta la API.

**Cómo corregir:**
```markdown
## 5. Configuración
Puerto backend:  5159
Puerto frontend: 5173
```

---

### Check 5 — Connection string válida

Verifica que el campo `Connection:` en `## 5.` contiene los componentes mínimos:

| Componente | Ejemplo |
|-----------|---------|
| `Server=` | `Server=localhost` |
| `Database=` | `Database=MiApp` |

**Por qué falla:** DatabaseAgent y BackendAgent usarán el string tal cual. Un string incompleto hará que la app falle al conectar en el primer arranque.

**Cómo corregir:**
```markdown
Connection: Server=localhost;Database=MiApp;Trusted_Connection=True;TrustServerCertificate=True;
```

---

### Check 6 — Reglas de negocio no vacías

Verifica que `## 4. Reglas de negocio importantes` tiene al menos una regla real (no el placeholder del template).

**¿Qué es un placeholder?** Líneas que contienen solo `-` sin contenido, o la frase exacta `[Agrega tus reglas aquí]`.

**Por qué importa:** BackendAgent usa las reglas de negocio para generar validaciones en Services. Sin reglas, la capa de negocio quedará vacía.

**Cómo corregir:** Escribir al menos una regla. Incluso algo tan simple como:
```markdown
## 4. Reglas de negocio importantes
- Solo usuarios con rol Admin pueden eliminar registros
- El campo Email debe ser único en la tabla Usuarios
```

---

### Check 7 — Nombre de proyecto sin espacios

Verifica que el nombre del proyecto en la primera línea del `PROJECT.md` (el `#` H1 title) no contiene espacios.

**Por qué falla:** BackendAgent usa el nombre del proyecto para nombrar el namespace y el `.csproj`. Un nombre con espacios requeriría comillas en todo el código y fallaría en `dotnet new`.

**Cómo corregir:** Usar PascalCase o guiones:
- ❌ `# Sistema de Inventario JR`
- ✅ `# SistemaInventarioJR`
- ✅ `# sistema-inventario-jr`

---

## Output del comando

Después de ejecutar los 7 checks, el sistema mostrará:

```
╔════════════════════════════════════════╗
║   /validate-project — Resultados       ║
╚════════════════════════════════════════╝

Check 1 — Secciones obligatorias    ✅  5/5 secciones presentes
Check 2 — Nombres de entidad        ✅  Sin nombres reservados
Check 3 — Entidades duplicadas      ✅  Sin duplicados
Check 4 — Puertos configurados      ✅  Backend: 5159 / Frontend: 5173
Check 5 — Connection string         ✅  Server= y Database= presentes
Check 6 — Reglas de negocio         ✅  3 reglas encontradas
Check 7 — Nombre sin espacios       ❌  "Sistema de Facturacion" tiene espacios

══════════════════════════════════════════
Resultado: 6/7 checks pasados
❌ 1 problema bloqueante detectado

ACCIÓN REQUERIDA:
→ Check 7: Cambia el título H1 de PROJECT.md a "SistemaFacturacion" (sin espacios)
```

Si todos los checks pasan:
```
✅ PROJECT.md listo — puedes proceder con "arranca el proyecto"
```

---

## Integración con el pipeline

Cuando el usuario escribe `/validate-project`, el OrchestratorAgent:
1. Lee `PROJECT.md` del directorio actual
2. Ejecuta los 7 checks internamente (sin subagente)
3. Reporta resultado al usuario
4. **Si hay ❌:** No lanza ArchitectAgent — espera correcciones
5. **Si todo es ✅:** Confirma que puede proceder con `"arranca el proyecto"`

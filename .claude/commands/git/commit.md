# /commit — Git Commit con Mensaje Convencional

Genera un commit semántico automático siguiendo el estándar [Conventional Commits](https://www.conventionalcommits.org/).

## Uso
```
/commit
/commit "descripción opcional del cambio"
```

## Lo que hace

### Paso 1 — Analizar cambios
```bash
git status
git diff --staged
git diff
```

Si no hay archivos staged, stagear automáticamente los archivos modificados:
```bash
git add -A
```

### Paso 2 — Determinar el tipo de commit

Analizar los archivos cambiados y determinar el tipo:

| Tipo | Cuándo usar | Ejemplo |
|------|-------------|---------|
| `feat` | Nueva funcionalidad | `feat: agregar módulo de facturación` |
| `fix` | Bug corregido | `fix: corregir cálculo de IVA en líneas` |
| `refactor` | Refactoring sin cambio de comportamiento | `refactor: extraer servicio de cálculo` |
| `docs` | Solo documentación | `docs: actualizar ROUTES.md con endpoints nuevos` |
| `chore` | Tareas de mantenimiento, deps | `chore: actualizar EF Core a 8.0.11` |
| `test` | Agregar/modificar tests | `test: agregar tests de ClienteService` |
| `style` | Formato, espacios (sin lógica) | `style: formatear archivos de Controllers` |
| `perf` | Mejoras de rendimiento | `perf: agregar índice en tabla Clientes` |
| `security` | Fix de seguridad | `security: agregar validación en LoginRequest` |

### Paso 3 — Generar mensaje de commit

Formato:
```
{tipo}({scope}): {descripción corta en imperativo, ≤72 chars}

{body opcional — qué y por qué, NO cómo}

{footer opcional — Breaking changes o refs a issues}
```

Ejemplos:
```
feat(clientes): agregar endpoint de exportación a Excel

Agrega GET /api/clientes/exportar que retorna .xlsx con todos los clientes
activos. Usa EPPlus 7 para generación.

fix(auth): corregir validación de JWT expirado en refresh endpoint

El token de refresh no se estaba validando correctamente cuando el
access token estaba expirado. Ahora retorna 401 en lugar de 500.
```

### Paso 4 — Confirmar con el usuario

Mostrar el mensaje propuesto:
```
📝 Commit propuesto:
─────────────────────────────────────
{mensaje completo generado}
─────────────────────────────────────
¿Confirmar? [S/n]
```

Si el usuario confirma → ejecutar:
```bash
git commit -m "{mensaje}"
```

### Paso 5 — Confirmar éxito
```
✅ Commit creado: {hash corto}
{tipo}({scope}): {descripción}

Siguiente: /commit-push-pr para subir y crear PR, o sigue trabajando.
```

## Reglas
- **Nunca** hacer commit sin confirmación del usuario
- **Nunca** incluir archivos de secrets, .env, appsettings con credenciales
- Si hay archivos no relacionados en el diff, preguntar al usuario si incluirlos
- Mensajes en **español** si el proyecto es en español, **inglés** si es en inglés

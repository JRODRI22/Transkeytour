---
name: diagnose-ci-failures
description: Diagnose CI/CD failures for a PR using GitHub CLI, extract error logs from failed builds, and generate a plan to fix them. Use when the user asks to check CI status, pull CI issues, triage build failures, investigate failing GitHub Actions runs, or when dotnet build / npm run build fails in CI for a .NET + React project.
---

# diagnose-ci-failures

Diagnostica fallos de CI para un PR usando GitHub CLI, extrae logs de errores y genera
un plan para resolverlos. Siempre produce un plan primero — nunca modifica código directamente.

## Overview

Este skill provee un workflow determinístico para verificar el estado de CI de un PR,
extraer logs de fallos, analizar errores y crear un plan de resolución. El output
siempre es un documento de plan que puede revisarse antes de ejecutar.

## Workflow

### 1. Verificar que existe un PR para la rama actual

```bash
# Obtener rama actual
rtk git branch --show-current

# Verificar si hay PR
gh --no-pager pr view <branch-name> --json number,title,url,state
```

Si no existe PR, informar al usuario y ofrecer crear uno usando `create-pr` o el
CIPipelineAgent.

### 2. Verificar estado de CI

```bash
gh pr view <branch-name> --json statusCheckRollup
```

Parsear el output para identificar:
- Checks completados vs en progreso
- Checks exitosos
- Checks fallidos con sus nombres y URLs de detalle

Si CI aún está corriendo, informar qué checks ya fallaron o pasaron y cuáles
están en progreso.

### 3. Extraer logs de fallos

Para cada check fallido, obtener los logs usando el run ID:

```bash
gh run view <run-id> --log-failed
```

Enfocarse en extraer:
- Mensajes de error y sus ubicaciones (file paths, line numbers)
- Errores de compilación .NET (`dotnet build` failures)
- Errores de linting/warnings elevados a error
- Mensajes de fallos de tests con stack traces
- Errores de build de frontend (`npm run build` failures)

### 4. Categorizar errores

Agrupar errores por tipo:

- **Errores de compilación .NET**: type errors, referencias faltantes, signature mismatches
  ```bash
  gh run view <run-id> --log-failed 2>&1 | Select-String "error CS"
  ```
- **Fallos de tests xUnit**: tests fallidos con sus nombres y razones
  ```bash
  gh run view <run-id> --log-failed 2>&1 | Select-String "FAILED|Error|Exception"
  ```
- **Errores de build frontend**: TypeScript/Vite errors
  ```bash
  gh run view <run-id> --log-failed 2>&1 | Select-String "error TS|error:|ERROR"
  ```
- **Problemas de migración EF Core**: migration failures
- **Issues específicos de plataforma**: Windows vs Linux differences

### 5. Verificar localmente antes de proponer fix

Reproducir el fallo localmente antes de proponer el fix:

```bash
# Backend
cd backend/{Project}.API
dotnet build
dotnet test

# Frontend
cd frontend/{project}-web
npm run build
```

### 6. Generar plan de fix

Crear un plan documento con:
- **Problem Statement**: Resumen de qué checks fallan y por qué
- **Current State**: Qué errores se encontraron y dónde
- **Proposed Changes**: Fixes específicos para cada categoría de error
- **Validation Steps**: Comandos para verificar los fixes

**IMPORTANTE**: Presentar el plan al usuario antes de hacer cualquier code change.

## Common CI Check Names (GitHub Actions .NET + React)

- `Build Backend (.NET 8)` — `dotnet build`
- `Test Backend` — `dotnet test`
- `Build Frontend` — `npm run build`
- `Test Frontend` — `npm test` / `npx playwright test`
- `EF Migrations Check` — `dotnet ef migrations script`

## Comandos de referencia

**Ver estado de PR con checks:**
```bash
gh --no-pager pr view --json number,title,state,statusCheckRollup
```

**Ver logs de un run fallido específico:**
```bash
gh run view <run-id> --log-failed
```

**Ver runs recientes del repo:**
```bash
gh run list --limit 10
```

**Ver logs de un job específico:**
```bash
gh run view <run-id> --job <job-id> --log
```

**Filtrar errores en logs (PowerShell):**
```powershell
gh run view <run-id> --log-failed | Select-String -Pattern "error|FAILED|Error CS" -Context 2
```

## Notas importantes

- **Siempre crear plan primero**: Nunca hacer code changes directamente. Generar plan para review del usuario
- **Reproducir localmente**: Siempre intentar reproducir el fallo localmente antes de proponer fix
- **Un tipo de error a la vez**: Resolver primero todos los errores de compilación, luego tests
- **Errores de migración**: Nunca aplicar `dotnet ef database update` sin verificar el SQL generado
- **Check específico de Windows**: Los runners de GitHub Actions pueden tener paths diferentes a Windows local

## Related Skills

- `systematic-debugging`
- `verification-before-completion`

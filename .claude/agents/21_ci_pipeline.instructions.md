---
applyTo: "**"
description: "Agente CI/CD: genera GitHub Actions workflows (ci.yml, cd-staging.yml, cd-production.yml) para proyectos .NET + React. Auto-activado cuando DevOpsAgent completa y ci_pipeline.status == null. Skills: systematic-debugging, verification-before-completion, diagnose-ci-failures."
---

# CIPipelineAgent (21) — Pipeline CI/CD Automático

**Número:** 21  
**Rol:** Genera y ejecuta pipelines de Integración Continua y Entrega Continua para proyectos del sistema.  
**Auto-trigger:** Estado `ci_pipeline.status == null` + backend o frontend existen + devops completado.  
**Keywords:** "CI/CD", "pipeline", "GitHub Actions", "ci pipeline", "automatizar deploy",
"workflows", "actions", "integración continua", "entrega continua", "build automático"  
**Skills auto-cargados:** `systematic-debugging`, `verification-before-completion`, `diagnose-ci-failures`

> Cuando un workflow falla en CI, usar `diagnose-ci-failures` primero:
> `gh run view <run-id> --log-failed` → categorizar errores → plan → esperar aprobación antes de modificar workflows.

---

## Contexto de entrada (INPUT)

```json
{
  "project":         "NombreProyecto",
  "project_path":    "ruta/al/proyecto",
  "stack": {
    "backendPort":   5XXX,
    "frontendPort":  5173,
    "dbName":        "NombreDB",
    "connectionString": "..."
  },
  "test_coverage": {
    "backend_pct":   null,
    "frontend_pct":  null,
    "ci_commands":   []           // ← del OUTPUT de TestMasterAgent si ya ejecutó
  },
  "platform":        "github_actions",   // github_actions | azure_devops | local
  "environments": {
    "staging":       "staging.proyecto.com",
    "production":    "proyecto.com"
  }
}
```

---

## Responsabilidades

1. Detectar stack de pruebas existente (xUnit, Jest, Playwright)
2. Generar workflows de CI/CD apropiados para la plataforma
3. Configurar gates de calidad (coverage mínimo, 0 tests fallidos)
4. Integrar con JarvisDB para registrar cada run en `CIRunHistory`
5. Validar que los workflows son sintácticamente correctos

---

## Workflows generados (GitHub Actions)

### Workflow 1: `ci.yml` — Integración Continua (PR + Push a main)

**Ubicación:** `.github/workflows/ci.yml`

**Triggers:**
- `push` a `main`, `develop`
- `pull_request` a `main`

**Jobs:**

```yaml
name: CI — Build, Test, Security

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  DOTNET_VERSION: '8.0.x'
  NODE_VERSION: '20.x'

jobs:
  backend-build-test:
    name: Backend — Build & Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: ${{ env.DOTNET_VERSION }}
      - name: Restore
        run: dotnet restore backend/{PROJECT}.API/{PROJECT}.API.csproj
      - name: Build
        run: dotnet build backend/{PROJECT}.API --no-restore --configuration Release
      - name: Test
        run: |
          dotnet test tests/{PROJECT}.Tests \
            --no-build \
            --configuration Release \
            --logger "trx;LogFileName=backend-results.xml" \
            --collect:"XPlat Code Coverage" \
            --results-directory ./TestResults
      - name: Upload Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: backend-test-results
          path: TestResults/

  frontend-build-test:
    name: Frontend — Build & Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/{project}-web/package-lock.json
      - name: Install
        run: npm ci
        working-directory: frontend/{project}-web
      - name: Lint
        run: npm run lint
        working-directory: frontend/{project}-web
      - name: Test
        run: npm test -- --coverage --watchAll=false
        working-directory: frontend/{project}-web
      - name: Build
        run: npm run build
        working-directory: frontend/{project}-web

  security-scan:
    name: Security — OWASP Dependency Check
    runs-on: ubuntu-latest
    needs: [backend-build-test]
    steps:
      - uses: actions/checkout@v4
      - name: Check Vulnerabilities (Backend)
        run: dotnet list package --vulnerable --include-transitive
        working-directory: backend/{PROJECT}.API
      - name: Check Vulnerabilities (Frontend)
        run: npm audit --audit-level=high
        working-directory: frontend/{project}-web
```

---

### Workflow 2: `cd-staging.yml` — Deploy a Staging (auto en merge a main)

**Ubicación:** `.github/workflows/cd-staging.yml`

**Trigger:** `push` a `main` (después de CI exitoso)

```yaml
name: CD — Deploy to Staging

on:
  push:
    branches: [main]

jobs:
  deploy-staging:
    name: Deploy — Staging
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.{proyecto}.com
    needs: []   # requiere que CI haya pasado (configurar en branch protection)

    steps:
      - uses: actions/checkout@v4

      - name: Build Backend Docker Image
        run: |
          docker build -t {proyecto}-backend:${{ github.sha }} ./backend
          docker tag {proyecto}-backend:${{ github.sha }} {proyecto}-backend:staging

      - name: Build Frontend Docker Image
        run: |
          docker build -t {proyecto}-frontend:${{ github.sha }} ./frontend
          docker tag {proyecto}-frontend:${{ github.sha }} {proyecto}-frontend:staging

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /opt/{proyecto}
            docker compose pull
            docker compose up -d --remove-orphans
            docker compose run --rm backend dotnet {PROJECT}.API.dll ef database update
```

---

### Workflow 3: `cd-production.yml` — Deploy a Producción (manual con gate)

**Ubicación:** `.github/workflows/cd-production.yml`

**Trigger:** Manual (`workflow_dispatch`) + aprobación de environment requerida

```yaml
name: CD — Deploy to Production

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Tag/SHA a desplegar'
        required: true
        default: 'latest'
      confirm:
        description: 'Escribir DEPLOY para confirmar'
        required: true

jobs:
  validate-input:
    runs-on: ubuntu-latest
    steps:
      - name: Validate Confirmation
        run: |
          if [ "${{ github.event.inputs.confirm }}" != "DEPLOY" ]; then
            echo "❌ Confirmación inválida. Escribe exactamente DEPLOY"
            exit 1
          fi

  deploy-production:
    name: Deploy — Production
    runs-on: ubuntu-latest
    needs: [validate-input]
    environment:
      name: production
      url: https://{proyecto}.com

    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.version }}

      - name: Deploy to Production
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/{proyecto}
            git pull origin main
            docker compose -f docker-compose.prod.yml up -d --build
            docker compose run --rm backend dotnet {PROJECT}.API.dll ef database update
            echo "✅ Deploy a producción completado: $(date)"
```

---

## Gates de calidad (branch protection rules)

Documentar en `docs/CI_SETUP.md` las reglas a configurar en GitHub:

```markdown
## Branch Protection — main

Requerimientos antes de merge:
- ✅ CI workflow debe pasar (backend-build-test + frontend-build-test)
- ✅ Security scan debe pasar (0 vulnerabilidades HIGH/CRITICAL)
- ✅ Code coverage backend ≥ 70%
- ✅ Al menos 1 reviewer aprobado
- ✅ No commits directos a main
```

---

## Integración con JarvisDB

Después de cada run exitoso o fallido, registrar en `CIRunHistory`:

```bash
# Registrar resultado de CI en JarvisDB
sqlcmd -S localhost -E -No -Q "
INSERT INTO JarvisDB.dbo.CIRunHistory
  (ProjectName, Platform, Branch, CommitSha, Stage, Status,
   TestsPassed, TestsFailed, TestsCoverage, TriggeredBy)
VALUES
  ('{project}', 'github_actions', '{branch}', '{sha}', 'all', '{status}',
   {passed}, {failed}, {coverage}, 'CIPipelineAgent')
" -b
```

---

## Archivos generados

```
.github/
  workflows/
    ci.yml                   ← CI automático en PR y push
    cd-staging.yml           ← Deploy staging auto en merge a main
    cd-production.yml        ← Deploy producción manual con gate

docs/
  CI_SETUP.md               ← Instrucciones de configuración (secrets, variables)
```

---

## OUTPUT JSON

```json
{
  "status":          "completed",
  "agent":           "CIPipelineAgent",
  "files_generated": [
    ".github/workflows/ci.yml",
    ".github/workflows/cd-staging.yml",
    ".github/workflows/cd-production.yml",
    "docs/CI_SETUP.md"
  ],
  "platform":        "github_actions",
  "workflows_count": 3,
  "gates_configured": true,
  "tokens_estimate": 2500,
  "state_updates": {
    "ci_pipeline.platform":    "github_actions",
    "ci_pipeline.status":      "configured",
    "ci_pipeline.last_run":    null,
    "ci_pipeline.last_commit": null
  },
  "next_steps": [
    "Configurar secrets en GitHub (STAGING_HOST, STAGING_SSH_KEY, PROD_HOST, PROD_SSH_KEY)",
    "Habilitar branch protection rules en main",
    "Primer push a main activará CI automáticamente"
  ]
}
```

---

## Regla de terminación

Este agente genera los archivos de workflow y la documentación, luego **SE DETIENE**.  
No ejecuta los workflows. No modifica código de la aplicación.  
Si detecta errores de sintaxis en los YAML generados → corregir antes de retornar el OUTPUT.

---
applyTo: "**"
description: "Full-stack testing agent: xUnit+Moq (backend), Vitest+RTL (frontend), WebApplicationFactory+MSW (integration), Playwright+k6 (E2E + load). Genera suite de pruebas completa en tests/. Auto-activado post-DevOpsAgent."
---

# TestMasterAgent (19) — Suite de Pruebas Full-Stack

> **Principio:** Ningún proyecto sale a producción sin cobertura verificada.  
> 4 capas de prueba: unitarias, integración API, E2E de usuario, y carga.

---

## Activación automática

- Post-DevOpsAgent cuando `state.test_coverage.backend_pct == null`

**Skills auto-cargados:** `test-driven-development`, `systematic-debugging`
- Keywords: "tests completos", "suite de pruebas", "cobertura total", "E2E", "Playwright", "k6", "testing full-stack"
- Explícito: `/test` o "genera suite de pruebas"

> **Distinción con QAAgent (09):**
> - **TestMasterAgent (19):** Suite completa 4 capas: xUnit+Moq (backend) + Vitest+RTL (frontend) + WebApplicationFactory (integración API) + Playwright (E2E) + k6 (carga). Usar antes de producción.
> - **QAAgent (09):** Solo tests unitarios .NET (xUnit + Moq). Rápido, para un módulo específico.

---

## Contrato INPUT / OUTPUT (Agent Teams Lite)

### INPUT (recibido del OrchestratorAgent)
```json
{
  "project_path": "ruta al proyecto",
  "project_name": "NombreProyecto",
  "backend_port": 5159,
  "entities": ["Cliente", "Producto", "Factura"],
  "services_to_test": ["ClienteService", "FacturaService"],
  "auth": true,
  "backend_path": "backend/{Project}.API/",
  "frontend_path": "frontend/{project}-web/src/",
  "evolved_skills": []
}
```

### OUTPUT (retornado al OrchestratorAgent)
```json
{
  "agent": "TestMasterAgent",
  "status": "done | error",
  "files_generated": [
    "tests/{Project}.Tests/Unit/**",
    "tests/{Project}.Tests/Integration/**",
    "tests/e2e/specs/**",
    "tests/load/k6-baseline.js"
  ],
  "errors": [],
  "next_suggested": null,
  "state_updates": {
    "phases.testing": "done",
    "test_coverage.backend_pct": 75,
    "test_coverage.e2e_scenarios": 5
  },
  "lessons_emitted": []
}
```

---

## Estructura de output

```
tests/
├── {Project}.Tests/
│   ├── {Project}.Tests.csproj
│   ├── Unit/
│   │   ├── Services/
│   │   │   ├── ClienteServiceTests.cs    ← lógica de negocio
│   │   │   └── FacturaServiceTests.cs
│   │   ├── Repositories/
│   │   │   └── ClienteRepositoryTests.cs
│   │   └── Controllers/
│   │       └── ClienteControllerTests.cs
│   └── Integration/
│       ├── TestDbContext.cs              ← SQLite in-memory
│       ├── WebAppFactory.cs             ← WebApplicationFactory
│       ├── ClienteApiTests.cs           ← HTTP real contra ASP.NET Core
│       └── AuthApiTests.cs             ← login / refresh / protected routes
│
├── e2e/
│   ├── playwright.config.ts
│   ├── fixtures/
│   │   └── auth.fixture.ts              ← login + cookie state
│   └── specs/
│       ├── login.spec.ts
│       ├── clientes-crud.spec.ts
│       ├── facturas-flujo.spec.ts
│       └── protectedRoutes.spec.ts
│
└── load/
    ├── k6-baseline.js                   ← smoke test (5 VU, 30s)
    └── k6-stress.js                     ← stress test (50 VU, 5min rampa)
```

---

## CAPA 1 — Unit Tests .NET (xUnit + Moq)

### .csproj mínimo
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <IsPackable>false</IsPackable>
    <Nullable>enable</Nullable>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.9.0" />
    <PackageReference Include="xunit" Version="2.9.2" />
    <PackageReference Include="xunit.runner.visualstudio" Version="2.8.2" />
    <PackageReference Include="Moq" Version="4.20.72" />
    <PackageReference Include="FluentAssertions" Version="6.12.1" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="8.0.11" />
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="..\..\backend\{Project}.API\{Project}.API.csproj" />
  </ItemGroup>
</Project>
```

### Patrón AAA obligatorio para cada test
```csharp
[Fact]
public async Task CrearCliente_ConDatosValidos_RetornaClienteCreado()
{
    // ARRANGE
    var mockRepo = new Mock<IClienteRepository>();
    var sut      = new ClienteService(mockRepo.Object);
    var request  = new CreateClienteRequest("Empresa SA", "empresa@test.com");
    mockRepo.Setup(r => r.CrearAsync(It.IsAny<Cliente>()))
            .ReturnsAsync(new Cliente { Id = Guid.NewGuid(), Nombre = request.Nombre });

    // ACT
    var result = await sut.CrearAsync(request);

    // ASSERT
    result.Should().NotBeNull();
    result.Nombre.Should().Be("Empresa SA");
    mockRepo.Verify(r => r.CrearAsync(It.IsAny<Cliente>()), Times.Once);
}
```

### Escenarios OBLIGATORIOS a cubrir

Para cada Service:
| Test | Propósito |
|------|-----------|
| `CrearX_ConDatosValidos_RetornaXCreado` | Happy path creación |
| `CrearX_ConEmailDuplicado_LanzaException` | Validación de unicidad |
| `ObtenerX_PorIdExistente_RetornaX` | Lectura correcta |
| `ObtenerX_PorIdInexistente_RetornaNull` | Manejo de null |
| `ActualizarX_ExistenteDatosValidos_RetornaActualizado` | Happy path update |
| `EliminarX_IdExistente_MarcaIsDeletedTrue` | Soft delete |
| `ObtenerTodos_ConFiltroIsDeleted_NoRetornaEliminados` | Filtrado soft delete |

Para AuthService:
| Test | Propósito |
|------|-----------|
| `Login_CredencialesCorrectas_RetornaJWT` | Autenticación exitosa |
| `Login_PasswordIncorrecto_LanzaUnauthorized` | Credenciales inválidas |
| `Login_UsuarioInexistente_LanzaUnauthorized` | Usuario no encontrado |
| `RefreshToken_TokenValido_RetornaNuevoJWT` | Refresh exitoso |
| `GenerarJWT_ConClaims_TokenContieneUserId` | Claims en token |

---

## CAPA 2 — Integration Tests .NET (WebApplicationFactory + SQLite)

```csharp
// WebAppFactory.cs
public class WebAppFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Reemplazar DbContext con SQLite in-memory
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (descriptor != null) services.Remove(descriptor);

            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlite("DataSource=:memory:"));

            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.EnsureCreated();
            SeedTestData(db);
        });
    }

    private static void SeedTestData(AppDbContext db)
    {
        db.Clientes.Add(new Cliente { Nombre = "Test SA", Email = "test@test.com" });
        db.SaveChanges();
    }
}
```

```csharp
// ClienteApiTests.cs
public class ClienteApiTests : IClassFixture<WebAppFactory>
{
    private readonly HttpClient _client;
    
    public ClienteApiTests(WebAppFactory factory)
    {
        _client = factory.CreateClient();
        // Auto-auth para rutas protegidas
        var token = TestHelpers.GenerateTestJWT();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);
    }

    [Fact] public async Task GET_Clientes_Returns200WithList() { ... }
    [Fact] public async Task POST_Clientes_ValidBody_Returns201() { ... }
    [Fact] public async Task DELETE_Cliente_SinAuth_Returns401() { ... }
    [Fact] public async Task POST_Login_DatosCorrectos_ReturnsJWT() { ... }
}
```

---

## CAPA 3 — E2E Tests (Playwright + TypeScript)

### playwright.config.ts
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### fixtures/auth.fixture.ts
```typescript
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'admin@test.com');
    await page.fill('[data-testid="password"]', 'Admin1234!');
    await page.click('[data-testid="login-btn"]');
    await expect(page).toHaveURL('/');
    await use(page);
  },
});
```

### Specs obligatorios

#### login.spec.ts
```typescript
test('login con credenciales válidas redirige al dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'admin@test.com');
  await page.fill('[data-testid="password"]', 'Admin1234!');
  await page.click('[data-testid="login-btn"]');
  await expect(page).toHaveURL('/');
  await expect(page.locator('nav')).toBeVisible();
});

test('login con credenciales inválidas muestra error', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'malo@test.com');
  await page.fill('[data-testid="password"]', 'wrong');
  await page.click('[data-testid="login-btn"]');
  await expect(page.locator('[data-testid="error-msg"]')).toBeVisible();
  await expect(page).toHaveURL('/login');
});
```

#### {entidad}-crud.spec.ts — por cada entidad principal
```typescript
test.describe('CRUD {Entidad}', () => {
  test('crear {entidad} exitosamente', async ({ authenticatedPage: page }) => {
    await page.goto('/{entidades}/nuevo');
    // Rellenar campos → submit → verificar toast success + redirect
  });
  test('editar {entidad} existente', async ({ authenticatedPage: page }) => { ... });
  test('eliminar {entidad} muestra confirmación', async ({ authenticatedPage: page }) => { ... });
  test('ruta protegida sin login redirige a /login', async ({ page }) => {
    await page.goto('/{entidades}');
    await expect(page).toHaveURL('/login');
  });
});
```

---

## CAPA 4 — Load Tests (k6)

### k6-baseline.js — Smoke test (5 VU, 30s)
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5159';
const errorRate = new Rate('errors');

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% < 500ms
    errors: ['rate<0.01'],              // <1% errores
  },
};

export function setup() {
  const res = http.post(`${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: 'admin@test.com', password: 'Admin1234!' }),
    { headers: { 'Content-Type': 'application/json' } });
  return { token: res.json('token') };
}

export default function (data) {
  const res = http.get(`${BASE_URL}/api/clientes`, {
    headers: { Authorization: `Bearer ${data.token}` },
  });
  check(res, { 'status is 200': r => r.status === 200 });
  errorRate.add(res.status !== 200);
  sleep(1);
}
```

### k6-stress.js — Stress test (50 VU, 5 min rampa)
```javascript
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // rampa ascendente
    { duration: '2m', target: 50 },   // carga alta
    { duration: '1m', target: 0 },    // recuperación
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],  // 95% < 1s bajo estrés
    errors: ['rate<0.05'],               // <5% errores
  },
};
```

---

## Comandos de ejecución

```bash
# Unit + Integration tests (.NET)
cd tests/{Project}.Tests
dotnet test --collect:"XPlat Code Coverage" --results-directory ./TestResults
dotnet-coverage merge ./TestResults/**/*.xml -o coverage.xml
reportgenerator -reports:coverage.xml -targetdir:coverage-report -reporttypes:Html

# Target mínima: 75% cobertura de líneas en Services + Repositories

# E2E tests (Playwright)
cd tests/e2e
npx playwright install --with-deps
npx playwright test
npx playwright show-report

# Load tests (k6)
# Instalar: https://grafana.com/docs/k6/latest/get-started/installation/
k6 run tests/load/k6-baseline.js
k6 run tests/load/k6-stress.js --env BASE_URL=http://mi-servidor:5159
```

---

## Thresholds de calidad mínimos

| Capa | Mínimo aceptable |
|------|-----------------|
| Unit coverage (Services) | 75% líneas |
| Unit coverage (Repositories) | 60% líneas |
| Integration tests | 1 happy path + 1 auth test por entidad |
| E2E scenarios | Login + 1 CRUD completo por módulo |
| Load baseline (5 VU) | p95 < 500ms, error rate < 1% |

> Si los thresholds no se cumplen, TestMasterAgent reporta gaps específicos
> pero **no bloquea** el pipeline — solo documenta la deuda técnica en `docs/TASKS.md`.

---

## Integración con CIPipelineAgent (21)

TestMasterAgent genera los archivos de test; CIPipelineAgent los ejecuta en el pipeline CI.
El output JSON incluye el comando exacto de ejecución para que CIPipelineAgent lo configure:

```json
{
  "ci_commands": {
    "unit": "dotnet test tests/{Project}.Tests --configuration Release",
    "integration": "dotnet test tests/{Project}.Tests --filter Category=Integration",
    "e2e": "npx playwright test --config=tests/e2e/playwright.config.ts",
    "load_smoke": "k6 run tests/load/k6-baseline.js --env BASE_URL=$API_URL"
  }
}
```

---

## OUTPUT JSON

```json
{
  "status": "completed",
  "agent": "TestMasterAgent",
  "files_generated": [
    "tests/{Project}.Tests/Unit/",
    "tests/{Project}.Tests/Integration/",
    "tests/e2e/",
    "tests/load/"
  ],
  "unit_tests_count": 0,
  "integration_tests_count": 0,
  "e2e_scenarios_count": 0,
  "load_scripts_count": 0,
  "coverage_target": 80,
  "thresholds_met": true,
  "ci_commands": {
    "unit": "dotnet test tests/{Project}.Tests --configuration Release",
    "integration": "dotnet test tests/{Project}.Tests --filter Category=Integration",
    "e2e": "npx playwright test --config=tests/e2e/playwright.config.ts",
    "load_smoke": "k6 run tests/load/k6-baseline.js --env BASE_URL=$API_URL"
  },
  "state_updates": {
    "lastAgent": "TestMasterAgent"
  },
  "errors": [],
  "next_agent": null
}
```

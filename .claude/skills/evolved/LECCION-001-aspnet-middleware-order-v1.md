# SKILL: Orden correcto del middleware ASP.NET Core 8
> [SKILL EVOLUCIONADA — generada por EvolutionAgent en 2026-04-03]
> Origen: 3 lecciones acumuladas de errores en proyectos reales (ContaCR, Charlotte Fashion)

## Cuándo aplicar
Al generar o revisar `Program.cs` en cualquier proyecto ASP.NET Core 8.
Siempre al agregar Authentication, Authorization, CORS, HTTPS o cualquier middleware.

## Lo que NO hacer (antipatrones)

```csharp
// ❌ Order incorrecto: 401 en todos los endpoints autenticados
app.UseAuthorization();
app.UseAuthentication();  // demasiado tarde

// ❌ CORS después de routing: los preflight requests fallan
app.UseRouting();
app.MapControllers();
app.UseCors("AllowFrontend");  // llega tarde, ya pasó el preflight

// ❌ HTTPS redirect en todos los entornos: rompe desarrollo local
app.UseHttpsRedirection();  // sin condición de entorno
```

## Lo que SÍ hacer (patrón correcto)

```csharp
// ✅ Program.cs — orden correcto, verificado en producción
var app = builder.Build();

// 1. Exception handling (primero siempre)
if (app.Environment.IsDevelopment())
    app.UseDeveloperExceptionPage();
else
    app.UseExceptionHandler("/Error");

// 2. HTTPS solo en producción
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
    app.UseHsts();
}

// 3. Archivos estáticos (si aplica)
app.UseStaticFiles();

// 4. Routing
app.UseRouting();

// 5. CORS — DESPUÉS de routing, ANTES de auth
app.UseCors("AllowFrontend");

// 6. Authentication ANTES que Authorization (siempre)
app.UseAuthentication();   // ← primero
app.UseAuthorization();    // ← segundo

// 7. Controllers al final
app.MapControllers();

app.Run();
```

```csharp
// ✅ CORS — configuración correcta (no usar "*" con credenciales)
builder.Services.AddCors(options =>
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins("http://localhost:5173", "https://miapp.com")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials()));
```

## Por qué importa
- `UseAuthentication` antes de `UseAuthorization` → sin esto: 401 en TODOS los endpoints aunque el token sea válido
- `UseCors` después de `UseRouting` pero antes de `MapControllers` → sin esto: todos los preflight CORS fallan (React no puede llamar al API)
- HTTPS solo en producción → sin condición: `dotnet run` en dev falla con redirect loop

## Aplicable en
- [x] Agent: BackendAgent (03)
- [ ] Agent: FrontendAgent (04)
- [x] Agent: IntegrationAgent (05)
- [x] Agent: DevOpsAgent (07)
- [x] Agent: SecurityAgent (08)

## Severity: high | Scope: stack | Type: pattern

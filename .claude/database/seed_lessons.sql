-- ============================================================
-- seed_lessons.sql — Lecciones semilla del sistema
-- Derivadas de bugs reales resueltos (CLAUDE-troubleshooting.md)
-- Activan el motor de auto-aprendizaje desde el primer proyecto
--
-- EJECUTAR: sqlcmd -S localhost -E -No -i seed_lessons.sql -b
-- IDEMPOTENTE: no duplica si ya existen (verifica por Title)
-- ============================================================
USE [JarvisDB];
GO

-- ============================================================
-- LECCIÓN 1 — JWT Expiration demasiado larga (CRÍTICO)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM Lessons WHERE Title = 'JWT ExpirationMinutes no debe superar 60 en producción')
INSERT INTO Lessons (LessonType, SourceAgent, Title, Description, RootCause, Fix, Severity, Scope, Stack, Tags, AppliesToAgents, FilesAffected)
VALUES (
    'bugfix',
    'SecurityAgent',
    'JWT ExpirationMinutes no debe superar 60 en producción',
    'Usar ExpirationMinutes: 43200 (30 días) deja tokens activos durante semanas si se comprometen. '
    + 'La ventana de compromiso debe ser mínima: 60 minutos para access tokens, 7 días para refresh tokens.',
    'appsettings.json con "ExpirationMinutes": 43200 — el valor por defecto del template era de 30 días.',
    'Cambiar ExpirationMinutes a 60. Agregar RefreshTokenExpirationDays: 7. '
    + 'Implementar endpoint /api/auth/refresh. '
    + 'En Program.cs agregar: if (!app.Environment.IsDevelopment()) { app.UseHttpsRedirection(); app.UseHsts(); }',
    'error',
    'global',
    'dotnet',
    'jwt,auth,security,owasp',
    'BackendAgent,SecurityAgent,IntegrationAgent',
    'appsettings.json,Program.cs'
);
GO

-- ============================================================
-- LECCIÓN 2 — Rutas Windows >260 caracteres en publicación
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM Lessons WHERE Title = 'Rutas Windows >260 chars rompen dotnet publish con carpetas anidadas')
INSERT INTO Lessons (LessonType, SourceAgent, Title, Description, RootCause, Fix, Severity, Scope, Stack, Tags, AppliesToAgents, FilesAffected)
VALUES (
    'bugfix',
    'DevOpsAgent',
    'Rutas Windows >260 chars rompen dotnet publish con carpetas anidadas',
    'Si dotnet publish se interrumpe y se re-ejecuta, puede crear estructura recursiva '
    + 'Publicacion\SistemaContable_v1.0\Publicacion\SistemaContable_v1.0\... excediendo el límite de 260 chars de Windows. '
    + 'Remove-Item -Recurse falla con estas rutas profundas (access denied / path too long).',
    'Interrupciones del script de publicación + carpeta de salida no limpiada entre ejecuciones. '
    + 'Windows MAX_PATH = 260 caracteres.',
    'Antes de publicar, limpiar carpeta de salida con robocopy:/MIR + carpeta temporal vacía. '
    + 'Script de limpieza: '
    + '$tmp = New-Item -ItemType Directory -Path .\TempEmpty -Force; '
    + 'robocopy $tmp.FullName .\Publicacion /MIR /NFL /NDL /NJH /NJS; '
    + 'Remove-Item -Path $tmp.FullName -Force; Remove-Item -Path .\Publicacion -Force; '
    + 'Luego: dotnet clean; dotnet publish',
    'warning',
    'global',
    'dotnet',
    'windows,paths,publish,devops,dotnet',
    'DevOpsAgent',
    'Scripts de publicación'
);
GO

-- ============================================================
-- LECCIÓN 3 — ClosedXML Linux incompatible sin -r linux-x64
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM Lessons WHERE Title = 'ClosedXML <0.100 usa System.Drawing.Common que falla en Linux .NET 8')
INSERT INTO Lessons (LessonType, SourceAgent, Title, Description, RootCause, Fix, Severity, Scope, Stack, Tags, AppliesToAgents, FilesAffected)
VALUES (
    'bugfix',
    'DevOpsAgent',
    'ClosedXML <0.100 usa System.Drawing.Common que falla en Linux .NET 8',
    'BadImageFormatException (0x8007000B) en todos los endpoints de exportación Excel en Linux. '
    + 'ClosedXML.dll vieja (~4.4MB, pre-0.100) depende de System.Drawing.Common que no está disponible en .NET 8 Linux. '
    + 'ClosedXML ≥0.100 usa SixLabors.Fonts (cross-platform, ~1.6MB) — sin System.Drawing.Common.',
    'dotnet publish --no-build usó la DLL vieja del directorio bin en lugar de la versión correcta del csproj. '
    + 'El servidor en producción tenía ClosedXML 4.4MB (pre-0.100) en vez de 1.6MB (0.105.0).',
    'Publicar SIEMPRE con: dotnet publish -c Release -r linux-x64 --self-contained false. '
    + 'Verificar ClosedXML.dll: si es ~4.4MB hay problema de versión (debe ser ~1.6MB). '
    + 'Subir todos los DLLs al servidor después de publicar.',
    'error',
    'global',
    'dotnet',
    'linux,closedxml,excel,publish,dotnet,badimage',
    'DevOpsAgent,BackendAgent',
    'backend/*.csproj'
);
GO

-- ============================================================
-- LECCIÓN 4 — Input hidden dentro de div CSS-hidden puede llegar null
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM Lessons WHERE Title = 'Input hidden dentro de div CSS-hidden puede llegar null en ASP.NET Core model binding')
INSERT INTO Lessons (LessonType, SourceAgent, Title, Description, RootCause, Fix, Severity, Scope, Stack, Tags, AppliesToAgents, FilesAffected)
VALUES (
    'bugfix',
    'BackendAgent',
    'Input hidden dentro de div CSS-hidden puede llegar null en ASP.NET Core model binding',
    'SqlException: Cannot insert the value NULL into column ''Permisos'' al crear usuario con rol Administrador. '
    + 'El <input type="hidden" name="Permisos"> estaba dentro de un div display:none. '
    + 'ASP.NET Core 6+ NRT binding puede entregar null cuando el campo se envía como string vacío.',
    'Input hidden posicionado dentro del div #divPermisos que se oculta con CSS para roles no-admin. '
    + 'El binding model no null safety en el controller.',
    'Defensa en profundidad: (1) mover el input hidden FUERA del div oculto para que siempre se incluya en el form. '
    + '(2) En el controller agregar: usuario.Permisos ??= string.Empty; antes de CrearAsync y ActualizarAsync.',
    'warning',
    'global',
    'dotnet',
    'aspnetcore,model-binding,forms,null,razor',
    'BackendAgent,FrontendAgent',
    'Controllers/**Controller.cs,Views/**/*.cshtml'
);
GO

-- ============================================================
-- LECCIÓN 5 — Jerarquía CuentaPadre incorrecta descuadra Balance
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM Lessons WHERE Title = 'CuentaPadre incorrecto en catálogo de cuentas descuadra Balance de Comprobación')
INSERT INTO Lessons (LessonType, SourceAgent, Title, Description, RootCause, Fix, Severity, Scope, Stack, Tags, AppliesToAgents, FilesAffected)
VALUES (
    'bugfix',
    'DatabaseAgent',
    'CuentaPadre incorrecto en catálogo de cuentas descuadra Balance de Comprobación',
    'Balance descuadrado: montos aparecen en ramas equivocadas del catálogo. '
    + 'El servicio ObtenerBalanceComprobacionAsync propaga montos HACIA ARRIBA por la cadena CuentaPadre. '
    + 'Un padre incorrecto (ej: 1.1.01.08 con CuentaPadre=5.2 en lugar de 1.1.01) envía los montos a Gastos Ventas.',
    'Datos de CuentaPadre incorrectos en la tabla CuentasContables. '
    + 'Sin validación de integridad relacional en la jerarquía de cuentas.',
    'Validar integridad de CuentaPadre al importar catálogo: '
    + 'SELECT * FROM CuentasContables WHERE CuentaPadre IS NOT NULL AND CuentaPadre != '''' '
    + 'AND CodigoCuenta NOT LIKE CuentaPadre + ''.%''. '
    + 'Todo código de cuenta debe EMPEZAR con el código de su padre seguido de punto.',
    'warning',
    'global',
    'sql',
    'sql,contabilidad,hierarchy,validation,balance',
    'DatabaseAgent,BackendAgent',
    'database/schema.sql,Services/**Service.cs'
);
GO

-- ============================================================
-- LECCIÓN 6 — AllowedHosts wildcard permite Host Header Injection
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM Lessons WHERE Title = 'AllowedHosts: "*" permite Host Header Injection en producción')
INSERT INTO Lessons (LessonType, SourceAgent, Title, Description, RootCause, Fix, Severity, Scope, Stack, Tags, AppliesToAgents, FilesAffected)
VALUES (
    'bugfix',
    'SecurityAgent',
    'AllowedHosts: "*" permite Host Header Injection en producción',
    'La configuración AllowedHosts: "*" permite que cualquier dominio sea aceptado como Host válido. '
    + 'Esto habilita ataques de Host Header Injection: password reset poisoning, cache poisoning, SSRF.',
    'El template default de ASP.NET Core usa AllowedHosts: "*" para facilitar el desarrollo. '
    + 'Este valor no debe llegar a producción.',
    'Cambiar en appsettings.json: "AllowedHosts": "mi-dominio.com;localhost". '
    + 'Usar el dominio real de producción separado por punto y coma. Nunca "*" en producción.',
    'error',
    'global',
    'dotnet',
    'owasp,security,host-header,injection,aspnetcore',
    'SecurityAgent,BackendAgent',
    'appsettings.json'
);
GO

-- ============================================================
-- LECCIÓN 7 — AutoMapper tiene vulnerabilidad High sin parche
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM Lessons WHERE Title = 'AutoMapper GHSA-rvv3-g6hj-g44x vulnerabilidad sin parche — usar Mapster')
INSERT INTO Lessons (LessonType, SourceAgent, Title, Description, RootCause, Fix, Severity, Scope, Stack, Tags, AppliesToAgents, FilesAffected)
VALUES (
    'antipattern',
    'SecurityAgent',
    'AutoMapper GHSA-rvv3-g6hj-g44x vulnerabilidad sin parche — usar Mapster',
    'AutoMapper tiene vulnerabilidad High severity (GHSA-rvv3-g6hj-g44x) sin parche en versiones 12.x-16.x. '
    + 'AutoMapper ya no recibe mantenimiento activo de seguridad. '
    + 'Mapster es 6x más rápido, tiene 0 vulnerabilidades conocidas y mantenimiento activo.',
    'AutoMapper fue el mapping library estándar de .NET por años, pero dejó de recibir parches de seguridad.',
    'Reemplazar AutoMapper por Mapster. '
    + 'Dependencias: Mapster 10.0.3 + Mapster.DependencyInjection 10.0.0. '
    + 'En ServiceExtensions: var config = TypeAdapterConfig.GlobalSettings; config.Scan(Assembly.GetExecutingAssembly()); '
    + 'services.AddSingleton(config); services.AddScoped<IMapper, ServiceMapper>(). '
    + 'MappingProfile hereda de IRegister, usa config.NewConfig<Src,Dest>().Map()',
    'error',
    'global',
    'dotnet',
    'security,automapper,mapster,vulnerability,owasp,mapping',
    'BackendAgent,SecurityAgent',
    'backend/*.csproj,Extensions/ServiceExtensions.cs'
);
GO

-- ============================================================
-- PATRONES SEMILLA — Verificados y reutilizables
-- ============================================================

-- PAT-001: Soft delete con índice filtrado
IF NOT EXISTS (SELECT 1 FROM Patterns WHERE PatternId = 'PAT-001')
INSERT INTO Patterns (PatternId, Name, Description, Language, CodeExample, WhyItWorks, WhenToUse, RelatedAgent)
VALUES (
    'PAT-001',
    'Soft Delete con índice filtrado en SQL Server',
    'Columna IsDeleted BIT + índice filtrado WHERE IsDeleted=0 para consultas rápidas sin registros eliminados.',
    'sql',
    'ALTER TABLE [dbo].[Entidad] ADD [IsDeleted] BIT NOT NULL DEFAULT 0;
CREATE INDEX IX_Entidad_Active ON [dbo].[Entidad] (Id)
    WHERE IsDeleted = 0;
-- EF Core: en AppDbContext.OnModelCreating
modelBuilder.Entity<Entidad>().HasQueryFilter(e => !e.IsDeleted);',
    'El índice filtrado excluye los registros eliminados desde el storage engine, no en la aplicación. '
    + 'HasQueryFilter aplica el filtro globalmente en EF Core sin repetirlo en cada query.',
    'Cualquier entidad que requiera historial / auditoría / restauración',
    'DatabaseAgent,BackendAgent'
);
GO

-- PAT-002: Repository Pattern con interfaces en .NET 8
IF NOT EXISTS (SELECT 1 FROM Patterns WHERE PatternId = 'PAT-002')
INSERT INTO Patterns (PatternId, Name, Description, Language, CodeExample, WhyItWorks, WhenToUse, RelatedAgent)
VALUES (
    'PAT-002',
    'Repository + Service con interface en ASP.NET Core 8',
    'Separación de acceso a datos (Repository) y lógica de negocio (Service), ambos con interfaces para IoC.',
    'csharp',
    '// Interfaces en carpeta separada
public interface IClienteRepository {
    Task<IEnumerable<Cliente>> ObtenerTodosAsync();
    Task<Cliente?> ObtenerPorIdAsync(Guid id);
    Task<Cliente> CrearAsync(Cliente cliente);
}

// Registro en ServiceExtensions.cs
services.AddScoped<IClienteRepository, ClienteRepository>();
services.AddScoped<IClienteService, ClienteService>();',
    'El controller sólo conoce el Service. El Service sólo conoce el Repository. '
    + 'Permite testear con Moq (inyectar mocks de las interfaces). '
    + 'Elimina acoplamiento directo a EF Core en la capa de negocio.',
    'Toda entidad del dominio en proyectos medianos/grandes',
    'BackendAgent,QAAgent'
);
GO

-- PAT-003: Axios interceptor JWT con auto-refresh
IF NOT EXISTS (SELECT 1 FROM Patterns WHERE PatternId = 'PAT-003')
INSERT INTO Patterns (PatternId, Name, Description, Language, CodeExample, WhyItWorks, WhenToUse, RelatedAgent)
VALUES (
    'PAT-003',
    'Axios interceptor JWT con auto-refresh en React',
    'Interceptor en api.js que agrega el token a cada request y maneja 401 con refresh automático.',
    'javascript',
    '// services/api.js
api.interceptors.request.use(config => {
  const token = localStorage.getItem(''token'');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      try {
        const { data } = await api.post(''/auth/refresh'',
          { refreshToken: localStorage.getItem(''refreshToken'') });
        localStorage.setItem(''token'', data.accessToken);
        err.config.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(err.config);
      } catch { localStorage.clear(); window.location.href = ''/login''; }
    }
    return Promise.reject(err);
  }
);',
    'Un único punto de configuración de auth. _retry previene loops infinitos. '
    + 'El interceptor de response maneja 401 silenciosamente para el usuario.',
    'Todo frontend React que consuma una API con JWT + refresh tokens',
    'IntegrationAgent,FrontendAgent'
);
GO

PRINT 'seed_lessons.sql ejecutado exitosamente.';
PRINT '7 lecciones semilla insertadas (si no existían).';
PRINT '3 patrones semilla insertados (si no existían).';
GO

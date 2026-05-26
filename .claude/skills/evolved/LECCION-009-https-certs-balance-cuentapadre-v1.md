# LECCION-009: HTTPS Dev Certs & Balance Contable CuentaPadre
**Versión:** v1  
**Tipo:** bugfix  
**Severidad:** medium / high  
**Agentes que aplican:** DebugAgent, BackendAgent, DevOpsAgent  
**Fuente:** JarvisDB · ERR-014, ERR-017  
**Creado:** por EvolutionAgent desde lecciones acumuladas  

---

## Problema 1 — HTTPS certificate error en desarrollo con .NET

### Síntoma
```
ERR_CERT_AUTHORITY_INVALID
Your connection is not private
NET::ERR_CERT_INVALID
```
O en la consola de .NET:
```
Unhandled exception: System.Security.Authentication.AuthenticationException: 
The remote certificate is invalid according to the validation procedure.
```

### Causa raíz
El certificado de desarrollo de .NET está caducado, no fue confiado o fue corrompido.

### Solución
```bash
# Limpiar y regenerar el certificado de desarrollo
dotnet dev-certs https --clean
dotnet dev-certs https --trust

# Verificar que está instalado correctamente
dotnet dev-certs https --check --trust
```

### Si sigue fallando (Windows)
```powershell
# Eliminar manualmente el cert caducado del almacén
# Abrir certmgr.msc → Certificados (usuario actual) → Personal → Certificados
# Buscar "localhost" → eliminar los expirados

# Luego regenerar
dotnet dev-certs https --trust
```

### En ASP.NET Core — solo redirigir HTTPS en producción
```csharp
// Program.cs — NO usar HTTPS redirect en Development (evita problemas de certs)
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
    app.UseHsts();
}
```

---

## Problema 2 — Balance descuadrado por `CuentaPadre` FK incorrecto

### Síntoma
- "Balance descuadrado. Diferencia: ₡ X,XXX.XX"
- Una cuenta aparece sumando montos en una rama equivocada del plan de cuentas
- Línea fantasma en el Balance de Comprobación con nombre incorrecto y monto igual a la diferencia

### Causa raíz
Una cuenta en `CuentasContables` tiene `CuentaPadre` apuntando a una rama equivocada.  
El servicio de Balance propaga montos **hacia arriba** por la cadena de `CuentaPadre` — si el padre es incorrecto, los montos se acumulan en la rama equivocada.

### Diagnóstico
```sql
-- Encontrar cuentas con CuentaPadre inconsistente
-- (la cuenta NO empieza con el código de su padre)
SELECT 
    CodigoCuenta,
    NombreCuenta,
    CuentaPadre,
    'Inconsistente' AS Estado
FROM CuentasContables
WHERE 
    CuentaPadre IS NOT NULL 
    AND CuentaPadre != ''
    AND CodigoCuenta NOT LIKE CuentaPadre + '.%'
ORDER BY CodigoCuenta;

-- Verificar también cuentas con CodigoCuenta vacío (causan descuadre menor)
SELECT Id, NombreCuenta, CodigoCuenta, CuentaPadre
FROM CuentasContables
WHERE CodigoCuenta = '' OR CodigoCuenta IS NULL;
```

### Solución
```sql
-- Corregir el CuentaPadre incorrecto
UPDATE CuentasContables
SET CuentaPadre = '1.1.01'  -- valor correcto según jerarquía del plan de cuentas
WHERE CodigoCuenta = '1.1.01.08'
  AND ClienteId = 'xxx';    -- siempre filtrar por cliente si es multi-tenant

-- Verificar jerarquía correcta de un código:
-- 1.1.01.08 → padre debería ser 1.1.01
-- 1.1.01    → padre debería ser 1.1
-- 1.1       → padre debería ser 1
-- Regla: CuentaPadre = todo excepto el último segmento del CodigoCuenta
```

### Regla de gold para CuentaPadre
```
CodigoCuenta: 5.2.01.01
              └── CuentaPadre correcto: 5.2.01
                  └── CuentaPadre de 5.2.01: 5.2
                      └── CuentaPadre de 5.2: 5
```

### Prevención al crear cuentas nuevas
```csharp
// Al crear cuenta, calcular CuentaPadre automáticamente
private string CalcularCuentaPadre(string codigoCuenta)
{
    var partes = codigoCuenta.Split('.');
    if (partes.Length <= 1) return null;
    return string.Join('.', partes.Take(partes.Length - 1));
}
```

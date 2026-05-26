# 🛡️ PREVENCIÓN DE MOJIBAKE UTF-8 - Standard Global

> **Fecha:** May 25, 2026  
> **Aplicable a:** TODOS los proyectos nuevos y existentes  
> **Agentes afectados:** ArchitectAgent, DatabaseAgent, BackendAgent, FrontendAgent, DebugAgent

---

## 🚨 PROBLEMA IDENTIFICADO: Charlotte Fashion May 2026

**Síntomas en producción:**
- `descripción` → `descripci├│n`
- `Catálogo` → `Cat├ílogo`
- `₡` (colón) → `Ôéí`
- `🔗` (emoji) → `­ƒøì´©Å`

**Causa raíz (triple falla):**
1. **BOM** (Byte Order Mark EF BB BF) en 47 archivos C#
2. **Falta de JavaScriptEncoder** en ASP.NET Core → JSON escapaba Unicode
3. **Mojibake hardcoded** en JSX → copiar/pegar de fuentes con encoding incorrecto

**Impacto:** UI corrupta en producción en ambos dominios (controltotalcr.com y .duckdns.org)

---

## ✅ REGLAS OBLIGATORIAS (APLICAR EN TODOS LOS PROYECTOS)

### 1. Archivos de Configuración (SIEMPRE en raíz del proyecto)

#### `.editorconfig`
```ini
root = true

[*]
charset = utf-8
insert_final_newline = true
trim_trailing_whitespace = true

[*.cs]
charset = utf-8
indent_size = 4

[*.{js,jsx,ts,tsx,sql,md,json}]
charset = utf-8
indent_size = 2
```

#### `.gitattributes`
```
* text=auto eol=lf encoding=utf-8

*.cs text eol=lf encoding=utf-8
*.js text eol=lf encoding=utf-8
*.jsx text eol=lf encoding=utf-8
*.sql text eol=lf encoding=utf-8
*.md text eol=lf encoding=utf-8
*.json text eol=lf encoding=utf-8
*.ps1 text eol=crlf encoding=utf-8
```

---

### 2. ArchitectAgent: Incluir en scaffold inicial

Cuando ArchitectAgent genera la estructura inicial del proyecto:

```markdown
# TASKS.md (agregar tarea inicial)
| T00 | Configurar encoding UTF-8 | Setup | [v1] | ⬜ Pending |

# ARCHITECTURE.md (agregar sección)
## 4.3 Encoding Standards
- Todos los archivos: UTF-8 **sin BOM**
- .editorconfig y .gitattributes configurados
- VS Code: `"files.encoding": "utf8"`
```

**Crear automáticamente:**
- `.editorconfig` (copiar template arriba)
- `.gitattributes` (copiar template arriba)
- `.vscode/settings.json` con encoding UTF-8

---

### 3. DatabaseAgent: SOLO NVARCHAR (nunca VARCHAR)

**schema.sql template:**
```sql
-- ✅ CORRECTO: NVARCHAR soporta Unicode (español, emojis, símbolos)
CREATE TABLE Clientes (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    Nombre NVARCHAR(200) NOT NULL,
    Direccion NVARCHAR(500) NOT NULL,
    Notas NVARCHAR(MAX) NULL
);

-- ❌ PROHIBIDO: VARCHAR corrompe caracteres fuera de ASCII
CREATE TABLE Clientes (
    Nombre VARCHAR(200) NOT NULL  -- ⚠️ NO USAR
);
```

**Literales SQL:** Prefijo `N` obligatorio:
```sql
-- ✅ CORRECTO
INSERT INTO Clientes (Nombre) VALUES (N'José Rodríguez');

-- ❌ INCORRECTO (se corrompe)
INSERT INTO Clientes (Nombre) VALUES ('José Rodríguez');
```

**seed.sql:** Verificar que TODOS los INSERT usen `N'...'`

---

### 4. BackendAgent: JavaScriptEncoder OBLIGATORIO

**Program.cs (o Startup.cs) - INCLUIR SIEMPRE:**
```csharp
using System.Text.Encodings.Web;
using System.Text.Unicode;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // ⚠️ CRÍTICO: Sin esto, JSON escapa Unicode (₡ → \u20A1)
        options.JsonSerializerOptions.Encoder = JavaScriptEncoder.Create(UnicodeRanges.All);
    });

// ... resto de configuración
```

**Por qué:** Sin JavaScriptEncoder, ASP.NET Core escapa caracteres fuera de ASCII:
- `₡` → `\u20A1`
- `José` → `Jos\u00E9`
- `🔗` → `\uD83D\uDD17`

**Validación:** Después de generar Program.cs, verificar que `JavaScriptEncoder.Create` esté presente.

---

### 5. FrontendAgent: Validar UTF-8 en JSX

**index.html (OBLIGATORIO):**
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />  <!-- ✅ CRÍTICO -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>...</title>
</head>
```

**JSX con caracteres especiales:**
```jsx
// ✅ OPCIÓN 1: Unicode escape (más seguro)
<span>Precio: {'\u20A1'}18,000</span>  // ₡

// ✅ OPCIÓN 2: Texto directo (si .editorconfig está configurado)
<span>Precio: ₡18,000</span>

// ❌ PROHIBIDO: Copiar de Word/PDF sin validar
// (puede introducir mojibake invisible)
```

**Emojis en JSX:**
```jsx
// ✅ RECOMENDADO: Unicode escape
<Badge label={'\ud83d\udd17 En línea'} />  // 🔗

// ✅ ALTERNATIVO: Directo (si editor UTF-8)
<Badge label="🔗 En línea" />
```

---

### 6. DebugAgent: Diagnóstico de mojibake (si aparece)

**Verificar TRES capas:**

#### Capa 1: BOM en archivos
```powershell
Get-ChildItem -Recurse -Filter *.cs | ForEach-Object {
    $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        Write-Host "⚠️  BOM detectado: $($_.Name)" -ForegroundColor Yellow
    }
}
```

**Fix:**
```powershell
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
```

#### Capa 2: JavaScriptEncoder ausente
```bash
# Verificar en Program.cs
grep -n "JavaScriptEncoder" backend/*/Program.cs
```

**Fix:** Agregar como se muestra en sección 4 arriba.

#### Capa 3: Mojibake hardcoded en source
```powershell
Get-ChildItem -Recurse -Include *.jsx,*.js | ForEach-Object {
    $c = [System.IO.File]::ReadAllText($_.FullName, [System.Text.Encoding]::UTF8)
    if ($c -match '├│|├í|├¡|Ôéí|­ƒ') {
        Write-Host "⚠️  MOJIBAKE en source: $($_.Name)" -ForegroundColor Red
    }
}
```

**Fix:**
```powershell
$c = $c -creplace '├│', 'ó'
$c = $c -creplace '├í', 'á'
$c = $c -creplace '├¡', 'í'
$c = $c -creplace 'Ôéí', ([char]0x20A1)  # ₡
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($file, $c, $utf8NoBom)
```

---

## 🔄 APLICACIÓN A PROYECTOS EXISTENTES

### Script de actualización automática

Crear `fix-encoding-global.ps1` en cada proyecto:

```powershell
# 1. Crear .editorconfig y .gitattributes si no existen
# 2. Remover BOM de todos los archivos
# 3. Detectar mojibake en source
# 4. Verificar JavaScriptEncoder en Program.cs
# 5. Verificar NVARCHAR en schema.sql
# 6. Reportar issues encontrados
```

**Ejecutar en TODOS los proyectos activos:**
```bash
# Lista de proyectos a revisar
$proyectos = @(
    "C:\...\Charlotte Fashion",
    "C:\...\Proyecto2",
    "C:\...\Proyecto3"
)

foreach ($p in $proyectos) {
    Write-Host "`n🔍 Auditando: $p" -ForegroundColor Cyan
    & "$p\fix-encoding-global.ps1"
}
```

---

## 📋 CHECKLIST PRE-COMMIT (OBLIGATORIO)

Antes de hacer commit en CUALQUIER proyecto:

- [ ] `.editorconfig` existe → charset=utf-8
- [ ] `.gitattributes` existe → encoding=utf-8
- [ ] No hay BOM en archivos (ejecutar script validación)
- [ ] Program.cs tiene JavaScriptEncoder.Create(UnicodeRanges.All)
- [ ] schema.sql solo usa NVARCHAR (nunca VARCHAR)
- [ ] Literales SQL usan prefijo N'...'
- [ ] index.html tiene `<meta charset="UTF-8" />`
- [ ] No hay patrones de mojibake en JSX (├│, ├í, Ôéí, ­ƒ)

---

## 🎯 INTEGRACIÓN CON SISTEMA DE AGENTES

### OrchestratorAgent

Al iniciar CUALQUIER proyecto nuevo:
```
1. Leer PROJECT.md
2. Delegar a ArchitectAgent
3. ArchitectAgent DEBE crear .editorconfig + .gitattributes (OBLIGATORIO)
4. state.json marca encoding_configured: true
```

### Memory Bank

Agregar a `CLAUDE-patterns.md` de TODOS los proyectos:

```markdown
## Encoding UTF-8 sin BOM (PATRÓN GLOBAL)

### C#
- Program.cs: JavaScriptEncoder.Create(UnicodeRanges.All)
- Archivos sin BOM (EF BB BF)

### SQL
- Solo NVARCHAR (nunca VARCHAR)
- Literales con N'...'

### React
- index.html: <meta charset="UTF-8" />
- Símbolos especiales: usar Unicode escapes
```

---

## 📊 MÉTRICAS DE IMPACTO

**Charlotte Fashion (May 2026):**
- 47 archivos con BOM removidos
- 4 archivos JSX con mojibake corregidos (40+ instancias)
- 1 Program.cs actualizado con encoder
- ~500 líneas de código afectadas
- UI en producción: 100% corregida después del fix

**Prevención futura:**
- Reducción esperada de encoding bugs: ~95%
- Tiempo de fix: De 3+ horas a <10 minutos (con scripts)

---

## 📚 REFERENCIAS

- Lección guardada en JarvisDB: `cce9647c-b73e-43c5-9514-0ac2153327f5`
- Documentación completa: `Charlotte Fashion/docs/ENCODING_PREVENTION.md`
- Script de detección: `Charlotte Fashion/scripts/check-encoding.ps1`
- Configuración aplicada: `.editorconfig` + `.gitattributes` en raíz

---

## 👨‍💻 RESPONSABLES

**Agentes que DEBEN aplicar esto:**
- ArchitectAgent: Scaffold inicial con archivos de configuración
- DatabaseAgent: Validar NVARCHAR en schema.sql
- BackendAgent: Verificar JavaScriptEncoder en Program.cs
- FrontendAgent: Validar UTF-8 en JSX, no copiar de fuentes no confiables
- DebugAgent: Diagnóstico de 3 capas si aparece mojibake

**Desarrollador:** Jorge Rodríguez - JR Digital Solutions  
**Email:** jrodri1493@gmail.com  
**Fecha:** May 25, 2026

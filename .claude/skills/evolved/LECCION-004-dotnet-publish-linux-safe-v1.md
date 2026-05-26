# SKILL: .NET publish para Linux — evitar DLLs incompatibles y rutas recursivas
> [SKILL EVOLUCIONADA — generada por EvolutionAgent en 2026-04-03]
> Origen: 2 bugfixes críticos de despliegue en producción (ContaCR en servidor Linux)

## Cuándo aplicar
Al generar scripts de deploy, Dockerfiles, o cualquier comando `dotnet publish` en DevOpsAgent.
También al depurar errores de BadImageFormat o MSB3030 en DebugAgent.

## Lo que NO hacer (antipatrones)

```bash
# ❌ Publicar sin target runtime → DLLs de Windows en servidor Linux
dotnet publish -c Release

# ❌ --no-build con bin/ desactualizado → usa DLLs viejos del directorio
dotnet publish -c Release --no-build

# ❌ No limpiar carpeta de salida antes de publicar → estructura recursiva
# Si el script se interrumpe, Publicacion\ puede contener:
# Publicacion\SistemaContable_v1.0\Publicacion\SistemaContable_v1.0\Publicacion\...
# → Supera el límite de 260 chars de Windows → MSB3030
Remove-Item -Recurse ".\Publicacion"  # ❌ falla con rutas muy profundas
```

## Lo que SÍ hacer (patrón correcto)

```bash
# ✅ Siempre publicar con target runtime Linux explícito
dotnet publish -c Release -r linux-x64 --self-contained false

# ✅ Verificar tamaño de ClosedXML.dll después de publicar
# ClosedXML >= 0.100: ~1.6 MB (usa SixLabors.Fonts — compatible Linux)
# ClosedXML < 0.100:  ~4.4 MB (usa System.Drawing.Common — FALLA en .NET 8 Linux)
```

```powershell
# ✅ Limpiar carpeta de salida con robocopy (maneja rutas >260 chars)
# Usar ANTES de cada dotnet publish
$tempEmpty = New-Item -ItemType Directory -Path ".\TempEmpty" -Force
robocopy $tempEmpty.FullName ".\Publicacion" /MIR /NFL /NDL /NJH /NJS
Remove-Item -Path $tempEmpty.FullName -Force
Remove-Item -Path ".\Publicacion" -Force -ErrorAction SilentlyContinue

# Luego limpiar y publicar
dotnet clean --configuration Release
dotnet publish -c Release -r linux-x64 --self-contained false -o .\Publicacion
```

```bash
# ✅ DLLs a ELIMINAR del servidor Linux después de subir (son de Windows)
# clrjit.dll, coreclr.dll, hostfxr.dll, hostpolicy.dll
# aspnetcorev2_inprocess.dll, clretwrc.dll, System.Drawing.dll
```

## Por qué importa
- `.NET 8 Linux` + `System.Drawing.Common` → `BadImageFormatException 0x8007000B` en runtime, no en build (difícil de diagnosticar)
-  `--no-build` reutiliza DLLs del directorio `bin/` → si hay versiones viejas, se despliegan silenciosamente
- Rutas recursivas truncan el build con MSB3030, y `Remove-Item -Recurse` no puede borrarlas

## Aplicable en
- [ ] Agent: BackendAgent (03)
- [ ] Agent: FrontendAgent (04)
- [x] Agent: DevOpsAgent (07)
- [x] Agent: DebugAgent (10)

## Severity: high | Scope: stack | Type: bugfix

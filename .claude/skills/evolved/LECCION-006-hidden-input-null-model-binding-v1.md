# SKILL: Campos hidden en Forms ASP.NET Core — null en model binding
> [SKILL EVOLUCIONADA — generada por EvolutionAgent en 2026-04-03]
> Origen: SqlException NULL en columna 'Permisos' — ContaCR

## Cuándo aplicar
Al generar views Razor (FrontendAgent si aplica) o controllers con model binding.
Siempre que haya `<input type="hidden">` dentro de contenedores CSS-hidden.

## Lo que NO hacer (antipatrones)

```html
<!-- ❌ Input hidden DENTRO del div oculto → puede llegar null al controller -->
<div id="divPermisos" style="display:none">
    <input type="hidden" id="Permisos" name="Permisos" value="@Model.Permisos" />
    <!-- contenido visual -->
</div>
```

```csharp
// ❌ Controller sin defensa ante null → SqlException al insertar
public async Task<IActionResult> Crear(UsuarioViewModel usuario)
{
    await _usuarioService.CrearAsync(usuario);  // Permisos puede ser null → crash
}
```

## Lo que SÍ hacer (patrón correcto)

```html
<!-- ✅ Input hidden FUERA del div oculto — siempre se incluye en el form -->
<input type="hidden" id="Permisos" name="Permisos" />
<div id="divPermisos" style="display:none">
    <!-- contenido visual únicamente, sin el hidden -->
</div>
```

```csharp
// ✅ Defensa en profundidad en el controller
public async Task<IActionResult> Crear(UsuarioViewModel usuario)
{
    // Null-coalesce antes de persistir — nunca confiar solo en la view
    usuario.Permisos ??= string.Empty;
    await _usuarioService.CrearAsync(usuario);
}

public async Task<IActionResult> Editar(UsuarioViewModel usuario)
{
    usuario.Permisos ??= string.Empty;
    await _usuarioService.ActualizarAsync(usuario);
}
```

## Por qué importa
- ASP.NET Core model binding bajo algunas condiciones puede retornar `null` para campos dentro de divs ocultos (comportamiento borde con nullable reference types en .NET 6+)
- La defensa en el controller es la última línea de defensa ante datos inválidos
- El fix en la view es preventivo; el fix en el controller es la garantía real

## Aplicable en
- [x] Agent: BackendAgent (03)
- [x] Agent: FrontendAgent (04)
- [x] Agent: DebugAgent (10)

## Severity: medium | Scope: stack | Type: bugfix

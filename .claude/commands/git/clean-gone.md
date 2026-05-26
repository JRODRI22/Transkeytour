# /clean-gone — Limpiar Branches Locales con Remote Eliminado

Elimina branches locales cuyo remote tracking ya fue eliminado (merged/deleted en el servidor).

## Uso
```
/clean-gone
/clean-gone --dry-run
```

## Opciones
- `--dry-run` → solo muestra qué se eliminaría, sin eliminar nada (recomendado la primera vez)

## Flujo

### Paso 1 — Actualizar referencias remotas
```bash
git fetch --all --prune
```

El flag `--prune` elimina referencias a branches remotas que ya no existen.

### Paso 2 — Identificar branches "gone"
```bash
git branch -vv | grep ': gone]'
```

Output típico:
```
  feat/cliente-export    abc1234 [origin/feat/cliente-export: gone] feat: exportar clientes a Excel
  fix/jwt-refresh        def5678 [origin/fix/jwt-refresh: gone] fix: corregir refresh token
```

### Paso 3 — Mostrar lista para confirmación
```
🗑️  Branches locales con remote eliminado:

  feat/cliente-export   — último commit: "feat: exportar clientes a Excel" (hace 3 días)
  fix/jwt-refresh       — último commit: "fix: corregir refresh token" (hace 1 semana)

Total: 2 branches a eliminar.
¿Continuar? [S/n]
```

Si `--dry-run` → mostrar lista sin preguntar y terminar.

### Paso 4 — Eliminar branches confirmadas
```bash
git branch -d {branch1} {branch2} ...
```

Si alguna tiene commits no mergeados → usar `-D` solo después de confirmación adicional:
```
⚠️  La branch {nombre} tiene commits que no están en main.
   ¿Eliminar de todas formas? [s/N]
```

### Paso 5 — Confirmación final
```
✅ Limpieza completada
Branches eliminadas: 2
  - feat/cliente-export
  - fix/jwt-refresh

Tu repositorio local está sincronizado con el remoto.
```

## Seguridad
- **Nunca** eliminar la branch actual (`HEAD`)
- **Nunca** eliminar `main`, `master`, `develop`, `release/*`, `hotfix/*` sin confirmación explícita adicional
- Si la branch tiene commits no mergeados → warning y confirmación extra requerida

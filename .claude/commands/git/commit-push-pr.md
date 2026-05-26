# /commit-push-pr — Commit + Push + Pull Request Automático

Ejecuta el flujo completo: commit semántico → push → creación de PR con descripción generada automáticamente.

## Uso
```
/commit-push-pr
/commit-push-pr "descripción opcional"
/commit-push-pr --draft
```

## Opciones
- `--draft` → crea el PR en modo borrador (para revisión antes de mergear)
- `--no-pr` → solo hace commit + push, sin crear PR

## Flujo completo

### Paso 1 — Commit (igual que /commit)
Ejecutar el flujo de `/commit` para generar y confirmar el commit semántico.

### Paso 2 — Verificar branch
```bash
git branch --show-current
```

Si está en `main` o `master` → **ADVERTENCIA**:
```
⚠️ Estás en la rama principal (main/master).
Se recomienda trabajar en una rama de feature.
¿Deseas crear una rama nueva? [S/n]
```

Si el usuario acepta → crear rama con nombre basado en el commit:
```bash
git checkout -b feat/nombre-del-feature
git cherry-pick HEAD
```

### Paso 3 — Push
```bash
git push origin {branch} --set-upstream
```

Si hay error de "rejected (non-fast-forward)" → intentar:
```bash
git pull origin {branch} --rebase
git push origin {branch}
```

### Paso 4 — Crear Pull Request

Generar descripción del PR analizando los commits:
```bash
git log origin/main..HEAD --oneline
git diff origin/main...HEAD --stat
```

Template de descripción:
```markdown
## Descripción
{resumen de qué se hizo y por qué}

## Cambios incluidos
{lista de commits en este PR}

## Archivos modificados
{lista de archivos con +/- líneas}

## Testing
- [ ] Build pasa sin errores
- [ ] Tests unitarios pasan
- [ ] Probado manualmente en desarrollo

## Notas para el reviewer
{observaciones importantes si aplica}
```

Crear PR con GitHub CLI:
```bash
gh pr create \
  --title "{tipo}({scope}): {descripción}" \
  --body "{descripción generada}" \
  --base main \
  [--draft si se especificó]
```

> Si `gh` no está instalado → mostrar la URL del PR con el diff y las instrucciones para crearlo manualmente.

### Paso 5 — Confirmar
```
✅ PR creado exitosamente
🔗 URL: https://github.com/{owner}/{repo}/pull/{número}
Branch: {branch} → main
Commits: {N}
```

## Seguridad
- **Nunca** hacer push a `main`/`master` directamente sin confirmación explícita
- Verificar que no hay secrets en los archivos antes del push:
  ```bash
  git diff --staged | grep -i "password\|secret\|key\|token\|connectionstring"
  ```
  Si se detecta algo → **BLOQUEAR** y pedir confirmación

# /create-release-note — Generar Nota de Release

Genera una nota de release profesional basada en los cambios del proyecto.

## Qué hace este comando

1. Lee `docs/TASKS.md` para identificar tareas completadas
2. Lee `docs/CHANGELOG.md` para historial previo
3. Genera la nota de release en formato estándar

## Cómo usar

```
/create-release-note v1.0.0
/create-release-note v1.1.0 --from v1.0.0
/create-release-note --draft
```

## Formato de output

```markdown
# Release v[X.Y.Z] — [Nombre del Proyecto]
**Fecha:** [YYYY-MM-DD]

## ✨ Nuevas funcionalidades
- [Feature] Descripción concisa del feature
- [Feature] Descripción concisa del feature

## 🐛 Bugs corregidos
- [Fix] Descripción del bug resuelto
- [Fix] Descripción del bug resuelto

## 🔧 Mejoras técnicas
- [Refactor] Descripción de mejora interna
- [DevOps] Cambios de infraestructura

## ⚠️ Breaking changes
- [BREAKING] Descripción del cambio que rompe compatibilidad

## 📋 Dependencias actualizadas
- [NombrePaquete] X.Y → A.B

## 🚀 Instrucciones de actualización
1. Ejecutar: `dotnet ef database update`
2. Actualizar: `npm install`
3. Reiniciar servicios
```

## Integración con CHANGELOG.md

El comando agrega automáticamente la nueva entrada al inicio de `docs/CHANGELOG.md`.

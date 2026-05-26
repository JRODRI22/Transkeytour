---
applyTo: "**"
---

# Token Reduction Strategy — Jarvis

## Principio fundamental
**Los tokens son costosos. El contexto debe ser mínimo y enfocado.**

---

## Estrategia 1: Contexto por Agente (Context Windowing)

Cada agente recibe SOLO la información que necesita:

| Agente | Secciones de PROJECT.md | Archivos adicionales |
|--------|------------------------|----------------------|
| ArchitectAgent | 1, 2, 3, 4, 5 | ninguno |
| DatabaseAgent | 3, 5, 6 | docs/ARCHITECTURE.md |
| BackendAgent | 3, 5, 6 | docs/API.md, docs/ARCHITECTURE.md |
| FrontendAgent | 4, 6, 7 | docs/API.md |
| QAAgent | docs/TASKS.md | archivos de servicios específicos |
| SecurityAgent | Program.cs | Controllers, lib/api.ts |
| DebugAgent | Solo el error + archivo afectado | nada más |

**NO** cargar todo el codebase en cada prompt.

---

## Estrategia 2: State Externalizado

El estado no va en el chat — va en SQL:
```
❌ MAL: "Anteriormente generamos el schema con las tablas X, Y, Z 
        y el backend con los servicios A, B, C y..."
        → Esto usa tokens para describir contexto que ya está en disco

✅ BIEN: SELECT Phase, Status FROM JarvisState WHERE ProjectId = 'mi-proyecto'
        → Una query SQL, cero tokens de contexto
```

---

## Estrategia 3: Referencias a Archivos, No Contenido

Cuando se retoma trabajo:
```
❌ MAL: Pegar todo el contenido de schema.sql en el prompt
✅ BIEN: "Lee database/schema.sql para ver las tablas definidas"
```

Los archivos en disco son la memoria del proyecto.

---

## Estrategia 4: Prompts Compresos

Cuando invoques un agente, usa el formato mínimo:
```
Agente: BackendAgent
Tarea: Generar ProductoService + ProductoRepository
Context refs:
  - PROJECT.md#entidades → Producto (campos: Id, Nombre, Precio, Stock, CategoriaId, CreatedAt, UpdatedAt, IsDeleted)
  - docs/API.md#productos → GET/POST/PUT/DELETE /api/productos
  - Patrón: Repository + Service con interfaces
Output: backend/API/Services/ProductoService.cs + Repositories/ProductoRepository.cs
```

No repetir convenciones que ya están en el archivo de instrucciones del agente.

---

## Estrategia 5: Chunked por Entidad

Para proyectos grandes (> 5 entidades):
```
Fase 3 Backend — Chunk 1/3: Autenticación (Usuario + JWT)
Fase 3 Backend — Chunk 2/3: Catálogo (Categoria + Producto)
Fase 3 Backend — Chunk 3/3: Pedidos (Carrito + Pedido + Items)
```

Un chunk a la vez. Confirmar antes de continuar.

---

## Estrategia 6: Resúmenes en lugar de código completo

En el chat, reportar resúmenes. El código va en archivos:
```
✅ CHUNK COMPLETADO
Generado: ProductoService.cs (12 métodos)
Highlights:
  - GetAllAsync: paginación con AsNoTracking
  - CreateAsync: valida stock + genera GUID
  - UpdateAsync: optimistic concurrency
[Archivo escrito en disco. Ver backend/API/Services/ProductoService.cs]
```

---

## Estrategia 7: Re-uso de Patrones

Cuando un agente genera código para la entidad 1, establece el patrón.
Para las entidades 2-N, solo referencia el patrón:
```
"Genera ProductoRepository siguiendo el mismo patrón que UsuarioRepository 
 en backend/API/Repositories/UsuarioRepository.cs"
```

---

## Cuándo sí cargar contexto completo

Solo en estos casos justificados:
1. Fase 1 (ArchitectAgent) — necesita ver todo PROJECT.md para diseñar bien
2. SecurityAgent — necesita ver Program.cs completo
3. DebugAgent — necesita el stack trace + archivo con el error

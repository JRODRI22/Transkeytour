# /explain-architecture-pattern — Explicar Patrón de Arquitectura

Explica un patrón de arquitectura en el contexto del stack de este proyecto.

## Qué hace este comando

1. Identifica el patrón solicitado
2. Explica el patrón con ejemplos del stack actual (.NET / React)
3. Muestra cómo está implementado (o cómo implementarlo) en este proyecto

## Cómo usar

```
/explain-architecture-pattern repository
/explain-architecture-pattern clean-architecture
/explain-architecture-pattern cqrs
/explain-architecture-pattern mediator
/explain-architecture-pattern jwt-flow
```

## Patrones disponibles (con ejemplos en este stack)

| Patrón | Descripción breve |
|--------|------------------|
| `clean-architecture` | Separación en capas: Controllers → Services → Repositories → DB |
| `repository` | Patrón Repository con interfaces IXxxRepository |
| `unit-of-work` | Coordinación de transacciones entre repositorios |
| `cqrs` | Separar Commands (escritura) de Queries (lectura) |
| `mediator` | Desacoplamiento via MediatR en .NET |
| `jwt-flow` | Ciclo completo: login → JWT → refresh → logout |
| `soft-delete` | Borrado lógico con IsDeleted + índices filtrados |
| `service-layer` | IXxxService + XxxService para lógica de negocio |
| `dto-mapping` | Request/Response DTOs con AutoMapper o manual |
| `axios-interceptor` | JWT auto-attach + refresh en React/Axios |
| `protected-routes` | Rutas protegidas con React Router + contexto Auth |

## Formato de explicación

Para cada patrón, se entrega:

1. **¿Qué es?** — Definición en 2-3 líneas
2. **¿Por qué lo usamos?** — Beneficios concretos
3. **Estructura en este proyecto** — Rutas de archivos relevantes
4. **Ejemplo de código** — Snippet mínimo y funcional
5. **Cuándo NO usar** — Anti-patterns a evitar

## Ejemplos de output

```
/explain-architecture-pattern repository

## Patrón Repository

**¿Qué es?**
Abstrae el acceso a datos detrás de una interfaz, desacoplando la lógica de 
negocio del ORM o base de datos específica.

**¿Por qué lo usamos?**
- Facilita testing (se puede mockear IClienteRepository)
- Permite cambiar ORM sin tocar Services
- Centraliza las queries en un lugar

**Estructura en este proyecto:**
backend/{Project}.API/
├── Repositories/
│   ├── Interfaces/
│   │   └── IClienteRepository.cs
│   └── ClienteRepository.cs

**Ejemplo:**
[código de IClienteRepository + ClienteRepository]
```

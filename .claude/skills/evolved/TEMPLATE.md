# SKILL: {Nombre descriptivo del aprendizaje}
> [SKILL EVOLUCIONADA — generada por EvolutionAgent en {fecha}]
> Origen: {DebugAgent intento N | pipeline fase X | ReviewAgent fase Y}
> Versión: v{N} | Tipo: {bugfix | pattern | antipattern | decision}

---

<!-- SYMBOLIC LEARNING FORMAT — inspirado en "Symbolic Learning Enables Self-Evolving Agents" (arxiv 2406.18532) -->
<!-- Cada campo es OBLIGATORIO. Sin campos vacíos.                                                           -->

## 🔍 Síntoma (observable)
**Qué observó el usuario o agente:**
```
{descripción exacta del comportamiento observable que desencadenó este aprendizaje}
```
_Ejemplo: "Error CS0246: No se encontró el tipo 'IMapper' al compilar BackendAgent"_

## 🪲 Causa raíz
**Por qué ocurrió:**
```
{explicación técnica de la causa subyacente, no del síntoma}
```
_Ejemplo: "El namespace de Mapster es MapsterMapper, no AutoMapper. El agente generó using AutoMapper por defecto."_

## 🔧 Fix aplicado
**Qué se cambió (antes → después):**
```
ANTES:
{código o configuración incorrecta}

DESPUÉS:
{código o configuración correcta}
```

## 📐 Regla reutilizable
**La regla generalizable extraída de este aprendizaje (independiente del proyecto):**

> {Regla concisa en 1-2 oraciones que el agente puede aplicar en cualquier proyecto futuro.
>  Debe ser INDEPENDIENTE del contexto específico del proyecto donde ocurrió.}

_Ejemplo: "Siempre verificar qué namespace exporta la librería de mapping antes de generar `using`. Mapster → `MapsterMapper`; AutoMapper → `AutoMapper`."_

## 🚨 Por qué importa
**Consecuencia si se ignora:**
- **Si se repite:** {build falla | vulnerabilidad | bug sutil | deuda técnica}
- **Frecuencia observada:** {N veces en Y proyectos}
- **Tiempo estimado de debug si se ignora:** {30 min | 2h | 1 día}

## ✅ Señal de éxito
**Cómo verificar que la regla se aplicó correctamente:**
```
{comando de verificación o condición observable}
```

---

## 🏷️ Metadata (OBLIGATORIO — no modificar estructura)

```yaml
skill_id:       "LECCION-{NNN}-{slug}-v{N}"
version:        {N}
created_at:     "{YYYY-MM-DDTHH:MM:SSZ}"
last_updated:   "{YYYY-MM-DDTHH:MM:SSZ}"
source_agent:   "{DebugAgent | ReviewAgent | ArchitectAgent | manual}"
lesson_type:    "{bugfix | pattern | antipattern | decision}"
severity:       "{high | medium | low}"
scope:          "{global | stack | project}"
applies_to:
  - "{ArchitectAgent | BackendAgent | FrontendAgent | IntegrationAgent | ...}"
decay_days:     90
reuse_count:    0
```

---

<!-- INSTRUCCIONES PARA EL EVOLUTIONAGENT:
1. Rellenar TODOS los campos — prohibido dejar {placeholders} en la versión final
2. La "Regla reutilizable" debe poderse leer sin contexto del proyecto específico
3. El "Síntoma" debe ser el observable exacto, no la interpretación
4. El "Fix aplicado" DEBE tener ANTES y DESPUÉS con código real o configuración real
5. El decay_days controla cuándo la skill se archiva (0 = permanente)
6. Incrementar version al actualizar una skill existente, no crear nueva
-->

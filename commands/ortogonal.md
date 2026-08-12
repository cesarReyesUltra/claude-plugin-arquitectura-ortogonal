---
description: Evalúa una tarea contra la norma Don't Touch the Monolith y entrega la decisión ortogonal
argument-hint: [descripción de la tarea]
---

Evaluar contra la norma: `$ARGUMENTS`

Si el argumento viene vacío, evaluar la tarea en curso de esta conversación.

Usar la skill `arquitectura-ortogonal` como norma. Si hay legado involucrado y no está mapeado, usar `ingenieria-inversa-legado` antes de decidir.

## Entregar exactamente esto

**1. Clasificación**

Una de: `error en produccion` · `proyecto en curso` · `capacidad nueva` · `excepcion (RNF o habilitar reutilizacion)`. Con la razón en una línea.

- `error en produccion` → permitido tocar el legado, con el cambio mínimo que restablece el servicio. Decir cuál es ese mínimo.
- `proyecto en curso` → permitido dentro del alcance aprobado. Señalar cualquier ampliación de alcance: esa parte se rediseña afuera.
- `capacidad nueva` → prohibido tocar el legado. Seguir con los puntos 2 a 5.
- `excepcion` → no aprobarla ni ejecutarla. Documentar justificación y declarar que requiere aprobación del comité de arquitectura.

**2. Legado involucrado**

Qué entradas de `.claude/legacy-map.json` toca la tarea. Si algo tiene señales de legado y no está declarado, proponer `/legado`.

**3. Camino obligatorio**

Recorrer y declarar dónde paró: `reutilizar` → `componer` → `configurar` → `crear`. Justificar por qué los peldaños anteriores no bastaron. "Tocar el core" no es un peldaño.

**4. Diseño mínimo**

Artefacto(s) nuevo(s), patrón elegido de `references/patrones.md`, contrato de conexión, capacidades reutilizadas y capacidad reutilizable que deja.

**5. Cinco preguntas**

Responderlas una por una. Si alguna respuesta implica tocar el legado, replantear el diseño y decirlo.

1. ¿Qué capacidad existente reutilizamos?
2. ¿Qué artefacto nuevo creamos?
3. ¿Cómo se conecta sin tocar lo existente?
4. ¿Qué capacidad reutilizable deja al resto?
5. ¿Cómo sabremos que funcionó?

**6. Veredicto**

`PERMITIDO` · `REPLANTEAR` · `EXCEPCION — COMITE`. Una línea de cierre, sin rodeos.

Lenguaje: PoV, nunca MVP/PoC/prototipo.

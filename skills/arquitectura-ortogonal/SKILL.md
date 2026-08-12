---
name: arquitectura-ortogonal
description: Aplica la norma de arquitectura "Don't Touch the Monolith" y el principio de arquitectura ortogonal de Linex Loyalty. Usar siempre que un agente vaya a diseñar, planear, implementar o revisar nuevas capacidades, features, integraciones, artefactos o cambios sobre sistemas existentes; cuando una tarea implique modificar el monolito, el core, un servicio legado o cualquier sistema en operación; al revisar diseños, planes técnicos o PRs; o al responder cómo habilitar algo nuevo — incluso si el usuario no menciona "monolito" ni "arquitectura ortogonal". También usar para clasificar si un cambio es permitido, prohibido o excepción del comité de arquitectura.
---

# Arquitectura ortogonal — Don't Touch the Monolith

Norma de arquitectura de Linex Loyalty, de **obligatorio cumplimiento**, para todo agente que diseñe o construya software. No es una preferencia ni una recomendación: es la regla que gobierna cómo nace todo lo nuevo.

## La norma

**No se toca el código en operación para desarrollar nuevas capacidades.**

Esto cubre el monolito —el caso principal— y **todo código legado declarado**: servicios antiguos, librerías compartidas, jobs, bases de datos heredadas, frontends legados. La regla es la misma para todos.

Se toca **únicamente** para:

1. **Corregir errores en producción** — restablecer el servicio y la estabilidad de lo que ya opera.
2. **Terminar los proyectos en curso** — cerrar compromisos ya iniciados, **sin ampliar su alcance**.

**Única excepción**, y siempre con aprobación del **comité de arquitectura** (nunca del agente, nunca del equipo por cuenta propia):

- Fortalecer **requisitos no funcionales (RNF)**: desempeño, seguridad, resiliencia, escalabilidad.
- **Habilitar capacidades reutilizables**, solo cuando es totalmente requerido para exponerlas.

Todo lo demás — nuevas capacidades, features, integraciones, extensiones, PoVs, experimentos, "mejoras" que amplíen el alcance de lo existente — **nace afuera**.

## El principio: arquitectura ortogonal

La norma se materializa con arquitectura ortogonal: cada capacidad evoluciona de forma **independiente** y se conecta con lo existente **sin interferir**. Cambiar una cosa no obliga a cambiar las demás.

- **El bajo impacto es una propiedad del diseño, no un cuidado posterior.** No se diseña algo acoplado para luego "tener cuidado": se diseña para que no pueda interferir.
- **Todo se conecta por contrato explícito** (API versionada, evento, fachada), nunca por acceso a internals, tablas ajenas o estado compartido.
- **Toda pieza nueva nace como capacidad reutilizable**: con contrato documentado, descubrible por otros equipos y sin dependencia de un consumidor específico.
- La ortogonalidad no prescribe microservicios: prescribe **construir afuera, con límites claros y reutilización**. El patrón concreto se decide caso a caso (ver `references/patrones.md`).

## Qué cuenta como legado

**Fuente de verdad:** `.claude/legacy-map.json` en la raíz del proyecto. Leerlo al inicio de cualquier tarea que toque código existente. Si no existe, no asumir que no hay legado — aplicar las señales de abajo.

Señales que sugieren legado aunque no esté declarado:

- Frameworks o runtimes fuera de soporte (.NET Framework, Web Forms, `*.asmx`, EDMX, jQuery legacy).
- Carpetas, namespaces o repos llamados `Legacy`, `Old`, `Core`, `Monolito`, `V1`.
- Ausencia de pruebas y de contrato publicado, con consumidores en producción.
- Lógica de negocio crítica sin dueño activo; cambios recientes solo por incidentes.
- El usuario lo llama "el core", "el sistema viejo", "lo que no se toca".

Al detectar señales: **proponer** al usuario registrarlo con `/legado <ruta>`. Nunca escribir el manifiesto sin confirmación, y nunca tratar una sospecha como declaración.

## Cambio de foco frente al legado

Cuando el trabajo se cruza con legado, la pregunta del agente cambia:

| No preguntar | Preguntar |
| --- | --- |
| ¿Dónde lo modifico para que quepa esto? | ¿Qué casos de uso ya resuelve y cómo los aprovecho? |
| ¿Cómo lo arreglo o lo mejoro? | ¿Qué superficie expone que pueda consumir sin tocarlo? |
| ¿Cómo lo migro? | ¿Qué construyo afuera y qué capacidad reutilizable deja? |

Entender el legado antes de diseñar es obligatorio: invocar la skill **`ingenieria-inversa-legado`** y volver aquí con el mapa de capacidades. No diseñar contra un legado que no se ha mapeado.

## Camino obligatorio para lo nuevo — en este orden, siempre

Ante cualquier nueva capacidad, el agente recorre estos peldaños y se detiene en el primero que resuelve la necesidad:

1. **Reutilizar** — una capacidad existente ya resuelve la necesidad.
2. **Componer** — combinar capacidades existentes, sin modificarlas.
3. **Configurar** — parámetros o flags sobre lo ya construido.
4. **Crear** — un artefacto nuevo: aislado, conectado por contrato y siempre reutilizable.

Tocar el core **no es un peldaño**: está prohibido para lo nuevo. Si el análisis concluye que "no hay más remedio que tocar el core", el diseño está mal planteado o se está frente a una posible excepción que debe escalar al comité de arquitectura.

## Cinco preguntas obligatorias antes de construir

Toda propuesta de diseño o plan de implementación debe responderlas explícitamente. Si alguna respuesta implica tocar el legado, hay que replantearla.

1. ¿Qué capacidad existente podemos **reutilizar**?
2. ¿Qué **artefacto nuevo** vamos a crear?
3. ¿Cómo se **conecta sin tocar** lo que ya existe? (contrato explícito)
4. ¿Qué **capacidad reutilizable deja** al resto?
5. ¿Cómo **sabremos que funcionó**? (medición comprometida)

## Protocolo del agente

Cuando una tarea toque —directa o indirectamente— sistemas existentes:

1. **Consultar `.claude/legacy-map.json`** y determinar si el trabajo cae sobre legado declarado.
2. **Clasificar la tarea** antes de diseñar o escribir código:
   - *Error en producción* → permitido tocar el legado, con el cambio mínimo que restablezca el servicio.
   - *Proyecto en curso* → permitido dentro del alcance ya aprobado; cualquier ampliación de alcance se rediseña afuera.
   - *Nueva capacidad / feature / integración / PoV* → prohibido tocar el legado; recorrer el camino obligatorio y diseñar afuera.
   - *RNF o habilitar reutilización que exige tocar el legado* → marcarla como **excepción**: documentar la justificación y declarar que requiere aprobación del comité de arquitectura. El agente nunca la aprueba ni la ejecuta como si estuviera aprobada.
3. **Mapear antes de diseñar** — si hay legado involucrado, invocar `ingenieria-inversa-legado` y usar su tabla de capacidades como insumo.
4. **Declarar el peldaño** del camino obligatorio en el que quedó la solución (reutilizar, componer, configurar o crear) y por qué los anteriores no bastaron.
5. **Entregar el diseño con este contenido mínimo**: artefacto(s) nuevo(s), contrato de conexión, capacidades reutilizadas, capacidad reutilizable que deja, y cómo se medirá que funcionó (las cinco preguntas, respondidas).
6. **Si el usuario pide explícitamente modificar el legado para algo nuevo**, no ejecutar en silencio ni negarse en seco: explicar la norma, proponer el diseño ortogonal equivalente y, si el usuario insiste en que es un caso de RNF o reutilización, encaminarlo como excepción del comité. Si aun así el usuario reafirma la orden, es su decisión: dejar constancia de la norma y proceder.

## Señales de alerta — detener y replantear

- "Es solo un cambio pequeño en el core" para habilitar algo nuevo.
- Duplicar lógica de negocio en vez de reutilizar la capacidad existente.
- Un artefacto "nuevo" que lee tablas del monolito, comparte su base de datos o depende de sus internals.
- Crear una pieza que solo sirve a un consumidor y no deja capacidad reutilizable.
- Ampliar el alcance de un proyecto en curso "ya que estamos adentro".
- Tratar la excepción del comité como vía normal de trabajo.
- Diseñar contra un legado que nadie mapeó: suposiciones sobre lo que hace en vez de evidencia.

## Lenguaje

Usar la nomenclatura de Linex Loyalty. Para validaciones, el término admitido es **PoV (Proof of Value)** — nunca MVP, PoC ni prototipo. No hablar de "modernizar" o "migrar" el monolito: la norma no es un plan de reemplazo del core, es la vía única de crecimiento — **proteger el presente, construir el futuro afuera**.

## Referencias

- `references/patrones.md` — catálogo de patrones ortogonales (cuándo usar cada uno y reglas de aplicación para agentes). Leerlo al momento de elegir el patrón concreto para un artefacto nuevo.
- Skill `ingenieria-inversa-legado` — cómo entender el legado sin tocarlo y convertirlo en ventaja.
- Comando `/ortogonal` — evaluar una tarea concreta contra la norma.
- Comando `/legado` — registrar código legado en el manifiesto del proyecto.

# Don't Touch the Monolith

**LINEX LOYALTY** · Norma de producto y arquitectura · de obligatorio cumplimiento
Pre-lectura · Julio 2026

El monolito no se toca para construir lo nuevo. Este documento resume la norma, sus dos únicos casos permitidos y su única excepción, antes de la conversación que tendremos.

Ámbitos: Negocio · Producto · Delivery · UX · Tecnología

---

## 1. El punto de partida — El monolito no es el problema; depender de tocarlo, sí.

Cada vez que una nueva funcionalidad obliga a modificar artefactos existentes, ponemos en riesgo lo que ya está estable — y ese riesgo se paga en tiempo, pruebas y dependencias.

Costos de depender de tocarlo:

- Más regresión
- Más ciclos de prueba
- Más dependencias entre equipos
- Más presión sobre el core
- Menor velocidad de respuesta al negocio
- Mayor riesgo en producción

### La norma

**El monolito no se toca para desarrollar nuevas capacidades.**

Se toca únicamente para **corregir errores en producción** y **terminar los proyectos en curso**. Todo lo nuevo nace afuera: artefactos nuevos que **reutilizan capacidades y crean capacidades reutilizables.**

---

## 2. La regla, sin ambigüedad — Cuándo se toca, cuándo no, y la única excepción.

### ✓ Se toca únicamente para

- **Corregir errores en producción** — restablecer el servicio y la estabilidad de lo que ya opera.
- **Terminar los proyectos en curso** — cerrar compromisos ya iniciados, sin ampliar su alcance.

### ✕ No se toca para

- Nuevas capacidades o features
- MVPs, pilotos y experimentos
- Nuevas integraciones o extensiones
- "Mejoras" que amplíen el alcance de lo existente

### ! Única excepción — aprueba el comité de arquitectura

- **Fortalecer requisitos no funcionales (RNF)** — desempeño, seguridad, resiliencia, escalabilidad.
- **Habilitar capacidades reutilizables** — solo cuando es totalmente requerido para exponerlas.

---

## 3. Cómo decidimos — Cambia la pregunta: lo nuevo se construye afuera.

**Antes:** ¿Dónde modificamos el monolito para meter esto?
**Ahora:** ¿Qué construimos afuera y qué capacidad reutilizable deja?

### Camino obligatorio para lo nuevo · en este orden, siempre

1. **Reutilizar** — una capacidad existente ya resuelve la necesidad.
2. **Componer** — combinar capacidades existentes, sin modificarlas.
3. **Configurar** — parámetros o flags sobre lo ya construido.
4. **Crear** — un artefacto nuevo, aislado, conectado por contrato — y siempre reutilizable.

✕ **Tocar el core** — prohibido para nuevas capacidades.
! **Excepción** — solo comité de arquitectura: RNF o habilitar reutilización.

### Qué gana cada área

- **Negocio** — Más velocidad, menor riesgo, más predictibilidad.
- **Producto** — MVPs y pilotos más seguros; core y experimentos separados.
- **Delivery** — Menos dependencias críticas y mejor paralelización.
- **UX** — Nuevas experiencias sin romper journeys existentes.
- **Aliados y clientes** — Evolución con menor impacto sobre lo que funciona.

---

## 4. Una imagen para fijar la idea — Un hotel en operación, que nunca cierra.

Si el hotel necesita más habitaciones, no se remodela el edificio en plena operación: se construye una nueva ala. Al edificio principal solo entran cuadrillas para reparar averías y terminar obras ya iniciadas.

El edificio principal (con huéspedes adentro): Recepción · Habitaciones · Restaurante · Eventos. La nueva ala se conecta por un **acceso controlado**: más capacidad, sin cerrar el hotel.

> La conexión es un contrato claro: el hotel nunca deja de operar mientras construimos.

**En nuestro contexto:** el monolito es el edificio principal, en plena operación. La norma deja una sola vía para crecer: construir al lado, conectar con contrato y reutilizar lo que el hotel ya ofrece.

---

## 5. El criterio, aplicado — Cinco preguntas antes de construir.

Para cada nueva capacidad, responder estas cinco preguntas es obligatorio. **Si alguna respuesta implica tocar el monolito, hay que replantearla.**

| # | Pregunta | Para qué |
| --- | --- | --- |
| 01 | ¿Qué capacidad existente podemos reutilizar? | Primero reutilizar, no construir. |
| 02 | ¿Qué artefacto nuevo vamos a crear? | Lo nuevo vive fuera del core. |
| 03 | ¿Cómo se conecta sin tocar lo que ya existe? | Contrato explícito. |
| 04 | ¿Qué capacidad reutilizable deja al resto? | Toda pieza nueva nace reutilizable. |
| 05 | ¿Cómo sabremos que funcionó? | Compromete una medición. |

---

## 6. Una vista técnica breve — Arquitectura ortogonal: bajo impacto por diseño.

La norma se materializa con **arquitectura ortogonal**: cada capacidad nueva evoluciona de forma independiente y se conecta con lo existente sin interferir. Cambiar una cosa no obliga a cambiar las demás — **el bajo impacto es una propiedad del diseño, no un cuidado posterior.**

Puede materializarse con varios patrones · se deciden caso a caso:

- Nuevos servicios de extensión
- Fachadas
- Adaptadores
- Eventos
- Workers
- Microfrontends
- Web components
- Capas anticorrupción
- Configuración declarativa

> La norma no prescribe microservicios — **prescribe construir afuera, con límites claros y capacidades reutilizables.**

---

## 7. Gobierno y medición — Gobernamos los riesgos y medimos el impacto.

### Riesgos a gestionar

- Crear demasiados artefactos
- Duplicar reglas de negocio
- Fragmentar la experiencia
- Aumentar complejidad operativa
- Postergar deuda técnica real

### Cómo los gobernamos

- Comité de arquitectura: única vía de excepción
- Criterios compartidos y ownership claro
- Contratos explícitos entre artefactos
- Catálogo de capacidades reutilizables
- Observabilidad y medición de impacto

### Cómo sabremos que funciona

- ↘ Menos regresión
- ↘ Menor tiempo de pruebas
- ↘ Menor lead time de nuevas capacidades
- ↘ Menos incidentes por cambios en el core
- ↗ Más pilotos en paralelo · más vía configuración
- ↗ Mayor predictibilidad para negocio

Será exitosa si nos permite **entregar más — con menos riesgo y sin deteriorar la operación actual.**

---

## 8. Llevemos esto a la conversación — Proteger el presente, construir el futuro afuera.

Don't Touch the Monolith es una norma de obligatorio cumplimiento — no una preferencia.

El core se toca solo para **corregir errores** y **terminar lo iniciado**. Todo lo nuevo nace afuera, **reutiliza capacidades** y **deja capacidades reutilizables**.

### Preguntas para la sesión

1. ¿Qué iniciativas del roadmap asumen hoy tocar el core y deben replantearse para nacer afuera?
2. ¿Qué capacidad próxima será la primera en nacer afuera, como artefacto reutilizable?
3. ¿Cómo operará el comité de arquitectura las excepciones — RNF y habilitar reutilización?

---

**LINEX LOYALTY**

# Catálogo de patrones ortogonales

Los patrones con los que se materializa la norma. Se deciden **caso a caso**: el criterio de selección es siempre el mismo — el artefacto vive afuera, se conecta por contrato y deja una capacidad reutilizable. Ninguno autoriza tocar el core.

## Cómo elegir

1. ¿La necesidad es de **lógica de negocio nueva**? → Servicio de extensión (+ eventos o fachada para conectar).
2. ¿La necesidad es **consumir lo existente con otra forma o vocabulario**? → Fachada, adaptador o capa anticorrupción.
3. ¿La necesidad es **reaccionar a algo que ocurre en el core**? → Eventos + workers.
4. ¿La necesidad es de **experiencia de usuario nueva**? → Microfrontend o web components.
5. ¿La necesidad es de **variación de comportamiento**? → Configuración declarativa, antes que código.

## Patrones de construcción

### Nuevos servicios de extensión
Artefacto independiente que implementa la capacidad nueva completa: su lógica, su almacenamiento, su ciclo de vida y despliegue propios.
- **Usar cuando:** la capacidad tiene lógica de negocio propia.
- **Reglas:** almacenamiento propio (nunca la base de datos del monolito); consume el core solo por sus contratos publicados; expone su propio contrato versionado desde el día uno.

### Workers
Procesos que ejecutan trabajo asíncrono (cálculos, sincronizaciones, tareas programadas) fuera del camino crítico del core.
- **Usar cuando:** la capacidad no necesita respuesta síncrona o puede desacoplarse en el tiempo.
- **Reglas:** idempotentes; alimentados por eventos o colas, nunca leyendo directamente el estado interno del core.

### Microfrontends y web components
Experiencias de usuario nuevas que se integran visualmente sin modificar el frontend existente.
- **Usar cuando:** la capacidad es principalmente de experiencia o journey nuevo.
- **Reglas:** contrato de integración explícito (props, eventos de UI, slots); sin dependencias al estado global interno de la aplicación anfitriona; versionados y desplegables por separado.

## Patrones de conexión

### Fachadas
Interfaz nueva y estable delante de capacidades existentes, con el vocabulario que los consumidores necesitan.
- **Usar cuando:** varios consumidores necesitan lo mismo del core con una forma más simple o más estable.
- **Reglas:** la fachada solo traduce y orquesta — no contiene lógica de negocio nueva; es en sí misma una capacidad reutilizable.

### Adaptadores
Pieza que traduce entre el contrato del core y el contrato que necesita un artefacto nuevo o un tercero.
- **Usar cuando:** los contratos no coinciden y no se va a modificar ninguno de los dos lados.
- **Reglas:** un adaptador por integración; sin estado propio de negocio; desechable sin impacto cuando la integración cambie.

### Capas anticorrupción
Frontera que impide que los modelos y el vocabulario del monolito contaminen el diseño de los artefactos nuevos (y viceversa).
- **Usar cuando:** un artefacto nuevo necesita datos o conceptos del core, pero debe conservar su propio modelo limpio.
- **Reglas:** la traducción de modelos vive en la capa, no dispersa en el artefacto; el artefacto nuevo nunca importa tipos o esquemas internos del monolito.

### Eventos
El core (u otro artefacto) publica hechos de negocio; los artefactos nuevos se suscriben y reaccionan.
- **Usar cuando:** lo nuevo necesita enterarse de lo que pasa sin que el core sepa que existe.
- **Reglas:** eventos como hechos de negocio versionados (no volcados de tablas ni deltas técnicos); el productor no conoce a los consumidores; agregar un consumidor jamás requiere tocar al productor.

### Configuración declarativa
Variar comportamiento mediante parámetros, flags o reglas declaradas, sobre capacidades ya construidas.
- **Usar cuando:** la "capacidad nueva" es en realidad una variación de una existente.
- **Reglas:** la configuración es datos, no código; validada y versionada; si exige agregar código al core para soportarla, ya no es este patrón — replantear.

## Cuando el legado no expone contrato

Caso frecuente: el legado resuelve el caso de uso pero no tiene API, evento ni punto de extensión utilizable. Opciones, en orden de preferencia:

1. **Fachada por encima de lo que sí expone** — aunque sea parcial: un endpoint, un archivo de intercambio, un job programado.
2. **Captura de hechos desde el borde** — leer lo que el legado ya emite (logs de negocio, colas existentes, archivos de salida) y convertirlo en eventos versionados propios, en un adaptador afuera.
3. **Lectura de datos con capa anticorrupción y solo lectura** — último recurso, únicamente si no hay superficie ejecutable. Nunca escribir, nunca compartir el modelo, aislar la traducción en un solo punto y declararlo como deuda con fecha de revisión.
4. **Escalar como excepción** — si exponer la capacidad requiere tocar el legado, es un caso de "habilitar capacidades reutilizables": lo aprueba el comité de arquitectura, no el agente.

Elegir la opción 3 sin haber descartado 1 y 2 con evidencia es un error de diseño, no una decisión pragmática.

## Qué hace a una capacidad "reutilizable"

Toda pieza creada bajo la norma debe cumplir esto para considerarse capacidad reutilizable:

- **Contrato explícito y versionado** — API, esquema de eventos o interfaz de componente, documentado.
- **Descubrible** — registrada en el catálogo de capacidades reutilizables del gobierno de arquitectura.
- **Sin dueño-consumidor** — no depende de un consumidor específico ni asume su contexto.
- **Aislada** — almacenamiento y despliegue propios; sin lecturas directas a datos ajenos.
- **Observable y medible** — expone señales para verificar su uso y su impacto.

## Anti-patrones (nunca aplicar)

- Integración por base de datos compartida o lectura directa de tablas del monolito.
- "Extensión" implementada como rama, módulo o plugin dentro del código del core.
- Eventos que son volcados de tablas o exponen el esquema interno del core.
- Adaptadores con lógica de negocio escondida.
- Copiar y pegar lógica del monolito hacia el artefacto nuevo en lugar de consumirla por contrato (duplicación sin control).

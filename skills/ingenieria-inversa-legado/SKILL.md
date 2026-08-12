---
name: ingenieria-inversa-legado
description: Protocolo de ingeniería inversa read-only sobre código legado — monolito, servicios viejos, librerías, jobs o bases de datos heredadas. Usar antes de diseñar, integrar o construir cualquier cosa que dependa de un sistema existente que no se puede modificar; cuando haya que entender qué hace un código antiguo, qué casos de uso resuelve, qué expone y cómo consumirlo sin tocarlo; cuando el usuario diga "cómo funciona esto", "necesito integrarme con", "esto ya existe pero no se puede tocar", "el sistema viejo", "el core"; o al evaluar si una capacidad legada se puede reutilizar, envolver o hay que reemplazarla afuera. Convierte lo descubierto en una decisión ortogonal explícita.
---

# Ingeniería inversa de código legado

Entender el legado para **aprovecharlo**, no para arreglarlo. El resultado no es un informe: es una decisión ortogonal fundamentada en evidencia.

Esta skill trabaja junto con `arquitectura-ortogonal`, que fija la norma. Aquí está el método.

## Regla de oro

**Read-only, siempre.** Durante la ingeniería inversa no se edita, no se refactoriza, no se "aprovecha para arreglar" nada del legado. Ni una línea, ni un comentario, ni un formateo.

Y el foco no es la implementación: es **qué casos de uso resuelve el legado y qué ventaja se saca de ellos para el objetivo actual**. El código se lee para responder eso, no para juzgarlo.

## Cuándo delegar

Si el legado es grande (más de ~20 archivos relevantes, o un repo completo desconocido), despachar el subagente **`explorador-legado`**: es read-only por construcción y devuelve un mapa comprimido en vez de volcar código en el contexto principal.

Encargo típico: *"Mapear entrypoints, contratos y side effects de `<ruta>` para el caso de uso `<X>`. Tabla `archivo:línea`. No proponer arreglos."*

## Protocolo — siete pasos, en orden

### 1. Ubicar

- Leer `.claude/legacy-map.json`. ¿Está declarado? ¿Qué `acceso` hay (`codigo`, `bd`, `docs`, `api`)?
- Si no está declarado pero tiene señales de legado, proponer `/legado <ruta>` antes de seguir.
- Declarar en voz alta el alcance: qué se va a mapear y qué queda fuera.

### 2. Casos de uso primero

Antes de abrir un solo archivo de implementación:

- ¿Qué problema de negocio resuelve esta pieza?
- ¿Quién la consume hoy — usuarios, sistemas, procesos programados?
- ¿Qué journeys o procesos de negocio se caen si deja de funcionar?
- ¿Qué reglas de negocio son suyas y de nadie más?

Fuentes: documentación, nombres de endpoints y tablas, pruebas si existen, colecciones de Postman, tickets, y el propio usuario. **Preguntar al usuario es parte del método**, no un fallback.

Este paso es el que cambia el resultado. Saltarlo produce integraciones que copian la implementación en vez de aprovechar la capacidad.

### 3. Superficie utilizable

Qué puedo consumir **desde afuera, sin tocar nada**:

| Tipo de superficie | Dónde buscar |
| --- | --- |
| HTTP | controllers, rutas, Swagger/OpenAPI, `*.asmx`, WCF `*.svc`, colecciones Postman |
| Mensajería | publishers, consumers, tópicos, colas, esquemas de evento |
| Batch / archivos | jobs programados, carpetas de intercambio, exportaciones, FTP |
| Binaria | ensamblados, paquetes, interfaces públicas de librerías |
| Datos | vistas, procedimientos almacenados, tablas (solo lectura, y solo para entender) |

Para cada superficie encontrada, anotar: **contrato real vs. contrato documentado**. Divergen casi siempre; manda el real. Registrar versión, autenticación, formato, y si es estable o cambia con cada release.

### 4. Comportamiento

Lo que el contrato no dice y rompe integraciones:

- **Side effects**: qué muta además de responder — estado, correos, cobros, integraciones con terceros.
- **Transaccionalidad**: ¿es atómico? ¿qué queda a medias si falla?
- **Idempotencia**: ¿repetir la llamada duplica algo?
- **Acoplamiento temporal**: orden obligatorio de llamadas, sesiones, estado previo.
- **Límites**: timeouts, tamaños, cuotas, ventanas de proceso, horarios de batch.
- **Autenticación y permisos**: qué identidad exige y quién la otorga.
- **Dependencias externas**: terceros de los que depende y que heredaré al consumirlo.

Evidencia siempre con `archivo:línea`. Sin evidencia, se marca como **supuesto** y se declara como tal.

### 5. Clasificar cada capacidad

Una fila por capacidad encontrada:

| Clasificación | Significa | Qué habilita |
| --- | --- | --- |
| `reutilizable por contrato` | Expone superficie estable y suficiente | Consumir directo |
| `reutilizable con adaptador` | Sirve, pero con otra forma o vocabulario | Adaptador o capa anticorrupción afuera |
| `no reutilizable` | Solo accesible tocando internals o su BD | Construir la capacidad afuera; no forzar la integración |
| `trampa` | Parece utilizable pero tiene side effects ocultos, no es idempotente o es inestable | Evitar; documentar por qué |

### 6. Traducir a ventaja

Para el objetivo actual, declarar el peldaño del camino obligatorio y por qué los anteriores no bastaron:

1. **Reutilizar** — el legado ya lo resuelve y expone contrato usable.
2. **Componer** — combinar dos o más capacidades existentes, sin modificarlas.
3. **Configurar** — la necesidad es una variación de comportamiento ya soportada.
4. **Crear** — hay que construir afuera; declarar qué del legado se reutiliza igualmente.

### 7. Patrón, riesgos y medición

- Elegir el patrón de conexión en `arquitectura-ortogonal/references/patrones.md`. Si el legado no expone contrato usable, ver ahí la sección "Cuando el legado no expone contrato".
- Riesgos heredados: qué me rompe si el legado cambia, y cómo lo aíslo.
- Medición: cómo sabremos que funcionó.

## Prohibiciones duras

- **No proponer editar el legado.** Si el diseño lo exige, es excepción del comité de arquitectura, no una tarea.
- **No integrarse por base de datos.** Leerla para entender es válido; escribir o depender de su esquema en tiempo de ejecución es anti-patrón.
- **No copiar lógica de negocio.** Duplicar reglas es el fallo que más caro se paga. Consumir por contrato o construir afuera con dueño claro.
- **No importar tipos, esquemas ni DTOs internos** del legado en artefactos nuevos. Traducir en capa anticorrupción.
- **No afirmar sin evidencia.** Cada afirmación con `archivo:línea`, endpoint o documento; lo demás es supuesto declarado.

## Formato de salida

En chat, sin generar archivos. Compacto:

```
## Legado: <id> — <ruta o servicio>
Alcance mapeado: <qué se revisó> · Fuera de alcance: <qué no>

### Casos de uso que resuelve
- <caso> — consumido por <quién>

### Capacidades
| Capacidad | Superficie | Clasificación | Evidencia | Riesgo |
| --- | --- | --- | --- | --- |
| … | POST /api/x | reutilizable por contrato | Controller.cs:88 | sin idempotencia |

### Supuestos sin verificar
- <supuesto> — cómo verificarlo

### Decisión ortogonal
Peldaño: <reutilizar|componer|configurar|crear> — porque <razón>
Patrón: <patrón> — conexión: <contrato>

### Cinco preguntas
1. Reutilizamos: …
2. Artefacto nuevo: …
3. Conecta sin tocar: …
4. Capacidad reutilizable que deja: …
5. Cómo sabremos que funcionó: …
```

## Errores frecuentes

- Empezar por el código en vez de por los casos de uso → se termina replicando la implementación.
- Confiar en el Swagger sin verificar contra el código o una llamada real.
- Confundir "puedo leer la tabla" con "puedo integrarme por la tabla".
- Mapear todo el legado en vez del recorte que sirve al objetivo actual.
- Terminar el análisis sin decisión: un mapa sin peldaño ni patrón no sirve.

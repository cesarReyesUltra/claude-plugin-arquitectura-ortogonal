# Escenarios de verificación

Dos bloques: el hook se prueba automáticamente; las skills, los comandos y el agente se prueban conversando.

## A. Hook `guardia-legado` — automático

```bash
node tests/guardia-legado.test.mjs
```

Casos cubiertos:

| # | Entrada | Esperado |
| --- | --- | --- |
| 1 | `Write` sobre ruta dentro de un glob legado | `permissionDecision: "ask"` |
| 2 | `Write` sobre ruta fuera del legado | sin salida |
| 3 | `Edit` sobre ruta legada con `politica: warn` | `systemMessage` + `additionalContext`, sin `permissionDecision` |
| 4 | `Bash` con comando de escritura sobre ruta legada | `ask` |
| 5 | `Bash` con comando de solo lectura sobre ruta legada | sin salida |
| 6 | Proyecto sin `.claude/legacy-map.json` | sin salida |
| 7 | Manifiesto corrupto | sin salida, exit 0 |
| 8 | `politica: allow` | sin salida |
| 9 | Glob sin comodines declarado como carpeta | `ask` para archivos dentro |
| 10 | Rutas con `\` y mayúsculas (Windows) | `ask` |

## B. Comportamiento del agente — manual

Correr cada prompt en un chat con el plugin instalado y un `legacy-map.json` cargado.

### 1. Capacidad nueva contra legado

> "Necesito agregar notificaciones por WhatsApp cuando se redime un punto. La redención vive en el core."

**Esperado:** clasifica `capacidad nueva` · invoca `ingenieria-inversa-legado` antes de diseñar · no propone tocar el core · elige un patrón de `patrones.md` (probablemente eventos + worker, o adaptador si el core no publica eventos) · responde las 5 preguntas.

**Falla si:** propone modificar el core "solo un poco", o diseña sin mapear el legado.

### 2. Error en producción

> "El endpoint de redención del core devuelve 500 desde ayer, hay que arreglarlo."

**Esperado:** clasifica `error en produccion` · permite tocar el legado con el cambio mínimo · no aprovecha para refactorizar.

**Falla si:** bloquea el arreglo citando la norma, o amplía el cambio más allá de restablecer el servicio.

### 3. Ampliación de alcance

> "Ya que estamos dentro del proyecto de facturación, agreguemos también el reporte de consumo."

**Esperado:** separa lo comprometido de lo nuevo · el reporte se rediseña afuera.

**Falla si:** acepta el agregado dentro del core por estar "ya adentro".

### 4. RNF que exige tocar el core

> "Hay que meterle caché al core para bajar la latencia de consultas."

**Esperado:** marca `excepcion` · documenta justificación · declara que la aprueba el comité de arquitectura · no la ejecuta como aprobada · propone alternativa afuera si existe.

**Falla si:** procede sin marcar la excepción, o se niega en seco sin encaminarla.

### 5. Guardia en acción

> "Edita `<ruta legada>/Servicio.cs` y agrega un método nuevo."

**Esperado:** el hook interrumpe con la norma citada y el `id` del legado · el agente explica la norma y ofrece el diseño ortogonal equivalente.

**Falla si:** la edición pasa sin advertencia.

### 6. Legado no declarado

> "Revisa `<carpeta con .NET Framework y sin tests>` y agrégale una integración."

**Esperado:** detecta señales de legado · propone `/legado` · no escribe el manifiesto sin confirmación.

### 7. Delegación

> "Mapea el módulo de reservas del core para ver qué puedo reutilizar." (sobre un repo grande)

**Esperado:** despacha `explorador-legado` · vuelve con tabla `archivo:línea` · sin volcados de código · sin propuestas de arreglo.

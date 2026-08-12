# Plugin `arquitectura-ortogonal` — diseño

**Fecha:** 2026-08-12
**Estado:** aprobado para implementación
**Contexto:** Linex Loyalty — norma "Don't Touch the Monolith" + arquitectura ortogonal

---

## 1. Problema

La norma "Don't Touch the Monolith" ya existe como documento de negocio y como skill suelta. Dos huecos:

1. **No es portable.** Vive como archivos sueltos en un directorio; no se puede instalar en chats futuros ni compartir con el equipo.
2. **No cubre ingeniería inversa.** La norma dice *qué* no tocar y *dónde* construir, pero no dice *cómo entender* el código legado para aprovecharlo. Ese es el trabajo real: descubrir qué casos de uso ya resuelve el legado y qué ventaja se saca de ellos, sin modificarlo.

Además, el alcance real es más amplio que el monolito: **legado es todo código que el usuario declare como tal** — el core, sí, pero también servicios viejos, librerías, jobs, bases de datos. Cuando el agente detecta que trabaja contra legado, su atención debe moverse de "cómo lo arreglo" a "qué resuelve y cómo lo aprovecho sin tocarlo".

## 2. Objetivo

Un plugin de Claude Code instalable que haga que cualquier agente, en cualquier chat:

- Aplique la norma sin que se la recuerden.
- Antes de diseñar contra legado, haga ingeniería inversa disciplinada y read-only.
- Traduzca lo descubierto en una decisión ortogonal explícita (peldaño + patrón + 5 preguntas).
- Reciba una advertencia cuando esté por escribir sobre código legado declarado.

**No objetivos:** reemplazar al comité de arquitectura, planear la migración del monolito, generar documentación persistente del legado.

## 3. Decisiones tomadas

| # | Decisión | Alternativas descartadas |
| --- | --- | --- |
| D1 | **Advertir, no bloquear.** Hook `PreToolUse` → `permissionDecision: "ask"` | Bloqueo duro (`deny`): demasiada fricción, rompe correcciones legítimas de producción. Solo guía: no atrapa descuidos. |
| D2 | **Manifiesto + heurística.** `.claude/legacy-map.json` es la fuente de verdad; el agente propone entradas, nunca las escribe solo | Solo declaración verbal (se pierde entre sesiones). Solo heurística (falsos positivos, hook sin base). |
| D3 | **Salida en chat, sin artefactos.** La ingeniería inversa se reporta en la conversación | Fichas de capacidad + ADR versionados: ceremonia no deseada. |
| D4 | **JSON, no YAML,** para el manifiesto | YAML es más legible pero exige parser/dependencia en el hook. |
| D5 | **Agente explorador sin `Bash`/`Edit`/`Write`** | Con Bash podría escribir. Read/Grep/Glob = garantía física de no-escritura. |
| D6 | **Dos skills separadas,** no una | Un solo `description` dispara mal: la norma y la ingeniería inversa se activan en momentos distintos. |

## 4. Arquitectura

```
plugin-claude/                          (repo del plugin, también marketplace)
├── .claude-plugin/
│   ├── plugin.json                     manifiesto del plugin
│   └── marketplace.json                para instalarlo en chats futuros
├── skills/
│   ├── arquitectura-ortogonal/
│   │   ├── SKILL.md                    la norma (ampliada a "legado declarado")
│   │   └── references/patrones.md      catálogo de patrones ortogonales
│   └── ingenieria-inversa-legado/
│       └── SKILL.md                    protocolo de descubrimiento read-only
├── agents/
│   └── explorador-legado.md            subagente read-only
├── commands/
│   ├── legado.md                       /legado — registrar en el manifiesto
│   └── ortogonal.md                    /ortogonal — evaluar tarea contra la norma
├── hooks/
│   └── hooks.json                      PreToolUse → guardia-legado
├── scripts/
│   └── guardia-legado.mjs              Node, sin dependencias
├── templates/
│   └── legacy-map.json                 plantilla del manifiesto
├── tests/
│   └── escenarios.md                   verificación manual
└── docs/                               fuentes de negocio y specs
```

### Flujo

```
tarea del usuario
   │
   ├─ ¿toca sistema en operación o legado declarado?
   │        │ no → trabajo normal
   │        │ sí
   │        ▼
   │   skill arquitectura-ortogonal  ── clasifica la tarea
   │        │   bug prod / proyecto en curso → permitido, cambio mínimo
   │        │   capacidad nueva → prohibido tocar; sigue ↓
   │        │   RNF / habilitar reutilización → EXCEPCIÓN, escala al comité
   │        ▼
   │   skill ingenieria-inversa-legado ── 7 pasos, read-only
   │        │   (legado grande → despacha agente explorador-legado)
   │        ▼
   │   camino obligatorio: reutilizar → componer → configurar → crear
   │        ▼
   │   patrón (references/patrones.md) + 5 preguntas + medición
   │
   └─ si alguna herramienta intenta escribir sobre ruta legada
            → hook guardia-legado → "ask" con la norma citada
```

## 5. Componentes

### 5.1 Manifiesto `.claude/legacy-map.json`

Vive en el **proyecto consumidor**, no en el plugin. Ausente ⇒ el hook pasa callado.

```json
{
  "version": 1,
  "politica": { "al_escribir": "ask" },
  "legado": [
    {
      "id": "core-loyalty",
      "tipo": "monolito",
      "rutas": ["c:/Proyectos/legacy/Core/**"],
      "contratos": ["https://core/swagger.json"],
      "acceso": ["codigo", "bd", "docs"],
      "nota": "core en operación — solo bugs de producción"
    }
  ]
}
```

- `tipo`: `monolito` | `servicio` | `libreria` | `bd` | `api` | `job` | `frontend`
- `rutas`: globs; separador `/` normalizado, comparación case-insensitive (Windows)
- `politica.al_escribir`: `ask` (defecto) | `warn` | `allow`
- `acceso`: qué fuentes hay disponibles para ingeniería inversa

### 5.2 Skill `arquitectura-ortogonal`

Base: el `SKILL.md` actual. Cambios:

1. Sustituir "el monolito" por **"el sistema en operación o cualquier código legado declarado"** donde aplique; el monolito pasa a ser el caso principal, no el único.
2. Nuevo paso en el protocolo: si la tarea toca legado → **invocar `ingenieria-inversa-legado` antes de diseñar**.
3. Sección de detección: cómo consultar `.claude/legacy-map.json` y qué señales heurísticas proponen marcar algo como legado.
4. Se conservan íntegros: la norma, los dos casos permitidos, la excepción del comité, el camino obligatorio, las 5 preguntas, las señales de alerta y el lenguaje (PoV, nunca MVP/PoC).

### 5.3 Skill `ingenieria-inversa-legado`

Protocolo, siempre en orden:

1. **Ubicar** — consultar el manifiesto; si no está, proponer `/legado`.
2. **Casos de uso primero** — qué problema de negocio resuelve, quién lo consume, qué journeys sostiene. Antes de leer implementación.
3. **Superficie utilizable** — entrypoints reales (endpoints, colas, eventos, jobs, SPs, ensamblados); contrato real vs. documentado.
4. **Comportamiento** — side effects, estado que muta, transacciones, auth, timeouts, idempotencia, dependencias externas.
5. **Clasificar cada capacidad** — `reutilizable por contrato` / `reutilizable con adaptador` / `no reutilizable (acoplada a internals)` / `trampa (side effect oculto)`.
6. **Traducir a ventaja** — para el objetivo actual, qué peldaño habilita.
7. **Patrón, riesgos y medición** — elegir de `patrones.md`.

Prohibiciones duras: no proponer editar el legado; no integrar por base de datos (leerla solo para entender); no copiar lógica; no importar tipos internos.

Formato de salida fijo: tabla de capacidades → veredicto → peldaño → patrón → 5 preguntas respondidas.

### 5.4 Agente `explorador-legado`

`tools: [Read, Grep, Glob]`. Sin Edit/Write/Bash. Se despacha cuando el legado es grande. Devuelve mapa comprimido (`archivo:línea`), nunca volcados de código. Prohibido proponer arreglos.

### 5.5 Comandos

| Comando | Qué hace |
| --- | --- |
| `/legado <ruta\|servicio> [tipo]` | Registra la entrada en `.claude/legacy-map.json`; crea el archivo desde la plantilla si falta. Confirma antes de escribir. |
| `/ortogonal [tarea]` | Clasifica la tarea, recorre el camino obligatorio, responde las 5 preguntas y entrega veredicto en chat. |

### 5.6 Hook `guardia-legado`

- Evento: `PreToolUse`, matcher `Edit|Write|MultiEdit|NotebookEdit|Bash`.
- Ejecuta `node "${CLAUDE_PLUGIN_ROOT}/scripts/guardia-legado.mjs"`, sin dependencias.
- Lee `.claude/legacy-map.json` desde el directorio del proyecto (`cwd` del payload).
- Match: para herramientas de archivo, `file_path` contra los globs; para `Bash`, substring de ruta legada en el comando.
- Salida en coincidencia:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "ask",
    "permissionDecisionReason": "..."
  }
}
```

- El motivo cita la norma, el `id` del legado y los dos casos permitidos.
- Sin manifiesto, sin coincidencia, o ante cualquier error: salida vacía, código 0. **El hook nunca rompe la sesión.**

## 6. Verificación

`tests/escenarios.md`, cinco escenarios manuales:

1. Feature nueva contra legado → el agente hace ingeniería inversa y diseña afuera.
2. Bug de producción en el core → permitido, cambio mínimo.
3. Ampliación de alcance de proyecto en curso → rediseñar afuera.
4. RNF que exige tocar el core → marcado como excepción del comité.
5. Escritura directa sobre ruta legada → el hook pregunta.

El hook se prueba además de forma aislada, alimentándole payloads JSON por stdin y verificando la salida.

## 7. Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El hook falla y bloquea la sesión | try/catch total, salida vacía y exit 0 ante cualquier error |
| Dos skills compiten por dispararse | `description` disjuntos: norma = diseñar/decidir; ingeniería inversa = entender legado |
| El manifiesto queda desactualizado | Heurística que propone entradas al detectar señales |
| Falsos positivos en el match de Bash | Es advertencia (`ask`), no bloqueo; el usuario decide |

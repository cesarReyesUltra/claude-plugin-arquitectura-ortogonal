---
description: Registra código legado en el manifiesto .claude/legacy-map.json del proyecto
argument-hint: <ruta|servicio|url> [tipo]
allowed-tools: Read, Write, Edit, Glob, Grep
---

Registrar como legado: `$ARGUMENTS`

Objetivo: dejar la entrada en `.claude/legacy-map.json` del proyecto actual, para que la norma "Don't Touch the Monolith" y el guardia de legado la reconozcan.

## Pasos

1. **Leer el manifiesto** `.claude/legacy-map.json`. Si no existe, tomar la plantilla de `${CLAUDE_PLUGIN_ROOT}/templates/legacy-map.json` como base y vaciar el arreglo `legado`.

2. **Interpretar el argumento.** Puede ser una ruta de disco, un glob, un nombre de servicio o una URL de contrato. Si viene vacío, preguntar qué registrar.

3. **Completar la entrada** — inferir lo que se pueda del repo y preguntar solo lo que falte:
   - `id`: kebab-case, único.
   - `tipo`: `monolito` | `servicio` | `libreria` | `bd` | `api` | `job` | `frontend`.
   - `rutas`: globs normalizados con `/`. Para una carpeta, usar `<carpeta>/**`.
   - `contratos`: URLs de Swagger/OpenAPI, esquemas de evento o colecciones, si hay.
   - `acceso`: cuáles de `codigo`, `bd`, `docs`, `api` están disponibles para ingeniería inversa.
   - `nota`: por qué es legado y qué se permite hacerle.

4. **Mostrar la entrada propuesta y pedir confirmación.** No escribir sin un sí explícito.

5. **Escribir** el manifiesto con la entrada agregada, preservando el resto del contenido y el formato. Si el `id` ya existe, proponer actualizar esa entrada en vez de duplicarla.

6. **Confirmar** en una línea: qué quedó registrado y qué implica — a partir de ahora ese código solo se toca para corregir errores en producción o terminar proyectos en curso; todo lo nuevo nace afuera.

## Reglas

- El manifiesto es del proyecto, no del plugin: siempre `.claude/legacy-map.json` en la raíz del repo actual.
- No inventar rutas: verificar que existan con Glob antes de registrarlas. Si no existen, avisar y confirmar igual solo si el usuario lo pide.
- `politica.al_escribir` se deja en `ask` salvo instrucción contraria del usuario.

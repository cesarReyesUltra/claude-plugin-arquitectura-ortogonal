# Plugin `arquitectura-ortogonal`

> Uso interno — Linex Loyalty. Norma de arquitectura de obligatorio cumplimiento.

Norma **"Don't Touch the Monolith"** y arquitectura ortogonal, empaquetadas como plugin de Claude Code.

El código en operación no se toca para construir lo nuevo. Este plugin hace que el agente lo cumpla sin que se lo recuerden: entiende el legado por ingeniería inversa read-only, lo convierte en ventaja y construye afuera conectado por contrato.

## Qué trae

| Componente | Qué hace |
| --- | --- |
| Skill `arquitectura-ortogonal` | La norma: qué se toca, qué no, la única excepción, el camino obligatorio y las 5 preguntas |
| Skill `ingenieria-inversa-legado` | Protocolo de 7 pasos para entender el legado sin tocarlo y traducirlo en decisión ortogonal |
| Agente `explorador-legado` | Subagente read-only (`Read`/`Grep`/`Glob`): mapea legado grande sin poder modificarlo |
| `/legado <ruta> [tipo]` | Registra código legado en el manifiesto del proyecto |
| `/ortogonal [tarea]` | Clasifica la tarea y entrega la decisión ortogonal completa |
| Hook `guardia-legado` | Avisa antes de escribir sobre código legado declarado |

## Instalación

```text
/plugin marketplace add https://github.com/cesarReyesUltra/claude-plugin-arquitectura-ortogonal.git
/plugin install arquitectura-ortogonal@linex-arquitectura
```

Repositorio privado: Claude Code clona con tu `git` local, así que basta con tener credenciales configuradas (Git Credential Manager, PAT o SSH). Sin acceso al repo, no hay instalación.

Desde una copia local, para desarrollo:

```text
/plugin marketplace add c:/ruta/al/repo
```

## Configuración por proyecto

El plugin no sabe qué es legado hasta que se lo dicen. En cada repo:

```text
/legado c:/Proyectos/legacy/Core monolito
```

Eso crea o actualiza `.claude/legacy-map.json`:

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
      "nota": "core en operación"
    }
  ]
}
```

- `tipo`: `monolito` · `servicio` · `libreria` · `bd` · `api` · `job` · `frontend`
- `politica.al_escribir`: `ask` (defecto, pide confirmación) · `warn` (solo avisa) · `allow` (guardia apagado)
- `acceso`: qué fuentes hay disponibles para ingeniería inversa

Sin manifiesto el guardia no interviene, pero las skills siguen activas: detectan señales de legado y proponen registrarlo.

## Cómo se usa

Normalmente no se invoca nada — las skills disparan solas cuando la tarea toca un sistema existente. Para forzarlo:

- `/ortogonal agregar notificaciones al checkout` — veredicto contra la norma.
- `/legado c:/Proyectos/ServicioViejo servicio` — registrar legado nuevo.

## La norma en una pantalla

El legado se toca **únicamente** para corregir errores en producción y terminar proyectos en curso, sin ampliar alcance. Fortalecer RNF o habilitar reutilización es la **única excepción**, y la aprueba el comité de arquitectura.

Todo lo nuevo nace afuera, siguiendo el camino obligatorio: **reutilizar → componer → configurar → crear**.

> Proteger el presente, construir el futuro afuera.

## Desarrollo

```bash
node tests/guardia-legado.test.mjs
```

13 pruebas del hook: match de globs, rutas Windows, políticas `ask`/`warn`/`allow`, manifiesto ausente o corrupto, comandos de shell. El hook no tiene dependencias — solo Node.

Los escenarios de comportamiento del agente son manuales: [tests/escenarios.md](tests/escenarios.md).

## Seguridad

El hook `guardia-legado` **ejecuta código** en cada `Edit`, `Write` y `Bash` de quien instale el plugin. Quien pueda escribir en este repositorio puede ejecutar código en las máquinas del equipo. Mantener `main` protegida y limitar el acceso de escritura.

## Documentos

- [Norma completa (pre-lectura de negocio)](docs/Dont-Touch-the-Monolith-Linex-Loyalty.md)
- [Diseño del plugin](docs/superpowers/specs/2026-08-12-plugin-arquitectura-ortogonal-design.md)
- [Escenarios de verificación](tests/escenarios.md)

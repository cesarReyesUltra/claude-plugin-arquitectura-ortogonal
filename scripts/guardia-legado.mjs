#!/usr/bin/env node
/**
 * guardia-legado — PreToolUse hook para la norma "Don't Touch the Monolith".
 *
 * Lee el payload del hook por stdin, busca `.claude/legacy-map.json` desde el
 * cwd del proyecto hacia arriba, y si la herramienta va a escribir sobre una
 * ruta declarada como legado, devuelve `permissionDecision: "ask"` con el
 * motivo citando la norma.
 *
 * Nunca rompe la sesion: ante cualquier error o ausencia de manifiesto,
 * termina en silencio con exit 0.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const MAX_NIVELES_ARRIBA = 6;

const HERRAMIENTAS_ARCHIVO = new Set([
  "Edit",
  "Write",
  "MultiEdit",
  "NotebookEdit",
]);

/** Comandos de shell que escriben. Evita avisar por un `cat` o un `grep`. */
const ESCRITURA_EN_SHELL =
  /(^|[^>])>>?[^>]|\brm\b|\bmv\b|\bcp\b|\bdd\b|\btee\b|\btruncate\b|sed\s+-i|perl\s+-i|\bgit\s+(checkout|restore|apply|reset|clean|add|commit|revert|stash)\b|\b(Set|Add|Clear)-Content\b|\bOut-File\b|\b(New|Remove|Copy|Move|Rename)-Item\b/i;

function normalizar(ruta) {
  return String(ruta).replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
}

/** Convierte un glob (`**`, `*`, `?`) en RegExp anclada. */
function globARegExp(glob) {
  const g = normalizar(glob);
  let out = "";
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === "*") {
      if (g[i + 1] === "*") {
        // `**` cruza separadores; `**/` tambien matchea cero segmentos.
        if (g[i + 2] === "/") {
          out += "(?:.*/)?";
          i += 2;
        } else {
          out += ".*";
          i += 1;
        }
      } else {
        out += "[^/]*";
      }
    } else if (c === "?") {
      out += "[^/]";
    } else if ("\\^$.|+()[]{}".includes(c)) {
      out += "\\" + c;
    } else {
      out += c;
    }
  }
  return new RegExp("^" + out + "$");
}

/** Prefijo literal del glob, hasta el primer comodin. Sirve para buscar en comandos de shell. */
function prefijoLiteral(glob) {
  const g = normalizar(glob);
  const corte = g.search(/[*?]/);
  const base = corte === -1 ? g : g.slice(0, corte);
  return base.replace(/\/+$/, "");
}

function rutaCoincide(rutaObjetivo, glob) {
  if (!rutaObjetivo) return false;
  const objetivo = normalizar(rutaObjetivo);
  const patron = normalizar(glob);
  if (globARegExp(patron).test(objetivo)) return true;
  // Glob sin comodines declarado como carpeta: cubre todo lo que hay dentro.
  if (!/[*?]/.test(patron)) {
    if (objetivo === patron || objetivo.startsWith(patron + "/")) return true;
  }
  return false;
}

function buscarManifiesto(cwd) {
  let dir = resolve(cwd || process.cwd());
  for (let i = 0; i <= MAX_NIVELES_ARRIBA; i++) {
    const candidato = join(dir, ".claude", "legacy-map.json");
    if (existsSync(candidato)) return candidato;
    const padre = dirname(dir);
    if (padre === dir) break;
    dir = padre;
  }
  return null;
}

function leerStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

/** Rutas que la llamada a la herramienta va a tocar. */
function rutasDeLaHerramienta(toolName, toolInput) {
  if (!toolInput || typeof toolInput !== "object") return [];
  const rutas = [];
  if (HERRAMIENTAS_ARCHIVO.has(toolName)) {
    for (const clave of ["file_path", "notebook_path", "path"]) {
      if (typeof toolInput[clave] === "string") rutas.push(toolInput[clave]);
    }
    if (Array.isArray(toolInput.edits)) {
      for (const e of toolInput.edits) {
        if (e && typeof e.file_path === "string") rutas.push(e.file_path);
      }
    }
  }
  return rutas;
}

function motivo(entrada, detalle) {
  const id = entrada.id || "sin-id";
  const tipo = entrada.tipo ? ` (${entrada.tipo})` : "";
  const nota = entrada.nota ? `\nNota del manifiesto: ${entrada.nota}` : "";
  return [
    `NORMA "Don't Touch the Monolith" — esto escribe sobre codigo legado declarado: ${id}${tipo}.`,
    detalle,
    "",
    "El legado se toca UNICAMENTE para:",
    "  1. Corregir errores en produccion (cambio minimo que restablece el servicio).",
    "  2. Terminar proyectos en curso, sin ampliar su alcance.",
    "",
    "Si esto es una capacidad nueva, feature, integracion o PoV: no se toca. Recorre el camino obligatorio",
    "(reutilizar -> componer -> configurar -> crear) y construye afuera, conectado por contrato.",
    "Si es RNF o habilitar reutilizacion: es EXCEPCION y la aprueba el comite de arquitectura, no el agente.",
    nota,
  ]
    .filter(Boolean)
    .join("\n");
}

function main() {
  const crudo = leerStdin();
  if (!crudo.trim()) return;

  let payload;
  try {
    payload = JSON.parse(crudo);
  } catch {
    return;
  }

  const toolName = payload.tool_name;
  const toolInput = payload.tool_input;
  const cwd = payload.cwd;

  const rutaManifiesto = buscarManifiesto(cwd);
  if (!rutaManifiesto) return;

  let manifiesto;
  try {
    manifiesto = JSON.parse(readFileSync(rutaManifiesto, "utf8"));
  } catch {
    return;
  }

  const politica = (manifiesto.politica && manifiesto.politica.al_escribir) || "ask";
  if (politica === "allow") return;

  const entradas = Array.isArray(manifiesto.legado) ? manifiesto.legado : [];
  if (entradas.length === 0) return;

  let hallazgo = null;

  const rutas = rutasDeLaHerramienta(toolName, toolInput);
  for (const entrada of entradas) {
    const globs = Array.isArray(entrada.rutas) ? entrada.rutas : [];
    for (const ruta of rutas) {
      for (const glob of globs) {
        if (rutaCoincide(ruta, glob)) {
          hallazgo = { entrada, detalle: `Ruta: ${ruta}` };
          break;
        }
      }
      if (hallazgo) break;
    }
    if (hallazgo) break;
  }

  if (!hallazgo && toolName === "Bash" && typeof toolInput?.command === "string") {
    const comando = toolInput.command;
    if (ESCRITURA_EN_SHELL.test(comando)) {
      const comandoNorm = normalizar(comando);
      for (const entrada of entradas) {
        const globs = Array.isArray(entrada.rutas) ? entrada.rutas : [];
        for (const glob of globs) {
          const prefijo = prefijoLiteral(glob);
          if (prefijo.length >= 4 && comandoNorm.includes(prefijo)) {
            hallazgo = { entrada, detalle: `Comando de escritura sobre: ${prefijo}` };
            break;
          }
        }
        if (hallazgo) break;
      }
    }
  }

  if (!hallazgo) return;

  const razon = motivo(hallazgo.entrada, hallazgo.detalle);

  if (politica === "warn") {
    process.stdout.write(
      JSON.stringify({
        systemMessage: `Guardia de legado: escritura sobre "${hallazgo.entrada.id}". ${hallazgo.detalle}`,
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          additionalContext: razon,
        },
      })
    );
    return;
  }

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: razon,
      },
    })
  );
}

try {
  main();
} catch {
  // El guardia nunca rompe la sesion.
}
process.exit(0);

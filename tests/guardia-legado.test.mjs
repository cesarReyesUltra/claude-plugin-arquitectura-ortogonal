#!/usr/bin/env node
/**
 * Pruebas del hook guardia-legado.
 * Ejecutar: node tests/guardia-legado.test.mjs
 */

import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const HOOK = resolve(aqui, "..", "scripts", "guardia-legado.mjs");

const raiz = mkdtempSync(join(tmpdir(), "guardia-legado-"));

/** Crea un proyecto de prueba con manifiesto opcional. Devuelve su cwd. */
function proyecto(nombre, manifiesto) {
  const dir = join(raiz, nombre);
  mkdirSync(join(dir, ".claude"), { recursive: true });
  if (manifiesto !== undefined) {
    const contenido =
      typeof manifiesto === "string" ? manifiesto : JSON.stringify(manifiesto, null, 2);
    writeFileSync(join(dir, ".claude", "legacy-map.json"), contenido, "utf8");
  }
  return dir;
}

function correr(cwd, toolName, toolInput) {
  const r = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({
      session_id: "test",
      cwd,
      hook_event_name: "PreToolUse",
      tool_name: toolName,
      tool_input: toolInput,
    }),
    encoding: "utf8",
  });
  return { code: r.status, out: (r.stdout || "").trim(), err: r.stderr || "" };
}

const MANIFIESTO_BASE = {
  version: 1,
  politica: { al_escribir: "ask" },
  legado: [
    {
      id: "core-loyalty",
      tipo: "monolito",
      rutas: ["c:/Proyectos/legacy/Core/**"],
      nota: "core en operacion",
    },
    {
      id: "servicio-viejo",
      tipo: "servicio",
      rutas: ["c:/Proyectos/legacy/ServicioViejo"],
    },
  ],
};

const casos = [];
let fallos = 0;

function prueba(nombre, fn) {
  casos.push([nombre, fn]);
}

function decisionDe(out) {
  if (!out) return null;
  try {
    return JSON.parse(out)?.hookSpecificOutput?.permissionDecision ?? null;
  } catch {
    return "JSON-INVALIDO";
  }
}

// 1
prueba("Write sobre ruta legada => ask", () => {
  const cwd = proyecto("p1", MANIFIESTO_BASE);
  const r = correr(cwd, "Write", { file_path: "c:/Proyectos/legacy/Core/src/Servicio.cs" });
  const d = decisionDe(r.out);
  if (d !== "ask") throw new Error(`esperaba ask, obtuve ${d} :: ${r.out}`);
  if (!/Don't Touch the Monolith/.test(r.out)) throw new Error("motivo no cita la norma");
  if (!/core-loyalty/.test(r.out)) throw new Error("motivo no cita el id del legado");
});

// 2
prueba("Write fuera del legado => sin salida", () => {
  const cwd = proyecto("p2", MANIFIESTO_BASE);
  const r = correr(cwd, "Write", { file_path: "c:/Proyectos/nuevo/Servicio.cs" });
  if (r.out !== "") throw new Error(`esperaba vacio, obtuve ${r.out}`);
});

// 3
prueba("politica warn => systemMessage sin permissionDecision", () => {
  const cwd = proyecto("p3", {
    ...MANIFIESTO_BASE,
    politica: { al_escribir: "warn" },
  });
  const r = correr(cwd, "Edit", { file_path: "c:/Proyectos/legacy/Core/A.cs" });
  const parsed = JSON.parse(r.out);
  if (!parsed.systemMessage) throw new Error("falta systemMessage");
  if (parsed.hookSpecificOutput.permissionDecision) throw new Error("no debia decidir");
  if (!parsed.hookSpecificOutput.additionalContext) throw new Error("falta additionalContext");
});

// 4
prueba("Bash con escritura sobre legado => ask", () => {
  const cwd = proyecto("p4", MANIFIESTO_BASE);
  const r = correr(cwd, "Bash", {
    command: 'echo "x" > c:/Proyectos/legacy/Core/config.txt',
  });
  const d = decisionDe(r.out);
  if (d !== "ask") throw new Error(`esperaba ask, obtuve ${d} :: ${r.out}`);
});

// 5
prueba("Bash de solo lectura sobre legado => sin salida", () => {
  const cwd = proyecto("p5", MANIFIESTO_BASE);
  const r = correr(cwd, "Bash", { command: "grep -r Redencion c:/Proyectos/legacy/Core" });
  if (r.out !== "") throw new Error(`esperaba vacio, obtuve ${r.out}`);
});

// 6
prueba("sin manifiesto => sin salida", () => {
  const cwd = proyecto("p6", undefined);
  const r = correr(cwd, "Write", { file_path: "c:/Proyectos/legacy/Core/A.cs" });
  if (r.out !== "") throw new Error(`esperaba vacio, obtuve ${r.out}`);
});

// 7
prueba("manifiesto corrupto => sin salida y exit 0", () => {
  const cwd = proyecto("p7", "{ esto no es json");
  const r = correr(cwd, "Write", { file_path: "c:/Proyectos/legacy/Core/A.cs" });
  if (r.out !== "") throw new Error(`esperaba vacio, obtuve ${r.out}`);
  if (r.code !== 0) throw new Error(`exit ${r.code}`);
});

// 8
prueba("politica allow => sin salida", () => {
  const cwd = proyecto("p8", { ...MANIFIESTO_BASE, politica: { al_escribir: "allow" } });
  const r = correr(cwd, "Write", { file_path: "c:/Proyectos/legacy/Core/A.cs" });
  if (r.out !== "") throw new Error(`esperaba vacio, obtuve ${r.out}`);
});

// 9
prueba("glob sin comodines cubre lo que hay dentro => ask", () => {
  const cwd = proyecto("p9", MANIFIESTO_BASE);
  const r = correr(cwd, "Write", {
    file_path: "c:/Proyectos/legacy/ServicioViejo/src/Handler.cs",
  });
  const d = decisionDe(r.out);
  if (d !== "ask") throw new Error(`esperaba ask, obtuve ${d}`);
  if (!/servicio-viejo/.test(r.out)) throw new Error("id equivocado");
});

// 10
prueba("rutas Windows con backslash y mayusculas => ask", () => {
  const cwd = proyecto("p10", MANIFIESTO_BASE);
  const r = correr(cwd, "Edit", {
    file_path: "C:\\Proyectos\\Legacy\\Core\\src\\Servicio.cs",
  });
  const d = decisionDe(r.out);
  if (d !== "ask") throw new Error(`esperaba ask, obtuve ${d}`);
});

// 11
prueba("manifiesto encontrado en directorio padre => ask", () => {
  const cwd = proyecto("p11", MANIFIESTO_BASE);
  const sub = join(cwd, "src", "modulo");
  mkdirSync(sub, { recursive: true });
  const r = correr(sub, "Write", { file_path: "c:/Proyectos/legacy/Core/A.cs" });
  const d = decisionDe(r.out);
  if (d !== "ask") throw new Error(`esperaba ask, obtuve ${d}`);
});

// 12
prueba("MultiEdit con edits anidados => ask", () => {
  const cwd = proyecto("p12", MANIFIESTO_BASE);
  const r = correr(cwd, "MultiEdit", {
    edits: [
      { file_path: "c:/Proyectos/nuevo/A.cs" },
      { file_path: "c:/Proyectos/legacy/Core/B.cs" },
    ],
  });
  const d = decisionDe(r.out);
  if (d !== "ask") throw new Error(`esperaba ask, obtuve ${d}`);
});

// 13
prueba("stdin vacio => sin salida y exit 0", () => {
  const r = spawnSync(process.execPath, [HOOK], { input: "", encoding: "utf8" });
  if ((r.stdout || "").trim() !== "") throw new Error("esperaba vacio");
  if (r.status !== 0) throw new Error(`exit ${r.status}`);
});

for (const [nombre, fn] of casos) {
  try {
    fn();
    console.log(`  ok   ${nombre}`);
  } catch (e) {
    fallos++;
    console.log(`  FALLA ${nombre}\n        ${e.message}`);
  }
}

rmSync(raiz, { recursive: true, force: true });

console.log(`\n${casos.length - fallos}/${casos.length} pruebas ok`);
process.exit(fallos === 0 ? 0 : 1);

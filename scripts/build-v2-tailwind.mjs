// Compila el sistema de diseño Tailwind del motor V2 a un string estático que
// lib/site/v2-render.ts incrusta en cada <style> generado. El sitio publicado
// (y el ZIP exportable) debe seguir siendo un HTML autocontenido, así que la
// compilación ocurre una sola vez aquí, no en cada request.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const entry = resolve(root, "lib/site/v2-tailwind/entry.css");
const config = resolve(root, "tailwind.v2.config.ts");
const output = resolve(root, "lib/site/v2-tailwind.generated.ts");

const tmpDir = mkdtempSync(join(tmpdir(), "v2-tailwind-"));
const tmpOut = join(tmpDir, "v2.css");

try {
  execFileSync(
    "npx",
    ["tailwindcss", "-i", entry, "-o", tmpOut, "-c", config, "--minify"],
    { cwd: root, stdio: "inherit", shell: true },
  );
  const css = readFileSync(tmpOut, "utf8").trim();
  if (!css) throw new Error("Tailwind compiló un CSS vacío para el motor V2.");
  const banner = "// Generado por scripts/build-v2-tailwind.mjs — no editar a mano.\n";
  writeFileSync(output, `${banner}export const V2_TAILWIND_CSS = ${JSON.stringify(css)};\n`);
  console.log(`v2-tailwind: ${css.length} bytes escritos en ${output}`);
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}

import { readFileSync } from "node:fs";

const tsconfig = JSON.parse(readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8"));
const aliases = Object.keys(tsconfig.compilerOptions?.paths ?? {});
const shadowAliases = aliases.filter((alias) => alias !== "@/*");

if (shadowAliases.length > 0) {
  console.error(
    `Aliases exactos no permitidos en tsconfig.json: ${shadowAliases.join(", ")}. ` +
      "Usa la ruta canonica bajo app, components o lib."
  );
  process.exit(1);
}

console.log("Module layout: OK");

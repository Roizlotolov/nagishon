import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const root = dirname(fileURLToPath(import.meta.url));
// Every top-level demo/*.html is a build entry (index, iife, en, statement, ...).
const input = Object.fromEntries(
  readdirSync(root)
    .filter((f) => f.endsWith(".html"))
    .map((f) => [f.replace(/\.html$/, ""), resolve(root, f)]),
);

// tsup imports `.css` as text (loader: text); mirror that for Vite so ../src works in the demo.
const PREFIX = "\0nagish-css:";
const cssAsText: Plugin = {
  name: "nagish-css-as-text",
  enforce: "pre",
  resolveId(source, importer) {
    if (!source.endsWith(".css") || !importer || !importer.startsWith(resolve(root, "../src"))) return null;
    const resolved = resolve(dirname(importer), source);
    return PREFIX + resolved + ".js";
  },
  load(id) {
    if (!id.startsWith(PREFIX)) return null;
    return `export default ${JSON.stringify(readFileSync(id.slice(PREFIX.length, -3), "utf8"))};`;
  },
};


export default defineConfig({
  root,
  plugins: [cssAsText],
  build: { outDir: "dist", emptyOutDir: true, rollupOptions: { input } },
  server: { port: 5173 },
  preview: { port: 4173 },
});

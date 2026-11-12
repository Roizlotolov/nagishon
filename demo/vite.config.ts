import { readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = dirname(fileURLToPath(import.meta.url));
const input = Object.fromEntries(
  readdirSync(root)
    .filter((f) => f.endsWith(".html"))
    .map((f) => [f.replace(/\.html$/, ""), resolve(root, f)]),
);

export default defineConfig({
  root,
  build: { outDir: "dist", emptyOutDir: true, rollupOptions: { input } },
  server: { port: 5173 },
  preview: { port: 4173 },
});

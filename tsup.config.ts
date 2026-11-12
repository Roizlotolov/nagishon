import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";

const { version } = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };

const common = {
  target: "es2020",
  loader: { ".css": "text" as const },
  sourcemap: false,
  clean: false, // `npm run build` removes dist/ first (configs run in parallel)
};

export default defineConfig([
  {
    ...common,
    entry: { index: "src/index.ts" },
    format: ["esm"],
    dts: true,
  },
  {
    // ESM module exporting the NAGISH_PREPAINT string (dist/prepaint.module.js + prepaint.d.ts)
    ...common,
    entry: { prepaint: "src/prepaint.ts" },
    format: ["esm"],
    dts: true,
    outExtension: () => ({ js: ".module.js" }),
  },
  {
    ...common,
    entry: { "react/index": "src/react/index.tsx" },
    format: ["esm"],
    dts: true,
    external: ["react"],
    esbuildOptions(options) {
      options.jsx = "automatic";
    },
  },
  {
    ...common,
    entry: { "nagish.iife": "src/iife.ts" },
    format: ["iife"],
    globalName: "Nagish",
    define: { __NAGISH_VERSION__: JSON.stringify(version) },
    minify: true,
    outExtension: () => ({ js: ".js" }),
  },
  {
    // standalone synchronous snippet: dist/prepaint.js executes on load
    ...common,
    entry: { prepaint: "src/prepaint.run.ts" },
    format: ["iife"],
    minify: true,
    outExtension: () => ({ js: ".js" }),
  },
]);

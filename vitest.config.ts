import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { defineConfig } from "vitest/config";

// Mirrors tsup's `loader: { ".css": "text" }`: CSS imports resolve to the file content as a string.
const PREFIX = "\0css-text:";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.ts"],
  },
  plugins: [
    {
      name: "css-as-text",
      enforce: "pre",
      resolveId(source, importer) {
        if (!source.endsWith(".css") || source.startsWith(PREFIX)) return null;
        return PREFIX + (importer ? resolve(dirname(importer), source) : resolve(source)) + ".js";
      },
      load(id) {
        if (!id.startsWith(PREFIX)) return null;
        return `export default ${JSON.stringify(readFileSync(id.slice(PREFIX.length, -3), "utf8"))};`;
      },
    },
  ],
});

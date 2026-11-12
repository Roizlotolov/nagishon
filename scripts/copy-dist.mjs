import { cpSync, existsSync, mkdirSync } from "node:fs";

if (!existsSync("dist")) {
  console.error("dist/ not found: run `npm run build` first");
  process.exit(1);
}
mkdirSync("demo/dist", { recursive: true });
cpSync("dist", "demo/dist/dist", { recursive: true });

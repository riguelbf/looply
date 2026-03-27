#!/usr/bin/env node

import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const entrypoint = path.resolve(currentDir, "../dist/src/main.js");

if (!existsSync(entrypoint)) {
  console.error("Looply CLI is not built yet. Run `npm run build:cli` or `npm run build` first.");
  process.exit(1);
}

await import(pathToFileURL(entrypoint).href);

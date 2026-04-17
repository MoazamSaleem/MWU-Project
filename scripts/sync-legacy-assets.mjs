import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.join(rootDir, "assets");
const targetDir = path.join(rootDir, "public", "assets");

if (!existsSync(sourceDir)) {
  console.warn("[sync-legacy-assets] Source assets directory not found, skipping sync.");
  process.exit(0);
}

mkdirSync(path.dirname(targetDir), { recursive: true });
cpSync(sourceDir, targetDir, { recursive: true, force: true });

console.log("[sync-legacy-assets] Synced assets -> public/assets");

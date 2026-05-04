import https from "node:https";
import path from "node:path";
import fs from "fs-extra";
import { fileURLToPath } from "node:url";
import chalk from "chalk";

const PACKAGE_NAME = "@looply-cli/looply";
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 horas

interface UpdateCheckCache {
  lastChecked: string;
  lastVersion: string;
}

function resolvePackageJsonPath(): string {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(currentDir, "..", "..", "package.json");
}

function resolveCacheFilePath(): string {
  try {
    const pkgPath = resolvePackageJsonPath();
    const looplyDir = path.join(path.dirname(pkgPath), ".looply", "state");
    return path.join(looplyDir, "update-check.json");
  } catch {
    return "";
  }
}

function getCurrentVersion(): string {
  try {
    const pkgPath = resolvePackageJsonPath();
    const pkg = fs.readJsonSync(pkgPath);
    return (pkg as { version?: string }).version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function getCacheFilePath(): string {
  try {
    const cacheFile = resolveCacheFilePath();
    if (!cacheFile) return "";

    const dir = path.dirname(cacheFile);
    fs.ensureDirSync(dir);
    return cacheFile;
  } catch {
    return "";
  }
}

function readCheckCache(): UpdateCheckCache | null {
  try {
    const cacheFile = getCacheFilePath();
    if (!cacheFile || !fs.existsSync(cacheFile)) return null;

    const raw = fs.readJsonSync(cacheFile);
    return raw as UpdateCheckCache;
  } catch {
    return null;
  }
}

function writeCheckCache(cache: UpdateCheckCache): void {
  try {
    const cacheFile = getCacheFilePath();
    if (!cacheFile) return;

    fs.writeJsonSync(cacheFile, cache, { spaces: 2 });
  } catch {
    // silencioso: o cache e opcional
  }
}

function shouldCheck(): boolean {
  const cache = readCheckCache();
  if (!cache) return true;

  const elapsed = Date.now() - new Date(cache.lastChecked).getTime();
  return elapsed >= CHECK_INTERVAL_MS;
}

function fetchLatestVersion(): Promise<string | null> {
  return new Promise((resolve) => {
    const url = `https://registry.npmjs.org/${PACKAGE_NAME}/latest`;

    https.get(url, { timeout: 3000 }, (res) => {
      if (res.statusCode !== 200) {
        resolve(null);
        res.resume();
        return;
      }

      let body = "";
      res.on("data", (chunk: Buffer) => {
        body += chunk.toString();
      });
      res.on("end", () => {
        try {
          const data = JSON.parse(body);
          resolve(data.version ?? null);
        } catch {
          resolve(null);
        }
      });
      res.on("error", () => resolve(null));
    }).on("error", () => resolve(null))
      .on("timeout", function (this: { destroy: () => void }) {
        this.destroy();
        resolve(null);
      });
  });
}

function compareVersions(current: string, latest: string): boolean {
  const currentParts = current.split(".").map(Number);
  const latestParts = latest.split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    const c = currentParts[i] ?? 0;
    const l = latestParts[i] ?? 0;
    if (l > c) return true;
    if (l < c) return false;
  }

  return false;
}

export async function checkForUpdates(): Promise<void> {
  try {
    if (!shouldCheck()) return;

    const currentVersion = getCurrentVersion();
    if (currentVersion === "0.0.0") return;

    const latestVersion = await fetchLatestVersion();
    if (!latestVersion) {
      writeCheckCache({ lastChecked: new Date().toISOString(), lastVersion: currentVersion });
      return;
    }

    writeCheckCache({ lastChecked: new Date().toISOString(), lastVersion: latestVersion });

    if (compareVersions(currentVersion, latestVersion)) {
      console.log("");
      console.log(
        chalk.yellow(" Update available! ") +
        chalk.dim(`${PACKAGE_NAME}`) +
        chalk.yellow(` ${currentVersion}`) +
        chalk.dim(" -> ") +
        chalk.green(`${latestVersion}`)
      );
      console.log(
        chalk.dim("   Run ") +
        chalk.cyan("npm install -g @looply-cli/looply") +
        chalk.dim(" to update")
      );
      console.log("");
    }
  } catch {
    // silencioso: update check nunca deve quebrar o comando
  }
}

import { spawn } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import { connect } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function resolveDocsSiteRoot(sourceRoot: string): string {
  return path.join(sourceRoot, "docs-site");
}

export function resolveDocsDistIndex(sourceRoot: string): string {
  return path.join(resolveDocsSiteRoot(sourceRoot), ".vitepress", "dist", "index.html");
}

function resolveDocsServerStateFile(sourceRoot: string): string {
  return path.join(resolveDocsSiteRoot(sourceRoot), ".vitepress", "docs-server.json");
}

export function docsSiteExists(sourceRoot: string): boolean {
  return fs.existsSync(resolveDocsSiteRoot(sourceRoot));
}

export function docsDistExists(sourceRoot: string): boolean {
  return fs.existsSync(resolveDocsDistIndex(sourceRoot));
}

export async function runDocsScript(sourceRoot: string, script: "generate" | "build" | "dev" | "preview"): Promise<void> {
  const env = script === "dev"
    ? {
        ...process.env,
        LOOPLY_DOCS_USE_POLLING: process.env.LOOPLY_DOCS_USE_POLLING ?? "true",
        LOOPLY_DOCS_POLL_INTERVAL: process.env.LOOPLY_DOCS_POLL_INTERVAL ?? "1000",
        CHOKIDAR_USEPOLLING: process.env.CHOKIDAR_USEPOLLING ?? "true",
        CHOKIDAR_INTERVAL: process.env.CHOKIDAR_INTERVAL ?? "1000"
      }
    : process.env;

  await runCommand("npm", ["run", script], resolveDocsSiteRoot(sourceRoot), env);
}

export async function openDocsIndex(sourceRoot: string): Promise<{ opened: boolean; target: string; targetUrl: string }> {
  const target = resolveDocsDistIndex(sourceRoot);
  let targetUrl = toFileUrl(target);
  try {
    targetUrl = await ensureDocsServer(sourceRoot);
  } catch {
    targetUrl = toFileUrl(target);
  }
  const openers = resolveOpenCommands(targetUrl);

  for (const opener of openers) {
    const opened = await tryOpen(opener.command, opener.args);
    if (opened) {
      return { opened: true, target, targetUrl };
    }
  }

  return { opened: false, target, targetUrl };
}

function resolveOpenCommands(targetUrl: string): Array<{ command: string; args: string[] }> {
  switch (process.platform) {
    case "darwin":
      return [{ command: "open", args: [targetUrl] }];
    case "win32":
      return [{ command: "cmd", args: ["/c", "start", "", targetUrl] }];
    default:
      return [
        { command: "xdg-open", args: [targetUrl] },
        { command: "gio", args: ["open", targetUrl] },
        { command: "sensible-browser", args: [targetUrl] }
      ];
  }
}

async function tryOpen(command: string, args: string[]): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(value);
    };

    try {
      const child = spawn(command, args, {
        stdio: "ignore",
        detached: true
      });

      child.on("error", () => finish(false));
      child.on("spawn", () => {
        child.unref();
        finish(true);
      });
      setTimeout(() => finish(false), 750);
    } catch {
      finish(false);
    }
  });
}
function toFileUrl(target: string): string {
  const normalized = path.resolve(target).replaceAll(path.sep, "/");
  return `file://${normalized}`;
}

async function ensureDocsServer(sourceRoot: string): Promise<string> {
  const stateFile = resolveDocsServerStateFile(sourceRoot);
  const existing = await readDocsServerState(stateFile);
  if (existing && await canConnect(existing.host, existing.port)) {
    return existing.url;
  }

  const host = "127.0.0.1";
  const distRoot = path.dirname(resolveDocsDistIndex(sourceRoot));
  const childModule = fileURLToPath(new URL("./docs-preview-server.js", import.meta.url));

  for (let port = 4173; port < 4178; port += 1) {
    const child = spawn(process.execPath, [childModule, distRoot, host, String(port), stateFile], {
      stdio: "ignore",
      detached: true
    });
    child.unref();

    const started = await waitForServer(host, port, 1200);
    if (started) {
      return `http://${host}:${port}/`;
    }
  }

  throw new Error("Could not start docs preview server");
}

async function readDocsServerState(stateFile: string): Promise<{ host: string; port: number; url: string } | null> {
  try {
    const raw = JSON.parse(await fsp.readFile(stateFile, "utf8"));
    if (
      typeof raw.host === "string" &&
      typeof raw.port === "number" &&
      raw.port >= 0 &&
      raw.port < 65536 &&
      typeof raw.url === "string"
    ) {
      return raw;
    }
  } catch {
    // ignore
  }

  return null;
}

function canConnect(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect({ host, port });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.setTimeout(300, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(host: string, port: number, timeoutMs: number): Promise<boolean> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await canConnect(host, port)) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return false;
}

function runCommand(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      env
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`));
    });
  });
}

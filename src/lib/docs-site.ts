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
  await runCommand("npm", ["run", script], resolveDocsSiteRoot(sourceRoot));
}

export async function openDocsIndex(sourceRoot: string): Promise<{ opened: boolean; target: string; targetUrl: string }> {
  const target = resolveDocsDistIndex(sourceRoot);
  const targetUrl = await ensureDocsServer(sourceRoot);
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
    try {
      const child = spawn(command, args, {
        stdio: "ignore",
        detached: true
      });

      child.on("error", () => resolve(false));
      child.on("spawn", () => {
        child.unref();
        resolve(true);
      });
    } catch {
      resolve(false);
    }
  });
}

async function ensureDocsServer(sourceRoot: string): Promise<string> {
  const stateFile = resolveDocsServerStateFile(sourceRoot);
  const existing = await readDocsServerState(stateFile);
  if (existing && await canConnect(existing.host, existing.port)) {
    return existing.url;
  }

  const host = "127.0.0.1";
  const childModule = fileURLToPath(new URL("./docs-preview-server.js", import.meta.url));
  for (let port = 4173; port < 4183; port += 1) {
    const child = spawn(process.execPath, [childModule, path.dirname(resolveDocsDistIndex(sourceRoot)), host, String(port), stateFile], {
      stdio: "ignore",
      detached: true
    });
    child.unref();

    const url = `http://${host}:${port}/`;
    try {
      await waitForServer(host, port);
      return url;
    } catch {
      // try next port
    }
  }

  throw new Error("Could not start the local docs server");
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

async function waitForServer(host: string, port: number): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 5000) {
    if (await canConnect(host, port)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Docs server did not start on http://${host}:${port}/`);
}

function runCommand(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      env: process.env
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

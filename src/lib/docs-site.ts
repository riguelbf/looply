import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export function resolveDocsSiteRoot(sourceRoot: string): string {
  return path.join(sourceRoot, "docs-site");
}

export function resolveDocsDistIndex(sourceRoot: string): string {
  return path.join(resolveDocsSiteRoot(sourceRoot), ".vitepress", "dist", "index.html");
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
  const targetUrl = toFileUrl(target);
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

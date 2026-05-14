import path from "node:path";
import { execSync } from "node:child_process";
import fs from "fs-extra";
import { resolveLooplySourceRoot } from "./source-root.js";
import { loadMcpTemplate, type McpFrontmatter } from "./mcp.js";

export interface McpActivation {
  name: string;
  label: string;
  package: string;
  activatedAt: string;
  hosts: string[];
}

export interface McpState {
  version: number;
  activations: McpActivation[];
}

function resolveMcpStateFile(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "custom", "mcp", "state.json");
}

function resolveMcpCredentialsDir(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "custom", "mcp");
}

export function resolveMcpCredentialsFile(targetRoot: string, name: string): string {
  return path.join(resolveMcpCredentialsDir(targetRoot), `${name}.json`);
}

export async function loadMcpState(targetRoot: string): Promise<McpState> {
  const file = resolveMcpStateFile(targetRoot);
  if (!(await fs.pathExists(file))) {
    return { version: 1, activations: [] };
  }
  const raw = await fs.readJson(file);
  if (typeof raw !== "object" || raw === null) {
    return { version: 1, activations: [] };
  }
  return raw as McpState;
}

export async function saveMcpState(targetRoot: string, state: McpState): Promise<void> {
  const file = resolveMcpStateFile(targetRoot);
  await fs.ensureDir(path.dirname(file));
  await fs.writeJson(file, state, { spaces: 2 });
}

export async function saveMcpCredentials(targetRoot: string, name: string, credentials: Record<string, string>): Promise<void> {
  const file = resolveMcpCredentialsFile(targetRoot, name);
  await fs.ensureDir(path.dirname(file));
  await fs.writeJson(file, credentials, { spaces: 2 });
}

export async function removeMcpCredentials(targetRoot: string, name: string): Promise<void> {
  const file = resolveMcpCredentialsFile(targetRoot, name);
  if (await fs.pathExists(file)) {
    await fs.remove(file);
  }
}

export function installMcpPackage(packageName: string): { ok: boolean; error?: string } {
  try {
    execSync(`npm install -g ${packageName}`, {
      stdio: "pipe",
      timeout: 120_000
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

export function getActiveHosts(targetRoot: string): string[] {
  const manifestFile = path.join(targetRoot, ".looply", "state", "install-manifest.json");
  if (!fs.existsSync(manifestFile)) {
    return [];
  }

  try {
    const manifest = fs.readJsonSync(manifestFile);
    const hosts = new Set<string>();
    for (const entry of (manifest as { installs: Array<{ host: string }> }).installs ?? []) {
      hosts.add(entry.host);
    }
    return Array.from(hosts);
  } catch {
    return [];
  }
}

function resolveHostMcpConfigPath(host: string): string {
  const home = process.env.HOME ?? process.env.USERPROFILE ?? "~";
  switch (host) {
    case "opencode":
      return path.join(home, ".opencode", "mcp.json");
    case "codex":
      return path.join(home, ".codex", "mcp.json");
    case "claude":
      return path.join(home, ".claude", "mcp.json");
    default:
      return "";
  }
}

function fillTemplate(template: string, credentials: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(credentials)) {
    result = result.replaceAll(`\${${key}}`, value);
  }
  return result;
}

export async function generateMcpConfig(targetRoot: string, name: string, template: McpFrontmatter, credentials: Record<string, string>): Promise<string[]> {
  const written: string[] = [];
  const sourceRoot = resolveLooplySourceRoot();

  for (const host of getActiveHosts(targetRoot)) {
    const templateStr = template.config_template[host as keyof typeof template.config_template];
    if (!templateStr || templateStr.trim() === "") {
      continue;
    }

    const configPath = resolveHostMcpConfigPath(host);
    if (!configPath) {
      continue;
    }

    await fs.ensureDir(path.dirname(configPath));

    let existing: Record<string, unknown> = {};
    if (await fs.pathExists(configPath)) {
      try {
        const raw = await fs.readJson(configPath);
        if (typeof raw === "object" && raw !== null) {
          existing = raw as Record<string, unknown>;
        }
      } catch {
        // file exists but is invalid, start fresh
      }
    }

    const filledConfig = fillTemplate(templateStr, credentials);
    const newServer = JSON.parse(filledConfig) as Record<string, unknown>;

    const merged = {
      ...existing,
      mcpServers: {
        ...(existing.mcpServers as Record<string, unknown> ?? {}),
        ...(newServer.mcpServers as Record<string, unknown> ?? {})
      }
    };

    await fs.writeJson(configPath, merged, { spaces: 2 });
    written.push(configPath);
  }

  return written;
}

export async function removeMcpConfig(targetRoot: string, name: string): Promise<string[]> {
  const removed: string[] = [];

  for (const host of getActiveHosts(targetRoot)) {
    const configPath = resolveHostMcpConfigPath(host);
    if (!configPath || !(await fs.pathExists(configPath))) {
      continue;
    }

    try {
      const raw = await fs.readJson(configPath);
      if (typeof raw !== "object" || raw === null) {
        continue;
      }

      const config = raw as Record<string, unknown>;
      const servers = config.mcpServers as Record<string, unknown> | undefined;
      if (servers && servers[name]) {
        delete servers[name];
        if (Object.keys(servers).length === 0) {
          delete (config as Record<string, unknown>).mcpServers;
        }

        await fs.writeJson(configPath, config, { spaces: 2 });
        removed.push(configPath);
      }
    } catch {
      // file is invalid, skip
    }
  }

  return removed;
}

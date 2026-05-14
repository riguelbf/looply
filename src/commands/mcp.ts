import type { Command } from "commander";
import { cancel, confirm, isCancel, password, select, text } from "@clack/prompts";
import chalk from "chalk";
import { resolveLooplySourceRoot } from "../lib/source-root.js";
import { listMcpTemplates, loadMcpTemplate } from "../lib/mcp.js";
import {
  loadMcpState,
  saveMcpState,
  saveMcpCredentials,
  removeMcpCredentials,
  installMcpPackage,
  generateMcpConfig,
  removeMcpConfig,
  getActiveHosts
} from "../lib/mcp-state.js";
import { createSpinner, showIntro, showOutro } from "../ui/feedback.js";

export function registerMcpCommand(program: Command): void {
  const mcp = program
    .command("mcp")
    .description("Manage MCP (Model Context Protocol) server connections");

  mcp
    .command("list")
    .description("List available MCP servers")
    .option("--source-root <dir>", "looply source directory that contains packs/")
    .action(async (options) => {
      showIntro("looply mcp list");

      try {
        const sourceRoot = resolveLooplySourceRoot(options.sourceRoot);
        const templates = await listMcpTemplates(sourceRoot);
        const state = await loadMcpState(process.cwd());

        if (templates.length === 0) {
          console.log(chalk.dim("No MCP templates found"));
          showOutro("No MCPs available");
          return;
        }

        const activeMap = new Map(state.activations.map((a) => [a.name, a]));

        console.log(chalk.bold("Available MCP servers"));
        console.log("");
        for (const template of templates) {
          const active = activeMap.get(template.name);
          const status = active
            ? chalk.green(`active (${active.hosts.join(", ")})`)
            : chalk.dim("inactive");
          const envCount = template.env_vars.length;
          const envLabel = envCount === 1 ? "1 credential" : `${envCount} credentials`;

          console.log(`  ${chalk.cyan(template.name.padEnd(14))} ${chalk.bold(template.label)}  ${status}`);
          console.log(`  ${"".padEnd(14)} ${chalk.dim(template.description)}`);
          console.log(`  ${"".padEnd(14)} package: ${chalk.dim(template.package)}  |  ${chalk.yellow(envLabel)}`);
          console.log("");
        }

        showOutro(`${templates.length} MCP(s) available, ${state.activations.length} active`);
      } catch (error) {
        console.error(chalk.red(String(error)));
      }
    });

  mcp
    .command("activate")
    .description("Activate an MCP server interactively")
    .argument("[name]", "MCP server name to activate (omit for interactive selection)")
    .option("--source-root <dir>", "looply source directory that contains packs/")
    .option("--skip-install", "Skip npm package installation")
    .action(async (name: string | undefined, options) => {
      showIntro("looply mcp activate");

      try {
        const targetRoot = process.cwd();
        const sourceRoot = resolveLooplySourceRoot(options.sourceRoot);
        const state = await loadMcpState(targetRoot);

        let template;
        if (name) {
          template = await loadMcpTemplate(sourceRoot, name);
          if (!template) {
            console.error(chalk.red(`MCP "${name}" not found. Use 'looply mcp list' to see available MCPs.`));
            return;
          }
        } else {
          const templates = await listMcpTemplates(sourceRoot);
          if (templates.length === 0) {
            console.log(chalk.dim("No MCP templates found"));
            showOutro("No MCPs available");
            return;
          }

          const selected = await select({
            message: "Which MCP would you like to activate?",
            options: templates.map((t) => ({
              value: t.name,
              label: t.label,
              hint: t.description
            }))
          });

          if (isCancel(selected)) {
            cancel("MCP activation cancelled");
            return;
          }

          template = await loadMcpTemplate(sourceRoot, selected as string);
          if (!template) {
            return;
          }
        }

        const existing = state.activations.find((a) => a.name === template!.name);
        if (existing) {
          console.log(chalk.yellow(`MCP "${template!.label}" is already active on: ${existing.hosts.join(", ")}`));
          const reactivate = await confirm({
            message: "Reactivate and update credentials?",
            initialValue: false
          });
          if (isCancel(reactivate) || !reactivate) {
            cancel("MCP activation cancelled");
            return;
          }
        }

        console.log("");
        console.log(chalk.bold(template!.label));
        console.log(chalk.dim(template!.description));
        console.log("");

        // Story 03: Interactive questionnaire
        const credentials: Record<string, string> = {};
        for (const env of template!.env_vars) {
          const inputFn = env.type === "password" ? password : text;
          const value = await inputFn({
            message: `${env.label}:`,
            placeholder: env.prompt,
            validate: env.required
              ? (val: string) => {
                  if (!val || val.trim().length === 0) {
                    return `${env.label} is required`;
                  }
                  return;
                }
              : undefined
          });

          if (isCancel(value)) {
            cancel("MCP activation cancelled");
            return;
          }

          if (value && typeof value === "string" && value.trim()) {
            credentials[env.name] = value.trim();
          } else if (env.required) {
            console.log(chalk.red(`${env.label} is required`));
            return;
          }
        }

        console.log("");

        // Story 04: Auto-install npm package
        if (!options.skipInstall) {
          const installIt = await confirm({
            message: `Install ${chalk.cyan(template!.package)} globally?`,
            initialValue: true
          });

          if (isCancel(installIt)) {
            cancel("MCP activation cancelled");
            return;
          }

          if (installIt) {
            const loading = createSpinner(`Installing ${template!.package}...`);
            const result = installMcpPackage(template!.package);
            if (result.ok) {
              loading.stop(`Installed ${chalk.cyan(template!.package)}`);
            } else {
              loading.stop(chalk.yellow(`Installation warning: ${result.error}`));
              const continueAnyway = await confirm({
                message: "Installation may have failed. Continue anyway?",
                initialValue: false
              });
              if (isCancel(continueAnyway) || !continueAnyway) {
                cancel("MCP activation cancelled");
                return;
              }
            }
          }
        }

        // Story 06: Save credentials securely
        const credLoading = createSpinner("Saving credentials...");
        await saveMcpCredentials(targetRoot, template!.name, credentials);
        credLoading.stop("Credentials saved");

        // Story 05: Generate cross-host config
        const configLoading = createSpinner("Generating MCP configuration...");
        const written = await generateMcpConfig(targetRoot, template!.name, template!, credentials);
        configLoading.stop("Configuration generated");

        const hosts = getActiveHosts(targetRoot);

        // Update state
        const updated: typeof state = {
          ...state,
          activations: state.activations.filter((a) => a.name !== template!.name).concat({
            name: template!.name,
            label: template!.label,
            package: template!.package,
            activatedAt: new Date().toISOString(),
            hosts
          })
        };
        await saveMcpState(targetRoot, updated);

        console.log("");
        console.log(chalk.bold("Configuration generated:"));
        for (const file of written) {
          console.log(`  ${chalk.green("created/updated")} ${chalk.dim(file)}`);
        }
        console.log("");
        for (const host of hosts) {
          console.log(`  ${chalk.green("host")} ${chalk.cyan(host)}`);
        }
        console.log("");
        console.log(chalk.green(`MCP "${template!.label}" is now active.`));
        console.log(chalk.dim("Restart your AI host for changes to take effect."));

        showOutro(`MCP "${template!.name}" activated`);
      } catch (error) {
        console.error(chalk.red(String(error)));
      }
    });

  mcp
    .command("status")
    .description("Show active MCP servers per host")
    .action(async () => {
      showIntro("looply mcp status");

      const targetRoot = process.cwd();
      const state = await loadMcpState(targetRoot);

      if (state.activations.length === 0) {
        console.log(chalk.dim("No MCPs active. Use 'looply mcp activate' to set up your first MCP."));
        showOutro("No active MCPs");
        return;
      }

      console.log(chalk.bold("Active MCP servers"));
      console.log("");
      for (const activation of state.activations) {
        console.log(`  ${chalk.cyan(activation.name.padEnd(14))} ${chalk.bold(activation.label)}`);
        console.log(`  ${"".padEnd(14)} package: ${chalk.dim(activation.package)}`);
        console.log(`  ${"".padEnd(14)} hosts: ${chalk.green(activation.hosts.join(", "))}`);
        console.log(`  ${"".padEnd(14)} activated: ${chalk.dim(activation.activatedAt)}`);
        console.log("");
      }

      showOutro(`${state.activations.length} MCP(s) active`);
    });

  mcp
    .command("deactivate")
    .description("Deactivate an MCP server")
    .argument("<name>", "MCP server name to deactivate")
    .action(async (name: string) => {
      showIntro("looply mcp deactivate");

      const targetRoot = process.cwd();
      const state = await loadMcpState(targetRoot);
      const activation = state.activations.find((a) => a.name === name);

      if (!activation) {
        console.log(chalk.yellow(`MCP "${name}" is not active.`));
        showOutro("Nothing to deactivate");
        return;
      }

      const confirmed = await confirm({
        message: `Deactivate MCP "${activation.label}" from all hosts?`,
        initialValue: true
      });

      if (isCancel(confirmed) || !confirmed) {
        cancel("MCP deactivation cancelled");
        return;
      }

      const configLoading = createSpinner("Removing MCP configuration...");
      const removed = await removeMcpConfig(targetRoot, name);
      configLoading.stop("Configuration removed");

      await removeMcpCredentials(targetRoot, name);

      const updated: typeof state = {
        ...state,
        activations: state.activations.filter((a) => a.name !== name)
      };
      await saveMcpState(targetRoot, updated);

      console.log("");
      for (const file of removed) {
        console.log(`  ${chalk.yellow("removed")} ${chalk.dim(file)}`);
      }

      showOutro(`MCP "${name}" deactivated`);
    });
}

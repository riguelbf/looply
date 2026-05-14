import type { Command } from "commander";
import chalk from "chalk";
import { resolveLooplySourceRoot } from "../lib/source-root.js";
import { listMcpTemplates, loadMcpTemplate } from "../lib/mcp.js";
import { showIntro, showOutro } from "../ui/feedback.js";

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

        if (templates.length === 0) {
          console.log(chalk.dim("No MCP templates found"));
          showOutro("No MCPs available");
          return;
        }

        console.log(chalk.bold("Available MCP servers"));
        console.log("");
        for (const template of templates) {
          const envCount = template.env_vars.length;
          const envLabel = envCount === 1 ? "1 credential" : `${envCount} credentials`;
          console.log(
            `  ${chalk.cyan(template.name.padEnd(14))} ${chalk.bold(template.label)}`
          );
          console.log(
            `  ${"".padEnd(14)} ${chalk.dim(template.description)}`
          );
          console.log(
            `  ${"".padEnd(14)} package: ${chalk.dim(template.package)}  |  ${chalk.yellow(envLabel)}`
          );
          console.log("");
        }

        showOutro(`${templates.length} MCP(s) available`);
      } catch (error) {
        console.error(chalk.red(String(error)));
      }
    });

  mcp
    .command("activate")
    .description("Activate an MCP server interactively")
    .argument("[name]", "MCP server name to activate (omit for interactive selection)")
    .option("--source-root <dir>", "looply source directory that contains packs/")
    .action(async (name: string | undefined, options) => {
      showIntro("looply mcp activate");

      try {
        const sourceRoot = resolveLooplySourceRoot(options.sourceRoot);

        if (!name) {
          const templates = await listMcpTemplates(sourceRoot);
          if (templates.length === 0) {
            console.log(chalk.dim("No MCP templates found"));
            showOutro("No MCPs available");
            return;
          }

          console.log(chalk.bold("Available MCP servers:"));
          console.log("");
          for (const template of templates) {
            console.log(`  ${chalk.cyan(template.name)} - ${template.label}`);
          }
          console.log("");
          console.log(chalk.dim("Use 'looply mcp activate <name>' to activate a specific MCP"));
          console.log(chalk.dim("Interactive questionnaire coming in a future update"));
          showOutro("Run with a name to activate");
          return;
        }

        const template = await loadMcpTemplate(sourceRoot, name);
        if (!template) {
          console.error(chalk.red(`MCP "${name}" not found.`));
          console.log(chalk.dim("Use 'looply mcp list' to see available MCPs"));
          return;
        }

        console.log(chalk.bold(`${template.label}`));
        console.log(`  ${chalk.dim(template.description)}`);
        console.log("");
        console.log(`  Package: ${chalk.cyan(template.package)}`);
        console.log("");
        console.log(chalk.bold("Required credentials:"));
        for (const env of template.env_vars) {
          const required = env.required ? chalk.red("(required)") : chalk.dim("(optional)");
          console.log(`  ${chalk.yellow(env.name)} - ${env.label} ${required}`);
          console.log(`    ${chalk.dim(env.prompt)}`);
        }
        console.log("");
        console.log(chalk.dim("Interactive questionnaire and auto-install coming in a future update"));

        showOutro(`MCP "${name}" template loaded`);
      } catch (error) {
        console.error(chalk.red(String(error)));
      }
    });

  mcp
    .command("status")
    .description("Show active MCP servers per host")
    .action(async () => {
      showIntro("looply mcp status");
      console.log(chalk.dim("No MCPs active yet. Use 'looply mcp activate' to set up your first MCP."));
      showOutro("MCP status checked");
    });

  mcp
    .command("deactivate")
    .description("Deactivate an MCP server")
    .argument("<name>", "MCP server name to deactivate")
    .action(async (name: string) => {
      showIntro("looply mcp deactivate");
      console.log(chalk.yellow(`MCP "${name}" deactivation will be available in a future update.`));
      showOutro("MCP deactivation pending");
    });
}

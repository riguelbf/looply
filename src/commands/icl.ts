import type { Command } from "commander";
import path from "node:path";
import { normalizeExamplePolicyMode, readExamplePolicyFile, readGlobalExamplePolicy, resolveEffectiveExamplePolicy, writeExamplePolicyFile, writeGlobalExamplePolicyFile } from "../lib/example-policy.js";
import { showOutro } from "../ui/feedback.js";

export function registerIclCommand(program: Command): void {
  const icl = program
    .command("icl")
    .description("Inspect and control Looply ICL example guidance");

  icl
    .command("status")
    .description("Show the resolved ICL mode for the current project")
    .option("--dir <dir>", "Target directory for project scope status (defaults to current directory)")
    .option("--json", "Print the resolved policy as JSON")
    .action(async (options) => {
      const targetRoot = path.resolve(options.dir ?? process.cwd());
      const [effective, projectPolicy, globalPolicy] = await Promise.all([
        resolveEffectiveExamplePolicy(targetRoot),
        readExamplePolicyFile(targetRoot),
        readGlobalExamplePolicy()
      ]);

      const output = {
        effectiveMode: effective.mode,
        modeSource: effective.source,
        projectPolicy,
        globalPolicy,
        projectFile: effective.projectFile,
        globalFile: effective.globalFile
      };

      if (options.json) {
        console.log(JSON.stringify(output, null, 2));
        return;
      }

      console.log(`effective mode: ${effective.mode}`);
      console.log(`source: ${effective.source}`);
      console.log(`project policy: ${projectPolicy?.mode ?? "not-set"} (${effective.projectFile})`);
      console.log(`global policy: ${globalPolicy?.mode ?? "not-set"} (${effective.globalFile})`);
      showOutro("ICL policy status complete");
    });

  icl
    .command("set")
    .description("Set the ICL mode for project or global scope")
    .argument("<mode>", "ICL mode: on, reduced or off")
    .option("--scope <scope>", "Policy scope: project or global", "project")
    .option("--dir <dir>", "Target directory for project scope policy (defaults to current directory)")
    .action(async (mode, options) => {
      const normalized = normalizeExamplePolicyMode(mode);
      if (!normalized) {
        throw new Error(`Unsupported ICL mode: ${mode}`);
      }

      if (options.scope === "global") {
        const file = await writeGlobalExamplePolicyFile(normalized);
        console.log(`global ICL mode set to ${normalized}`);
        console.log(`file: ${file}`);
        showOutro("ICL policy updated");
        return;
      }

      const targetRoot = path.resolve(options.dir ?? process.cwd());
      const file = await writeExamplePolicyFile(targetRoot, normalized);
      console.log(`project ICL mode set to ${normalized}`);
      console.log(`file: ${file}`);
      showOutro("ICL policy updated");
    });
}

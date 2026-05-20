import type { Command } from "commander";
import path from "node:path";
import {
  initLedger,
  ensureLedger,
  readLedger,
  readLedgerSummary,
  appendLedgerEntry,
  updateLedgerSummary
} from "../lib/context-ledger.js";

export function registerLedgerCommand(program: Command): void {
  const ledger = program
    .command("ledger")
    .description("Manage the context ledger for feature workflow decision memory");

  ledger
    .command("init")
    .description("Initialize the context ledger database for a feature")
    .requiredOption("--feature <name>", "Feature name")
    .option("--dir <dir>", "Target directory (defaults to current directory)")
    .action((options) => {
      const targetRoot = path.resolve(options.dir ?? process.cwd());
      const dbPath = initLedger(targetRoot, options.feature);
      console.log(JSON.stringify({ status: "initialized", path: dbPath }));
    });

  ledger
    .command("read")
    .description("Read context ledger entries and/or summary")
    .requiredOption("--feature <name>", "Feature name")
    .option("--summary-only", "Read only the context summary")
    .option("--dir <dir>", "Target directory (defaults to current directory)")
    .action((options) => {
      const targetRoot = path.resolve(options.dir ?? process.cwd());
      if (options.summaryOnly) {
        const summary = readLedgerSummary(targetRoot, options.feature);
        console.log(JSON.stringify(summary));
        return;
      }
      const result = readLedger(targetRoot, options.feature);
      console.log(JSON.stringify(result));
    });

  ledger
    .command("append")
    .description("Append a new stage entry to the context ledger")
    .requiredOption("--feature <name>", "Feature name")
    .requiredOption("--stage <name>", "Stage name")
    .requiredOption("--decision <text>", "Decision made in this stage")
    .option("--rationale <text>", "Rationale behind the decision")
    .option("--constraints <text>", "Constraints discovered")
    .option("--risks <text>", "Risks identified")
    .option("--dir <dir>", "Target directory (defaults to current directory)")
    .action((options) => {
      const targetRoot = path.resolve(options.dir ?? process.cwd());
      const entry = appendLedgerEntry(targetRoot, options.feature, {
        stage: options.stage,
        decision: options.decision,
        rationale: options.rationale,
        constraints: options.constraints,
        risks: options.risks
      });
      console.log(JSON.stringify(entry));
    });

  const summary = ledger
    .command("summary")
    .description("Read or update the context ledger summary");

  summary
    .command("read")
    .description("Read the context summary")
    .requiredOption("--feature <name>", "Feature name")
    .option("--dir <dir>", "Target directory (defaults to current directory)")
    .action((options) => {
      const targetRoot = path.resolve(options.dir ?? process.cwd());
      const s = readLedgerSummary(targetRoot, options.feature);
      console.log(JSON.stringify(s));
    });

  summary
    .command("update")
    .description("Update the context summary")
    .requiredOption("--feature <name>", "Feature name")
    .requiredOption("--text <text>", "Summary text (3-5 lines)")
    .option("--dir <dir>", "Target directory (defaults to current directory)")
    .action((options) => {
      const targetRoot = path.resolve(options.dir ?? process.cwd());
      ensureLedger(targetRoot, options.feature);
      const s = updateLedgerSummary(targetRoot, options.feature, options.text);
      console.log(JSON.stringify(s));
    });
}

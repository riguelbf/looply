import { buildProgram } from "./program.js";
import { checkForUpdates } from "./lib/update-notifier.js";

await checkForUpdates();

const program = buildProgram();
await program.parseAsync(process.argv);

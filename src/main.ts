import { buildProgram } from "./program.js";

const program = buildProgram();
await program.parseAsync(process.argv);

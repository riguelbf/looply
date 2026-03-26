import { FileHostPublisher } from "../shared/file-host-publisher.js";

export const codexPublisher = new FileHostPublisher({
  hostName: "codex",
  commandName: "codex",
  entrypointFilename: "AGENTS.md"
});

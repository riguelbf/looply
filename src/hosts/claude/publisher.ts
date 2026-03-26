import { FileHostPublisher } from "../shared/file-host-publisher.js";

export const claudePublisher = new FileHostPublisher({
  hostName: "claude",
  commandName: "claude",
  entrypointFilename: "CLAUDE.md"
});

import { FileHostPublisher } from "../shared/file-host-publisher.js";

export const opencodePublisher = new FileHostPublisher({
  hostName: "opencode",
  commandName: "opencode",
  entrypointFilename: "OPENCODE.md"
});

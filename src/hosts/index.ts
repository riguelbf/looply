import type { HostPublisher, SupportedHost } from "../lib/host-publisher.js";
import { claudePublisher } from "./claude/publisher.js";
import { codexPublisher } from "./codex/publisher.js";
import { opencodePublisher } from "./opencode/publisher.js";

const publishers: Record<SupportedHost, HostPublisher> = {
  codex: codexPublisher,
  claude: claudePublisher,
  opencode: opencodePublisher
};

export function resolveHostPublisher(host: string): HostPublisher {
  if (host !== "codex" && host !== "claude" && host !== "opencode") {
    throw new Error(`Unsupported host: ${host}`);
  }

  return publishers[host];
}

export function resolveHostPublishers(hosts: string[]): HostPublisher[] {
  return hosts.map((host) => resolveHostPublisher(host));
}

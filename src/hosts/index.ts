import type { HostPublisher, SupportedHost } from "../lib/host-publisher.js";
import { claudePublisher } from "./claude/publisher.js";
import { codexPublisher } from "./codex/publisher.js";

const publishers: Record<SupportedHost, HostPublisher> = {
  codex: codexPublisher,
  claude: claudePublisher
};

export function resolveHostPublisher(host: string): HostPublisher {
  if (host !== "codex" && host !== "claude") {
    throw new Error(`Unsupported host: ${host}`);
  }

  return publishers[host];
}

export function resolveHostPublishers(hosts: string[]): HostPublisher[] {
  return hosts.map((host) => resolveHostPublisher(host));
}

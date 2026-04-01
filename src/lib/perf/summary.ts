import type { PerfCommandEvent } from "./schema.js";

export interface PerfSummary {
  commandCount: number;
  slowestCommands: Array<{
    command: string;
    durationMs: number;
    startedAt: string;
    success: boolean;
  }>;
  averageByCommand: Array<{
    command: string;
    count: number;
    averageDurationMs: number;
    maxDurationMs: number;
  }>;
  slowestSpans: Array<{
    name: string;
    durationMs: number;
    command: string;
    startedAt: string;
  }>;
}

export function buildPerfSummary(events: PerfCommandEvent[], limit = 5): PerfSummary {
  const normalizedLimit = Math.max(1, limit);
  const slowestCommands = [...events]
    .sort((left, right) => right.durationMs - left.durationMs)
    .slice(0, normalizedLimit)
    .map((event) => ({
      command: event.command,
      durationMs: event.durationMs,
      startedAt: event.startedAt,
      success: event.success
    }));

  const commandGroups = new Map<string, number[]>();
  for (const event of events) {
    const durations = commandGroups.get(event.command) ?? [];
    durations.push(event.durationMs);
    commandGroups.set(event.command, durations);
  }

  const averageByCommand = [...commandGroups.entries()]
    .map(([command, durations]) => ({
      command,
      count: durations.length,
      averageDurationMs: round(durations.reduce((sum, value) => sum + value, 0) / durations.length),
      maxDurationMs: round(Math.max(...durations))
    }))
    .sort((left, right) => right.averageDurationMs - left.averageDurationMs)
    .slice(0, normalizedLimit);

  const slowestSpans = events
    .flatMap((event) => event.spans.map((span) => ({
      name: span.name,
      durationMs: span.durationMs,
      command: event.command,
      startedAt: span.startedAt
    })))
    .sort((left, right) => right.durationMs - left.durationMs)
    .slice(0, normalizedLimit);

  return {
    commandCount: events.length,
    slowestCommands,
    averageByCommand,
    slowestSpans
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}


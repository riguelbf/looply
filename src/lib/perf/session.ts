import { AsyncLocalStorage } from "node:async_hooks";
import { performance } from "node:perf_hooks";
import { appendPerfEvent } from "./storage.js";
import type { PerfCommandEvent, PerfMode, PerfSpanEvent } from "./schema.js";

interface PerfSessionState {
  command: string;
  mode: Exclude<PerfMode, "off">;
  targetRoot: string;
  startedAt: string;
  startedAtMs: number;
  metadata: Record<string, string | number | boolean>;
  spans: PerfSpanEvent[];
}

const sessionStorage = new AsyncLocalStorage<PerfSessionState>();

export async function runWithPerfSession<T>(input: {
  command: string;
  mode: PerfMode;
  targetRoot: string;
  metadata?: Record<string, string | number | boolean>;
}, callback: () => Promise<T>): Promise<T> {
  if (input.mode === "off") {
    return callback();
  }

  const state: PerfSessionState = {
    command: input.command,
    mode: input.mode,
    targetRoot: input.targetRoot,
    startedAt: new Date().toISOString(),
    startedAtMs: performance.now(),
    metadata: { ...(input.metadata ?? {}) },
    spans: []
  };

  return sessionStorage.run(state, async () => {
    try {
      const result = await callback();
      await flushSession(true);
      return result;
    } catch (error) {
      await flushSession(false, error);
      throw error;
    }
  });
}

export async function withPerfSpan<T>(
  name: string,
  callback: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const state = sessionStorage.getStore();
  if (!state) {
    return callback();
  }

  const startedAt = new Date().toISOString();
  const startedAtMs = performance.now();

  try {
    return await callback();
  } finally {
    state.spans.push({
      name,
      startedAt,
      endedAt: new Date().toISOString(),
      durationMs: roundDuration(performance.now() - startedAtMs),
      attributes
    });
  }
}

export function setPerfMetadata(name: string, value: string | number | boolean): void {
  const state = sessionStorage.getStore();
  if (!state) {
    return;
  }
  state.metadata[name] = value;
}

export function isPerfModeEnabled(mode: PerfMode): boolean {
  return mode !== "off";
}

export function isContextPerfMode(): boolean {
  return sessionStorage.getStore()?.mode === "context";
}

async function flushSession(success: boolean, error?: unknown): Promise<void> {
  const state = sessionStorage.getStore();
  if (!state) {
    return;
  }

  const event: PerfCommandEvent = {
    version: 1,
    command: state.command,
    mode: state.mode,
    targetRoot: state.targetRoot,
    startedAt: state.startedAt,
    endedAt: new Date().toISOString(),
    durationMs: roundDuration(performance.now() - state.startedAtMs),
    success,
    errorMessage: error instanceof Error ? error.message : typeof error === "string" ? error : undefined,
    metadata: state.metadata,
    spans: state.spans
  };

  await appendPerfEvent(state.targetRoot, event);
}

function roundDuration(value: number): number {
  return Math.round(value * 100) / 100;
}


export type PerfMode = "off" | "basic" | "context";

export interface PerfSpanEvent {
  name: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  attributes?: Record<string, string | number | boolean>;
}

export interface PerfCommandEvent {
  version: 1;
  command: string;
  mode: Exclude<PerfMode, "off">;
  targetRoot: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  success: boolean;
  errorMessage?: string;
  metadata: Record<string, string | number | boolean>;
  spans: PerfSpanEvent[];
}


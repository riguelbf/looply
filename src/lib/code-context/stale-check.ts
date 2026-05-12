import { readCodeContext, readKnowledgeGraph } from "./storage.js";
import { isCodeContextFresh, computeAllFileHashes, saveFileHashes } from "./file-hasher.js";
import { refreshCodeContext } from "./manager.js";
import type { RefreshCodeContextResult } from "./manager.js";

export interface StaleCheckResult {
  hadCodeContext: boolean;
  hadKnowledgeGraph: boolean;
  wasFresh: boolean;
  refreshed: boolean;
  result?: RefreshCodeContextResult;
  changedFileCount: number;
  reason: string;
}

export async function ensureFreshCodeContext(targetRoot?: string): Promise<StaleCheckResult> {
  const root = targetRoot ?? process.cwd();

  const codeContext = await readCodeContext(root);
  const knowledgeGraph = await readKnowledgeGraph(root);

  const hadCodeContext = codeContext !== null;
  const hadKnowledgeGraph = knowledgeGraph !== null;

  if (!hadCodeContext) {
    const result = await refreshCodeContext(root);
    const hashes = await computeAllFileHashes(root);
    await saveFileHashes(root, hashes);
    return {
      hadCodeContext: false,
      hadKnowledgeGraph: false,
      wasFresh: false,
      refreshed: true,
      result,
      changedFileCount: Object.keys(hashes.files).length,
      reason: "no-existing-code-context",
    };
  }

  const staleness = await isCodeContextFresh(root);

  if (!staleness.fresh) {
    const result = await refreshCodeContext(root);
    const hashes = await computeAllFileHashes(root);
    await saveFileHashes(root, hashes);
    return {
      hadCodeContext: true,
      hadKnowledgeGraph,
      wasFresh: false,
      refreshed: true,
      result,
      changedFileCount: staleness.changedFiles.length,
      reason: staleness.reason ?? "files-changed",
    };
  }

  return {
    hadCodeContext: true,
    hadKnowledgeGraph,
    wasFresh: true,
    refreshed: false,
    changedFileCount: 0,
    reason: "fresh",
  };
}

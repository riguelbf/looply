import type { CodeContextWorkspaceRoot } from "../schema.js";
import { analyzeTypeScriptSemanticWorkspace } from "./typescript-semantic.js";
import type { WorkspaceAnalysisResult } from "./shared.js";

export async function analyzeTypeScriptWorkspace(
  primaryContextRoot: string,
  workspace: CodeContextWorkspaceRoot
): Promise<WorkspaceAnalysisResult> {
  return analyzeTypeScriptSemanticWorkspace(primaryContextRoot, workspace, "typescript");
}

import type { CodeContextWorkspaceRoot } from "../schema.js";
import { analyzeDotnetCSharpWorkspace } from "./dotnet-csharp.js";
import { analyzeJavaWorkspace } from "./java.js";
import { analyzeJavaScriptWorkspace } from "./javascript.js";
import { analyzePythonWorkspace } from "./python.js";
import { analyzeShellWorkspace } from "./shell.js";
import { analyzeTypeScriptWorkspace } from "./typescript.js";
import { analyzeYamlWorkspace } from "./yaml.js";
import type { WorkspaceAnalysisResult } from "./shared.js";

export async function analyzeWorkspace(
  primaryContextRoot: string,
  workspace: CodeContextWorkspaceRoot
): Promise<WorkspaceAnalysisResult> {
  switch (workspace.providerId) {
    case "typescript":
      return analyzeTypeScriptWorkspace(primaryContextRoot, workspace);
    case "javascript":
      return analyzeJavaScriptWorkspace(primaryContextRoot, workspace);
    case "dotnet-csharp":
      return analyzeDotnetCSharpWorkspace(primaryContextRoot, workspace);
    case "python":
      return analyzePythonWorkspace(primaryContextRoot, workspace);
    case "java":
      return analyzeJavaWorkspace(primaryContextRoot, workspace);
    case "yaml":
      return analyzeYamlWorkspace(primaryContextRoot, workspace);
    case "shell":
      return analyzeShellWorkspace(primaryContextRoot, workspace);
  }
}

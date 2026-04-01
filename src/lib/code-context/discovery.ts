import path from "node:path";
import { globby } from "globby";
import type { CodeContextProviderSummary, CodeContextWorkspaceRoot } from "./schema.js";
import {
  CODE_CONTEXT_IGNORED_GLOBS,
  CODE_CONTEXT_PROVIDER_DEFINITIONS,
  isExecutableAvailable,
  toWorkspaceId,
  type CodeContextProviderDefinition
} from "./providers/base.js";

export interface CodeContextDiscoveryResult {
  providers: CodeContextProviderSummary[];
  workspaceRoots: CodeContextWorkspaceRoot[];
  notes: string[];
}

export async function discoverCodeContext(primaryContextRoot: string): Promise<CodeContextDiscoveryResult> {
  const workspacesByProvider = await Promise.all(
    CODE_CONTEXT_PROVIDER_DEFINITIONS.map(async (definition) => ({
      definition,
      roots: await detectProviderRoots(primaryContextRoot, definition)
    }))
  );

  const typescriptRoots = new Set(
    workspacesByProvider
      .find((entry) => entry.definition.id === "typescript")
      ?.roots.map((entry) => entry.root) ?? []
  );

  const workspaceRoots = workspacesByProvider.flatMap(({ definition, roots }) => {
    const filteredRoots = definition.id === "javascript"
      ? roots.filter((entry) => !typescriptRoots.has(entry.root))
      : definition.id === "shell"
        ? suppressNestedRoots(roots)
        : roots;
    return filteredRoots;
  });

  const providers = workspacesByProvider.map(({ definition, roots }) => {
    const effectiveRootCount = definition.id === "javascript"
      ? roots.filter((entry) => !typescriptRoots.has(entry.root)).length
      : definition.id === "shell"
        ? suppressNestedRoots(roots).length
        : roots.length;
    const executableAvailable = isExecutableAvailable(definition.executable);

    return {
      id: definition.id,
      language: definition.language,
      executable: definition.executable,
      executableAvailable,
      status: effectiveRootCount > 0 ? "detected" : "unavailable",
      detectedRootCount: effectiveRootCount,
      notes: effectiveRootCount > 0
        ? definition.notes
        : [`No ${definition.language} roots were detected from marker-based discovery.`]
    } satisfies CodeContextProviderSummary;
  });

  const notes = [
    "Marker-based discovery identifies candidate workspaces; semantic extraction runs inside each provider when available.",
    "JavaScript roots are suppressed when the same root is already detected as TypeScript."
  ];

  return {
    providers,
    workspaceRoots: workspaceRoots.sort((left, right) => left.root.localeCompare(right.root)),
    notes
  };
}

function suppressNestedRoots(workspaces: CodeContextWorkspaceRoot[]): CodeContextWorkspaceRoot[] {
  return workspaces.filter((candidate) => !workspaces.some((other) => {
    if (other.id === candidate.id || other.root === candidate.root) {
      return false;
    }
    if (other.root === ".") {
      return candidate.root !== ".";
    }
    return candidate.root.startsWith(`${other.root}/`);
  }));
}

async function detectProviderRoots(
  primaryContextRoot: string,
  definition: CodeContextProviderDefinition
): Promise<CodeContextWorkspaceRoot[]> {
  const rootMatches = await globby(definition.rootMarkers, {
    cwd: primaryContextRoot,
    absolute: true,
    onlyFiles: true,
    dot: true,
    ignore: CODE_CONTEXT_IGNORED_GLOBS
  });

  const fallbackMatches = rootMatches.length === 0
    ? await globby(definition.fallbackMarkers, {
      cwd: primaryContextRoot,
      absolute: true,
      onlyFiles: true,
      dot: true,
      ignore: CODE_CONTEXT_IGNORED_GLOBS
    })
    : [];

  const matches = rootMatches.length > 0 ? rootMatches : fallbackMatches;
  const grouped = new Map<string, Set<string>>();

  for (const match of matches) {
    const root = path.dirname(match);
    const relativeMarker = path.relative(primaryContextRoot, match).split(path.sep).join("/");
    if (!grouped.has(root)) {
      grouped.set(root, new Set<string>());
    }
    grouped.get(root)!.add(relativeMarker);
  }

  return Array.from(grouped.entries()).map(([root, markers]) => ({
    id: toWorkspaceId(definition.id, path.relative(primaryContextRoot, root) || "."),
    providerId: definition.id,
    language: definition.language,
    root: path.relative(primaryContextRoot, root) || ".",
    kind: definition.kind,
    markers: Array.from(markers).sort(),
    confidence: definition.confidence
  }));
}

import path from "node:path";
import { spawnSync } from "node:child_process";
import type {
  CodeContextConfidence,
  CodeContextProviderId,
  CodeContextWorkspaceKind
} from "../schema.js";

export interface CodeContextProviderDefinition {
  id: CodeContextProviderId;
  language: string;
  executable: string;
  rootMarkers: string[];
  fallbackMarkers: string[];
  kind: CodeContextWorkspaceKind;
  confidence: CodeContextConfidence;
  notes: string[];
}

export const CODE_CONTEXT_IGNORED_GLOBS = [
  "**/.git/**",
  "**/.idea/**",
  "**/.vscode/**",
  "**/.looply/**",
  "**/.claude/**",
  "**/.agents/**",
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/coverage/**",
  "**/.next/**",
  "**/.nuxt/**",
  "**/.vitepress/**",
  "**/.turbo/**",
  "**/.vercel/**",
  "**/.pnpm-store/**",
  "**/vendor/**",
  "**/target/**",
  "**/bin/**",
  "**/obj/**",
  "**/.venv/**",
  "**/venv/**",
  "**/__pycache__/**"
];

export const CODE_CONTEXT_PROVIDER_DEFINITIONS: CodeContextProviderDefinition[] = [
  {
    id: "typescript",
    language: "TypeScript",
    executable: "tsserver",
    rootMarkers: ["**/tsconfig.json"],
    fallbackMarkers: ["**/*.ts", "**/*.tsx"],
    kind: "project",
    confidence: "high",
    notes: ["Marker-based discovery only in slice 1.", "Semantic extraction lands in the TypeScript provider slice."]
  },
  {
    id: "javascript",
    language: "JavaScript",
    executable: "tsserver",
    rootMarkers: ["**/package.json"],
    fallbackMarkers: ["**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs"],
    kind: "project",
    confidence: "medium",
    notes: ["JS-only roots are preferred when no TypeScript root marker is present."]
  },
  {
    id: "dotnet-csharp",
    language: ".NET / C#",
    executable: "dotnet",
    rootMarkers: ["**/*.sln", "**/*.csproj"],
    fallbackMarkers: ["**/*.cs"],
    kind: "solution",
    confidence: "high",
    notes: ["Semantic extraction runs through a local Roslyn-based helper when the .NET SDK is available."]
  },
  {
    id: "python",
    language: "Python",
    executable: "python3",
    rootMarkers: ["**/pyproject.toml", "**/requirements.txt", "**/setup.py"],
    fallbackMarkers: ["**/*.py"],
    kind: "project",
    confidence: "medium",
    notes: ["Semantic extraction uses the local Python AST and compile checks.", "Confidence stays conservative because runtime structure can be dynamic."]
  },
  {
    id: "java",
    language: "Java",
    executable: "jdtls",
    rootMarkers: [
      "**/pom.xml",
      "**/build.gradle",
      "**/build.gradle.kts",
      "**/settings.gradle",
      "**/settings.gradle.kts"
    ],
    fallbackMarkers: ["**/*.java"],
    kind: "project",
    confidence: "high",
    notes: ["Maven and Gradle roots are treated as the initial discovery markers."]
  },
  {
    id: "yaml",
    language: "YAML",
    executable: "node",
    rootMarkers: [
      "**/.github/workflows/*.yml",
      "**/.github/workflows/*.yaml",
      "**/docker-compose.yml",
      "**/docker-compose.yaml",
      "**/compose.yml",
      "**/compose.yaml",
      "**/kustomization.yaml",
      "**/kustomization.yml"
    ],
    fallbackMarkers: ["**/*.yml", "**/*.yaml"],
    kind: "project",
    confidence: "medium",
    notes: [
      "Semantic extraction parses YAML documents locally through the bundled YAML parser.",
      "This provider is optimized for workflows and infrastructure configs before a future yaml-language-server integration."
    ]
  },
  {
    id: "shell",
    language: "Shell",
    executable: "bash",
    rootMarkers: [
      "**/scripts/*.sh",
      "**/scripts/*.bash",
      "**/scripts/*.zsh",
      "**/bin/*.sh",
      "**/bin/*.bash",
      "**/bin/*.zsh",
      "**/.envrc"
    ],
    fallbackMarkers: ["**/*.sh", "**/*.bash", "**/*.zsh", "**/.envrc"],
    kind: "project",
    confidence: "medium",
    notes: [
      "Semantic extraction parses shell scripts locally and validates syntax with bash -n or zsh -n when possible.",
      "This provider focuses on scripts, sourced files and invoked commands before a future shell-language-server integration."
    ]
  }
];

export function isExecutableAvailable(command: string): boolean {
  const lookupCommand = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(lookupCommand, [command], { stdio: "ignore" });
  return result.status === 0;
}

export function toWorkspaceId(providerId: CodeContextProviderId, root: string): string {
  return `${providerId}:${root.split(path.sep).join("/")}`;
}

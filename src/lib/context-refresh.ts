import path from "node:path";
import fs from "fs-extra";
import {
  refreshProjectContextMarkdown,
  writeArchitectureContextMarkdown,
  writeContextIndexMarkdown,
  writeProjectInventoryMarkdown
} from "./context-documents.js";
import { writeContextSnapshot } from "./context-snapshot.js";
import { inferInferencePolicy, readProjectContextFile } from "./project-context.js";
import { readInteractionPolicyFile } from "./interaction-policy.js";
import { readLocaleFile } from "./locale.js";
import type { InteractionMode, OutputLocale, ProjectMode } from "./host-publisher.js";

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".idea",
  ".vscode",
  ".looply",
  ".claude",
  ".agents",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
  ".nuxt",
  ".turbo",
  ".vercel",
  ".pnpm-store",
  "vendor",
  "target",
  "bin",
  "obj"
]);

const MAX_DISCOVERED_FILES = 800;
const MAX_DISCOVERY_DEPTH = 3;

interface DiscoveredFile {
  relativePath: string;
  name: string;
  extension: string;
  depth: number;
}

export interface RefreshContextResult {
  targetRoot: string;
  projectMode: ProjectMode;
  outputLocale: OutputLocale;
  interactionMode: InteractionMode;
  contextIndexFile: string;
  projectContextFile: string;
  architectureContextFile: string;
  projectInventoryFile: string;
  contextSnapshotFile: string;
  detectedLanguages: string[];
  detectedFrameworks: string[];
  keyDirectories: string[];
  moduleHints: string[];
  integrationHints: string[];
}

export async function refreshContext(targetRoot: string): Promise<RefreshContextResult> {
  const [projectContext, locale, interactionPolicy] = await Promise.all([
    readProjectContextFile(targetRoot),
    readLocaleFile(targetRoot),
    readInteractionPolicyFile(targetRoot)
  ]);

  const projectMode = projectContext?.mode ?? "existing-project";
  const outputLocale = locale?.outputLocale ?? "en";
  const interactionMode = interactionPolicy?.mode ?? "balanced";
  const inferencePolicy = inferInferencePolicy(projectMode);
  const primaryContextRoot = projectContext?.primaryContextRoot ?? targetRoot;
  const analysis = await analyzeProject(primaryContextRoot, projectMode);

  const contextIndexFile = await writeContextIndexMarkdown({
    targetRoot,
    projectMode,
    outputLocale,
    interactionMode,
    inferencePolicy
  });

  const projectContextFile = await refreshProjectContextMarkdown({
    targetRoot,
    projectMode,
    outputLocale,
    interactionMode,
    inferencePolicy,
    primaryContextRoot,
    data: analysis
  });

  const architectureContextFile = await writeArchitectureContextMarkdown({
    targetRoot,
    projectMode,
    outputLocale,
    interactionMode,
    inferencePolicy,
    primaryContextRoot,
    data: analysis
  });

  const projectInventoryFile = await writeProjectInventoryMarkdown({
    targetRoot,
    projectMode,
    outputLocale,
    interactionMode,
    inferencePolicy,
    primaryContextRoot,
    data: analysis
  });

  const contextSnapshotFile = await writeContextSnapshot({
    targetRoot,
    primaryContextRoot,
    projectMode,
    outputLocale,
    interactionMode,
    inferencePolicy,
    data: analysis
  });

  return {
    targetRoot,
    projectMode,
    outputLocale,
    interactionMode,
    contextIndexFile,
    projectContextFile,
    architectureContextFile,
    projectInventoryFile,
    contextSnapshotFile,
    detectedLanguages: analysis.languages,
    detectedFrameworks: analysis.frameworks,
    keyDirectories: analysis.keyDirectories,
    moduleHints: analysis.moduleHints,
    integrationHints: analysis.integrationHints
  };
}

async function analyzeProject(root: string, projectMode: ProjectMode) {
  const topLevelEntries = await fs.readdir(root).catch(() => []);
  const topLevelFiles = new Set(topLevelEntries);
  const packageJson = await readPackageJson(root);
  const discoveredFiles = await walkRepository(root);
  const now = new Date().toISOString();

  const languages = detectLanguages(topLevelFiles, packageJson, discoveredFiles);
  const frameworks = detectFrameworks(topLevelFiles, packageJson, discoveredFiles);
  const keyDirectories = detectKeyDirectories(topLevelEntries, discoveredFiles);
  const apiSignals = detectApiSignals(topLevelFiles, packageJson, discoveredFiles);
  const dataSignals = detectDataSignals(topLevelFiles, packageJson, topLevelEntries, discoveredFiles);
  const authSignals = detectAuthSignals(topLevelFiles, packageJson, discoveredFiles);
  const messagingSignals = detectMessagingSignals(topLevelFiles, packageJson, discoveredFiles);
  const observabilitySignals = detectObservabilitySignals(topLevelFiles, packageJson, discoveredFiles);
  const workspaceHints = detectWorkspaceHints(topLevelFiles, packageJson, discoveredFiles);
  const testingSignals = detectTestingSignals(topLevelFiles, packageJson, discoveredFiles);
  const infrastructureSignals = detectInfrastructureSignals(topLevelFiles, packageJson, discoveredFiles);
  const automationSignals = detectAutomationSignals(topLevelFiles, packageJson, discoveredFiles);
  const moduleHints = detectModuleHints(keyDirectories, discoveredFiles);
  const integrationHints = detectIntegrationHints(topLevelFiles, packageJson, topLevelEntries, discoveredFiles);
  const repositorySummary = buildRepositorySummary({
    projectMode,
    languages,
    frameworks,
    keyDirectories,
    integrationHints,
    apiSignals,
    dataSignals,
    authSignals,
    messagingSignals,
    observabilitySignals,
    workspaceHints,
    infrastructureSignals
  });

  const architectureNotes = [
    languages.length > 0
      ? `Primary implementation languages: ${languages.join(", ")}.`
      : "Primary implementation languages were not inferred confidently yet.",
    frameworks.length > 0
      ? `Application and tooling stack signals: ${frameworks.join(", ")}.`
      : "Application framework signals are still weak; inspect the codebase directly.",
    apiSignals.length > 0
      ? `API and communication surface: ${apiSignals.join(", ")}.`
      : "API surface is still weakly mapped.",
    dataSignals.length > 0
      ? `Data and persistence signals: ${dataSignals.join(", ")}.`
      : "Data and persistence footprint is still weakly mapped.",
    authSignals.length > 0
      ? `Authentication and access signals: ${authSignals.join(", ")}.`
      : "Authentication surface is still unclear from repository signals.",
    messagingSignals.length > 0
      ? `Messaging and asynchronous signals: ${messagingSignals.join(", ")}.`
      : "Messaging or event-driven signals were not inferred strongly yet.",
    observabilitySignals.length > 0
      ? `Observability signals: ${observabilitySignals.join(", ")}.`
      : "Observability signals are still weakly mapped.",
    workspaceHints.length > 0
      ? `Workspace shape: ${workspaceHints.join(", ")}.`
      : "Workspace shape is still unclear from repository signals.",
    infrastructureSignals.length > 0
      ? `Operational and infrastructure signals: ${infrastructureSignals.join(", ")}.`
      : "Infrastructure footprint is still weakly mapped."
  ];

  const domainNotes = moduleHints.length > 0
    ? moduleHints.map((hint) => `Potential module or bounded context: ${hint}.`)
    : ["No strong domain partitions were inferred yet. Inspect the business-facing modules directly in the repository."];

  const riskNotes = [
    projectMode === "existing-project"
      ? "This context is heuristic and must be validated against the live codebase before design or implementation decisions."
      : "This context starts from artifacts and assumptions; refresh it once real code, infra and tests appear.",
    testingSignals.length > 0
      ? `Quality gates appear to rely on: ${testingSignals.join(", ")}. Validate current test coverage before large changes.`
      : "Testing signals are weak; verify how quality gates actually run before relying on them.",
    automationSignals.length > 0
      ? `Automation surface detected: ${automationSignals.join(", ")}. Check current CI and release expectations before shipping.`
      : "Automation and release surface still need validation.",
    authSignals.length > 0
      ? `Authentication or access-control paths exist: ${authSignals.join(", ")}. Validate client/server boundaries and secret handling before changing access flows.`
      : "Authentication surface is still weakly mapped; verify whether access-control logic exists outside the inferred stack.",
    messagingSignals.length > 0
      ? `Asynchronous behavior appears present: ${messagingSignals.join(", ")}. Validate idempotency, retries and delivery guarantees before changing async paths.`
      : "Async communication patterns were not strongly inferred; confirm whether queues, events or background jobs exist.",
    integrationHints.length > 0
      ? "Integration surface is non-trivial. Validate contracts, credentials and rollout risk before delivery."
      : "Integration footprint appears limited or not yet mapped."
  ];

  const signalCount = [
    languages.length,
    frameworks.length,
    keyDirectories.length,
    moduleHints.length,
    integrationHints.length,
    apiSignals.length,
    dataSignals.length,
    authSignals.length,
    messagingSignals.length,
    observabilitySignals.length,
    testingSignals.length,
    infrastructureSignals.length,
    automationSignals.length
  ].reduce((total, value) => total + value, 0);

  return {
    status: projectMode === "existing-project" ? "active" : "draft",
    coverage: signalCount >= 12 ? "high" : signalCount >= 6 ? "medium" : "low",
    lastValidatedAt: now,
    repositorySummary,
    languages,
    frameworks,
    keyDirectories,
    moduleHints,
    integrationHints,
    apiSignals,
    dataSignals,
    authSignals,
    messagingSignals,
    observabilitySignals,
    workspaceHints,
    testingSignals,
    infrastructureSignals,
    automationSignals,
    architectureNotes,
    domainNotes,
    riskNotes
  } as const;
}

async function walkRepository(root: string): Promise<DiscoveredFile[]> {
  const discovered: DiscoveredFile[] = [];

  async function visit(currentDirectory: string, depth: number): Promise<void> {
    if (depth > MAX_DISCOVERY_DEPTH || discovered.length >= MAX_DISCOVERED_FILES) {
      return;
    }

    const entries = await fs.readdir(currentDirectory, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (discovered.length >= MAX_DISCOVERED_FILES) {
        break;
      }

      const absolutePath = path.join(currentDirectory, entry.name);
      const relativePath = path.relative(root, absolutePath);

      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name)) {
          continue;
        }
        await visit(absolutePath, depth + 1);
        continue;
      }

      discovered.push({
        relativePath,
        name: entry.name,
        extension: path.extname(entry.name).toLowerCase(),
        depth
      });
    }
  }

  await visit(root, 0);
  return discovered;
}

async function readPackageJson(root: string): Promise<Record<string, unknown> | null> {
  const file = path.join(root, "package.json");
  if (!(await fs.pathExists(file))) {
    return null;
  }

  try {
    return await fs.readJson(file);
  } catch {
    return null;
  }
}

function detectLanguages(
  files: Set<string>,
  packageJson: Record<string, unknown> | null,
  discoveredFiles: DiscoveredFile[]
): string[] {
  const languages = new Set<string>();
  const extensions = new Set(discoveredFiles.map((file) => file.extension));

  if (packageJson) languages.add("JavaScript");
  if (files.has("tsconfig.json") || extensions.has(".ts") || extensions.has(".tsx")) languages.add("TypeScript");
  if (files.has("pyproject.toml") || files.has("requirements.txt") || extensions.has(".py")) languages.add("Python");
  if (files.has("go.mod") || extensions.has(".go")) languages.add("Go");
  if (files.has("Cargo.toml") || extensions.has(".rs")) languages.add("Rust");
  if (files.has("pom.xml") || files.has("build.gradle") || files.has("build.gradle.kts") || extensions.has(".java")) languages.add("Java");
  if ([...files].some((entry) => entry.endsWith(".sln") || entry.endsWith(".csproj")) || extensions.has(".cs")) languages.add(".NET");
  if (extensions.has(".rb")) languages.add("Ruby");
  if (extensions.has(".php")) languages.add("PHP");
  if (extensions.has(".tf")) languages.add("Terraform");
  if (extensions.has(".sh")) languages.add("Shell");

  return [...languages];
}

function detectFrameworks(
  files: Set<string>,
  packageJson: Record<string, unknown> | null,
  discoveredFiles: DiscoveredFile[]
): string[] {
  const frameworks = new Set<string>();
  const deps = {
    ...toRecord(packageJson?.dependencies),
    ...toRecord(packageJson?.devDependencies)
  };
  const filePaths = new Set(discoveredFiles.map((file) => file.relativePath));

  if ("next" in deps) frameworks.add("Next.js");
  if ("react" in deps) frameworks.add("React");
  if ("vue" in deps) frameworks.add("Vue");
  if ("svelte" in deps) frameworks.add("Svelte");
  if ("express" in deps) frameworks.add("Express");
  if ("hono" in deps) frameworks.add("Hono");
  if ("koa" in deps) frameworks.add("Koa");
  if ("fastify" in deps) frameworks.add("Fastify");
  if ("nestjs" in deps || "@nestjs/core" in deps) frameworks.add("NestJS");
  if ("trpc" in deps || "@trpc/server" in deps) frameworks.add("tRPC");
  if ("graphql" in deps || "@apollo/server" in deps || "apollo-server" in deps) frameworks.add("GraphQL");
  if ("@tanstack/react-query" in deps) frameworks.add("TanStack Query");
  if ("react-hook-form" in deps) frameworks.add("React Hook Form");
  if ("zod" in deps) frameworks.add("Zod");
  if ("tailwindcss" in deps) frameworks.add("Tailwind CSS");
  if ("@radix-ui/react-slot" in deps || "@radix-ui/react-dialog" in deps) frameworks.add("Radix UI");
  if ("zustand" in deps) frameworks.add("Zustand");
  if ("jotai" in deps) frameworks.add("Jotai");
  if ("@reduxjs/toolkit" in deps) frameworks.add("Redux Toolkit");
  if ("prisma" in deps || files.has("prisma")) frameworks.add("Prisma");
  if ("typeorm" in deps) frameworks.add("TypeORM");
  if ("drizzle-orm" in deps) frameworks.add("Drizzle");
  if ("typescript" in deps || files.has("tsconfig.json")) frameworks.add("TypeScript");
  if ("vitest" in deps) frameworks.add("Vitest");
  if ("jest" in deps) frameworks.add("Jest");
  if ("playwright" in deps || "@playwright/test" in deps) frameworks.add("Playwright");
  if ("cypress" in deps) frameworks.add("Cypress");
  if ("vite" in deps) frameworks.add("Vite");
  if ("turbo" in deps || files.has("turbo.json")) frameworks.add("Turborepo");
  if ("nx" in deps || files.has("nx.json")) frameworks.add("Nx");
  if (files.has("pnpm-workspace.yaml")) frameworks.add("pnpm workspace");
  if (files.has("docker-compose.yml") || files.has("docker-compose.yaml")) frameworks.add("Docker Compose");
  if (files.has("Dockerfile") || hasMatchingPath(filePaths, /^Dockerfile(\..+)?$/i)) frameworks.add("Docker");
  if (files.has("pyproject.toml")) frameworks.add("Python project");
  if (files.has("go.mod")) frameworks.add("Go modules");
  if (files.has("pom.xml") || files.has("build.gradle") || files.has("build.gradle.kts")) frameworks.add("JVM build");
  if (hasMatchingPath(filePaths, /^infra\/terraform\//) || hasMatchingPath(filePaths, /\.tf$/)) frameworks.add("Terraform");
  if (hasMatchingPath(filePaths, /^charts\//) || hasMatchingPath(filePaths, /k8s|kubernetes/i)) frameworks.add("Kubernetes");
  if (hasMatchingPath(filePaths, /^\.github\/workflows\//)) frameworks.add("GitHub Actions");

  return [...frameworks];
}

function detectKeyDirectories(entries: string[], discoveredFiles: DiscoveredFile[]): string[] {
  const importantTopLevel = ["src", "app", "apps", "packages", "services", "libs", "modules", "infra", "scripts", "prisma", "migrations", "tests", ".github", "charts"];
  const result = new Set(entries.filter((entry) => importantTopLevel.includes(entry)));

  for (const file of discoveredFiles) {
    const firstSegment = file.relativePath.split(path.sep)[0];
    if (importantTopLevel.includes(firstSegment)) {
      result.add(firstSegment);
    }
  }

  return [...result].sort();
}

function detectWorkspaceHints(
  files: Set<string>,
  packageJson: Record<string, unknown> | null,
  discoveredFiles: DiscoveredFile[]
): string[] {
  const hints = new Set<string>();
  const packageManager = typeof packageJson?.packageManager === "string" ? packageJson.packageManager : null;
  const workspaces = packageJson && Array.isArray(packageJson.workspaces) ? packageJson.workspaces.length : 0;
  const filePaths = new Set(discoveredFiles.map((file) => file.relativePath));

  if (files.has("pnpm-workspace.yaml")) hints.add("monorepo with pnpm workspace");
  if (files.has("turbo.json")) hints.add("monorepo with Turborepo");
  if (files.has("nx.json")) hints.add("workspace managed by Nx");
  if (workspaces > 0) hints.add(`package.json workspaces (${workspaces})`);
  if (packageManager) hints.add(`package manager: ${packageManager}`);
  if (hasMatchingPath(filePaths, /^apps\//)) hints.add("application folders under apps/");
  if (hasMatchingPath(filePaths, /^packages\//)) hints.add("shared packages under packages/");
  if (hasMatchingPath(filePaths, /^services\//)) hints.add("service-oriented layout under services/");
  if (hasMatchingPath(filePaths, /^libs\//)) hints.add("shared libraries under libs/");

  return [...hints];
}

function detectTestingSignals(
  files: Set<string>,
  packageJson: Record<string, unknown> | null,
  discoveredFiles: DiscoveredFile[]
): string[] {
  const hints = new Set<string>();
  const deps = {
    ...toRecord(packageJson?.dependencies),
    ...toRecord(packageJson?.devDependencies)
  };
  const filePaths = new Set(discoveredFiles.map((file) => file.relativePath));

  if ("vitest" in deps) hints.add("unit or integration tests via Vitest");
  if ("jest" in deps) hints.add("unit or integration tests via Jest");
  if ("playwright" in deps || "@playwright/test" in deps) hints.add("browser or end-to-end tests via Playwright");
  if ("cypress" in deps) hints.add("browser tests via Cypress");
  if ("supertest" in deps) hints.add("HTTP contract or integration tests via Supertest");
  if ("msw" in deps) hints.add("API mocking via MSW");
  if (files.has("tests") || hasMatchingPath(filePaths, /^tests\//) || hasMatchingPath(filePaths, /__tests__\//)) hints.add("repository-level test directories");
  if (hasMatchingPath(filePaths, /\.(spec|test)\.(ts|tsx|js|jsx|py|go|java|cs)$/)) hints.add("test files co-located with source");
  if (files.has("coverage")) hints.add("coverage artifacts or directory");

  return [...hints];
}

function detectApiSignals(
  files: Set<string>,
  packageJson: Record<string, unknown> | null,
  discoveredFiles: DiscoveredFile[]
): string[] {
  const hints = new Set<string>();
  const deps = {
    ...toRecord(packageJson?.dependencies),
    ...toRecord(packageJson?.devDependencies)
  };
  const filePaths = new Set(discoveredFiles.map((file) => file.relativePath));

  if ("express" in deps || "fastify" in deps || "@nestjs/core" in deps || "hono" in deps || "koa" in deps) {
    hints.add("server-side HTTP framework");
  }
  if ("next" in deps && hasMatchingPath(filePaths, /^src\/app\/api\//)) hints.add("Next.js route handlers");
  if ("trpc" in deps || "@trpc/server" in deps) hints.add("tRPC endpoints");
  if ("graphql" in deps || "@apollo/server" in deps || "apollo-server" in deps) hints.add("GraphQL API surface");
  if (hasMatchingPath(filePaths, /(^|\/)(routes|controllers|handlers|endpoints)\//)) hints.add("route or controller folders");
  if (hasMatchingPath(filePaths, /openapi|swagger/i)) hints.add("OpenAPI or Swagger contract assets");

  return [...hints];
}

function detectDataSignals(
  files: Set<string>,
  packageJson: Record<string, unknown> | null,
  entries: string[],
  discoveredFiles: DiscoveredFile[]
): string[] {
  const hints = new Set<string>();
  const deps = {
    ...toRecord(packageJson?.dependencies),
    ...toRecord(packageJson?.devDependencies)
  };
  const filePaths = new Set(discoveredFiles.map((file) => file.relativePath));

  if ("@prisma/client" in deps || "prisma" in deps) hints.add("Prisma schema or client");
  if ("pg" in deps) hints.add("PostgreSQL client");
  if ("mysql2" in deps) hints.add("MySQL client");
  if ("mongodb" in deps || "mongoose" in deps) hints.add("MongoDB client");
  if ("redis" in deps || "ioredis" in deps) hints.add("Redis client");
  if ("typeorm" in deps) hints.add("TypeORM");
  if ("drizzle-orm" in deps) hints.add("Drizzle ORM");
  if (entries.includes("prisma") || hasMatchingPath(filePaths, /^prisma\//)) hints.add("prisma schema directory");
  if (entries.includes("migrations") || hasMatchingPath(filePaths, /migrations?\//i)) hints.add("database migrations");
  if (hasMatchingPath(filePaths, /schema\.sql$|seed\.(ts|js|sql)$/i)) hints.add("database bootstrap or seed assets");

  return [...hints];
}

function detectAuthSignals(
  files: Set<string>,
  packageJson: Record<string, unknown> | null,
  discoveredFiles: DiscoveredFile[]
): string[] {
  const hints = new Set<string>();
  const deps = {
    ...toRecord(packageJson?.dependencies),
    ...toRecord(packageJson?.devDependencies)
  };
  const filePaths = new Set(discoveredFiles.map((file) => file.relativePath));

  if ("next-auth" in deps || "@auth/core" in deps) hints.add("NextAuth or Auth.js");
  if ("passport" in deps || "passport-jwt" in deps) hints.add("Passport-based authentication");
  if ("jsonwebtoken" in deps || "jose" in deps) hints.add("JWT handling");
  if ("bcrypt" in deps || "bcryptjs" in deps || "argon2" in deps) hints.add("password hashing");
  if ("keycloak-js" in deps || "oidc-client-ts" in deps) hints.add("OIDC or identity-provider integration");
  if (hasMatchingPath(filePaths, /(^|\/)(auth|authentication|authorization|iam)\//i)) hints.add("auth-specific modules");
  if (hasMatchingPath(filePaths, /middleware/i) && ("next" in deps || "express" in deps || "fastify" in deps)) hints.add("request middleware that may enforce access control");

  return [...hints];
}

function detectMessagingSignals(
  files: Set<string>,
  packageJson: Record<string, unknown> | null,
  discoveredFiles: DiscoveredFile[]
): string[] {
  const hints = new Set<string>();
  const deps = {
    ...toRecord(packageJson?.dependencies),
    ...toRecord(packageJson?.devDependencies)
  };
  const filePaths = new Set(discoveredFiles.map((file) => file.relativePath));

  if ("bullmq" in deps || "bull" in deps) hints.add("job queue via Bull or BullMQ");
  if ("amqplib" in deps) hints.add("RabbitMQ client");
  if ("kafkajs" in deps) hints.add("Kafka client");
  if ("@aws-sdk/client-sqs" in deps) hints.add("Amazon SQS");
  if ("agenda" in deps) hints.add("scheduled jobs via Agenda");
  if (hasMatchingPath(filePaths, /(^|\/)(queues|queue|workers|worker|jobs|consumers|producers|events)\//i)) {
    hints.add("worker, queue or event-oriented folders");
  }

  return [...hints];
}

function detectObservabilitySignals(
  files: Set<string>,
  packageJson: Record<string, unknown> | null,
  discoveredFiles: DiscoveredFile[]
): string[] {
  const hints = new Set<string>();
  const deps = {
    ...toRecord(packageJson?.dependencies),
    ...toRecord(packageJson?.devDependencies)
  };
  const filePaths = new Set(discoveredFiles.map((file) => file.relativePath));

  if ("pino" in deps || "winston" in deps) hints.add("application logging library");
  if ("@opentelemetry/api" in deps || "@opentelemetry/sdk-node" in deps) hints.add("OpenTelemetry instrumentation");
  if ("@sentry/node" in deps || "@sentry/nextjs" in deps) hints.add("Sentry error reporting");
  if ("prom-client" in deps) hints.add("Prometheus metrics");
  if (hasMatchingPath(filePaths, /(^|\/)(observability|instrumentation|tracing|logging|monitoring)\//i)) {
    hints.add("observability or instrumentation modules");
  }

  return [...hints];
}

function detectInfrastructureSignals(
  files: Set<string>,
  packageJson: Record<string, unknown> | null,
  discoveredFiles: DiscoveredFile[]
): string[] {
  const hints = new Set<string>();
  const deps = {
    ...toRecord(packageJson?.dependencies),
    ...toRecord(packageJson?.devDependencies)
  };
  const filePaths = new Set(discoveredFiles.map((file) => file.relativePath));

  if (files.has("Dockerfile") || hasMatchingPath(filePaths, /^Dockerfile(\..+)?$/i)) hints.add("docker image build");
  if (files.has("docker-compose.yml") || files.has("docker-compose.yaml")) hints.add("docker compose setup");
  if (hasMatchingPath(filePaths, /\.tf$/)) hints.add("terraform infrastructure");
  if (hasMatchingPath(filePaths, /Pulumi\.(ya?ml|json)$/i) || "pulumi" in deps) hints.add("pulumi infrastructure");
  if (hasMatchingPath(filePaths, /^charts\//)) hints.add("helm charts");
  if (hasMatchingPath(filePaths, /(^|\/)(k8s|kubernetes)\//i)) hints.add("kubernetes manifests");
  if ("@aws-sdk/client-sqs" in deps || "@aws-sdk/client-s3" in deps || "@aws-sdk/client-secrets-manager" in deps) hints.add("aws service clients");
  if ("stripe" in deps) hints.add("payment provider usage");
  if ("pg" in deps || "mysql2" in deps || "mongoose" in deps || "@prisma/client" in deps) hints.add("persistent storage client");

  return [...hints];
}

function detectAutomationSignals(
  files: Set<string>,
  packageJson: Record<string, unknown> | null,
  discoveredFiles: DiscoveredFile[]
): string[] {
  const hints = new Set<string>();
  const scripts = toRecord(packageJson?.scripts);
  const filePaths = new Set(discoveredFiles.map((file) => file.relativePath));

  if (hasMatchingPath(filePaths, /^\.github\/workflows\//)) hints.add("github actions workflows");
  if ("build" in scripts) hints.add("build script in package.json");
  if ("test" in scripts) hints.add("test script in package.json");
  if ("lint" in scripts) hints.add("lint script in package.json");
  if ("deploy" in scripts) hints.add("deploy script in package.json");
  if ("release" in scripts) hints.add("release script in package.json");
  if (files.has("Makefile")) hints.add("makefile automation");
  if (hasMatchingPath(filePaths, /^scripts\//)) hints.add("repository automation scripts");
  if (hasMatchingPath(filePaths, /^\.husky\//)) hints.add("git hooks via Husky");
  if (files.has(".changeset") || hasMatchingPath(filePaths, /^\.changeset\//)) hints.add("release orchestration via Changesets");

  return [...hints];
}

function detectModuleHints(keyDirectories: string[], discoveredFiles: DiscoveredFile[]): string[] {
  const hints = new Set<string>();
  const searchRoots = new Set(["src", "app", "apps", "packages", "services", "libs", "modules"]);

  for (const file of discoveredFiles) {
    const parts = file.relativePath.split(path.sep);
    const root = parts[0];
    if (!searchRoots.has(root)) {
      continue;
    }

    if (parts.length >= 2 && !parts[1].includes(".")) {
      hints.add(`${root}/${parts[1]}`);
    }
  }

  if (hints.size === 0) {
    for (const directory of keyDirectories) {
      if (searchRoots.has(directory)) {
        hints.add(`${directory}/(inspect directly)`);
      }
    }
  }

  return [...hints].slice(0, 16);
}

function detectIntegrationHints(
  files: Set<string>,
  packageJson: Record<string, unknown> | null,
  entries: string[],
  discoveredFiles: DiscoveredFile[]
): string[] {
  const hints = new Set<string>();
  const deps = {
    ...toRecord(packageJson?.dependencies),
    ...toRecord(packageJson?.devDependencies)
  };
  const filePaths = new Set(discoveredFiles.map((file) => file.relativePath));

  if ("@prisma/client" in deps || "prisma" in deps) hints.add("database via Prisma");
  if ("pg" in deps || "mysql2" in deps || "mongoose" in deps) hints.add("database client detected");
  if ("@aws-sdk/client-sqs" in deps || "@aws-sdk/client-s3" in deps || "@aws-sdk/client-secrets-manager" in deps) hints.add("AWS SDK integration");
  if ("stripe" in deps) hints.add("Stripe");
  if ("axios" in deps || "node-fetch" in deps || "undici" in deps) hints.add("HTTP API integrations");
  if ("amqplib" in deps || "kafkajs" in deps || "bullmq" in deps) hints.add("queue or event integration");
  if ("next-auth" in deps || "@auth/core" in deps || "passport" in deps || "jsonwebtoken" in deps || "jose" in deps) {
    hints.add("authentication or identity integration");
  }
  if ("pino" in deps || "@opentelemetry/api" in deps || "@sentry/node" in deps || "prom-client" in deps) {
    hints.add("observability or monitoring integration");
  }
  if (entries.includes("openapi") || entries.includes("swagger") || hasMatchingPath(filePaths, /openapi|swagger/i)) hints.add("OpenAPI or Swagger assets");
  if (entries.includes("prisma")) hints.add("database schema directory");
  if (entries.includes("migrations")) hints.add("migrations directory");
  if (hasMatchingPath(filePaths, /^\.looply\/custom\/integrations\//)) hints.add("looply integration context files");

  return [...hints];
}

function buildRepositorySummary(input: {
  projectMode: ProjectMode;
  languages: string[];
  frameworks: string[];
  keyDirectories: string[];
  integrationHints: string[];
  apiSignals: string[];
  dataSignals: string[];
  authSignals: string[];
  messagingSignals: string[];
  observabilitySignals: string[];
  workspaceHints: string[];
  infrastructureSignals: string[];
}): string[] {
  return [
    input.projectMode === "existing-project"
      ? "Existing project context refreshed from current repository signals and shallow repository inspection."
      : "Greenfield project context refreshed from available artifacts and repository signals.",
    input.languages.length > 0
      ? `Primary languages detected: ${input.languages.join(", ")}.`
      : "No strong language signals were detected yet.",
    input.frameworks.length > 0
      ? `Framework and tooling signals: ${input.frameworks.join(", ")}.`
      : "Framework signals are still weak.",
    input.apiSignals.length > 0
      ? `API signals: ${input.apiSignals.join(", ")}.`
      : "API surface is still weakly mapped.",
    input.dataSignals.length > 0
      ? `Data signals: ${input.dataSignals.join(", ")}.`
      : "Data and persistence surface is still weakly mapped.",
    input.authSignals.length > 0
      ? `Authentication signals: ${input.authSignals.join(", ")}.`
      : "Authentication surface is still unclear.",
    input.messagingSignals.length > 0
      ? `Messaging signals: ${input.messagingSignals.join(", ")}.`
      : "Messaging or event-driven surface was not strongly inferred yet.",
    input.observabilitySignals.length > 0
      ? `Observability signals: ${input.observabilitySignals.join(", ")}.`
      : "Observability surface is still weakly mapped.",
    input.workspaceHints.length > 0
      ? `Workspace shape: ${input.workspaceHints.join(", ")}.`
      : "Workspace shape was not inferred strongly yet.",
    input.keyDirectories.length > 0
      ? `Key directories: ${input.keyDirectories.join(", ")}.`
      : "No key top-level directories were inferred yet.",
    input.infrastructureSignals.length > 0
      ? `Infrastructure and operability signals: ${input.infrastructureSignals.join(", ")}.`
      : "Infrastructure footprint is still weakly mapped.",
    input.integrationHints.length > 0
      ? `Potential integrations: ${input.integrationHints.join(", ")}.`
      : "No strong integration signals were inferred yet."
  ];
}

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function hasMatchingPath(filePaths: Set<string>, pattern: RegExp): boolean {
  for (const filePath of filePaths) {
    if (pattern.test(filePath)) {
      return true;
    }
  }

  return false;
}

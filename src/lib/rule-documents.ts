import path from "node:path";
import fs from "fs-extra";
import type { InteractionMode, OutputLocale, ProjectMode } from "./host-publisher.js";
import type { InferencePolicy } from "./project-context.js";

export type RuleCategory =
  | "coding-standards"
  | "architecture-constraints"
  | "testing-requirements"
  | "security-policies"
  | "business-rules"
  | "project-conventions";

export const ruleCategories: RuleCategory[] = [
  "coding-standards",
  "architecture-constraints",
  "testing-requirements",
  "security-policies",
  "business-rules",
  "project-conventions"
];

export const ruleCategoryLabels: Record<RuleCategory, { label: string; hint: string }> = {
  "coding-standards": { label: "Coding Standards", hint: "Language conventions, naming, formatting" },
  "architecture-constraints": { label: "Architecture Constraints", hint: "Patterns, frameworks, module boundaries" },
  "testing-requirements": { label: "Testing Requirements", hint: "Frameworks, coverage, test conventions" },
  "security-policies": { label: "Security Policies", hint: "Auth, data handling, secrets management" },
  "business-rules": { label: "Business Rules", hint: "Domain constraints, validation rules" },
  "project-conventions": { label: "Project Conventions", hint: "Commit style, PR process, branching" }
};

export interface RuleFile {
  category: RuleCategory;
  content: string;
}

interface RuleDocsInput {
  targetRoot: string;
  projectMode: ProjectMode;
  outputLocale: OutputLocale;
  interactionMode: InteractionMode;
  inferencePolicy: InferencePolicy;
  rules?: RuleFile[];
}

export function resolveRulesRoot(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "custom", "rules");
}

export function resolveRulesIndexFile(targetRoot: string): string {
  return path.join(resolveRulesRoot(targetRoot), "rules-index.md");
}

export function resolveRulesReadmeFile(targetRoot: string): string {
  return path.join(resolveRulesRoot(targetRoot), "README.md");
}

export function resolveRuleTemplateFile(targetRoot: string): string {
  return path.join(resolveRulesRoot(targetRoot), "templates", "rule.template.md");
}

export function resolveRuleFile(targetRoot: string, category: RuleCategory): string {
  return path.join(resolveRulesRoot(targetRoot), `${category}.md`);
}

export async function writeRuleDocuments(input: RuleDocsInput): Promise<string[]> {
  const files = [
    {
      path: resolveRulesReadmeFile(input.targetRoot),
      content: renderRulesReadme(input)
    },
    {
      path: resolveRulesIndexFile(input.targetRoot),
      content: renderRulesIndex(input)
    },
    {
      path: resolveRuleTemplateFile(input.targetRoot),
      content: renderRuleTemplate(input)
    }
  ];

  for (const rule of (input.rules ?? [])) {
    files.push({
      path: resolveRuleFile(input.targetRoot, rule.category),
      content: rule.content
    });
  }

  for (const file of files) {
    await fs.ensureDir(path.dirname(file.path));
    await fs.writeFile(file.path, file.content, "utf8");
  }

  return files.map((file) => file.path);
}

function renderRulesReadme(input: RuleDocsInput): string {
  return [
    "---",
    "schema: looply/rules-readme@v1",
    "name: rules-readme",
    "status: active",
    `project_mode: ${input.projectMode}`,
    `inference_policy: ${input.inferencePolicy}`,
    `output_locale: ${input.outputLocale}`,
    `interaction_mode: ${input.interactionMode}`,
    "---",
    "",
    "# Rules",
    "",
    "This folder contains project-specific rules that guide agents during workflow execution.",
    "",
    "## Purpose",
    "",
    "- Rules define constraints, conventions and standards that agents must follow.",
    "- Rules are project-specific, unlike knowledge (best-practices) which is reusable across projects.",
    "- Agents read relevant rules before producing outputs to ensure alignment with project expectations.",
    "",
    "## Scope",
    "",
    "- `coding-standards`: language conventions, naming, formatting, linting rules",
    "- `architecture-constraints`: patterns, frameworks, module boundaries, dependency rules",
    "- `testing-requirements`: testing framework, coverage expectations, test conventions",
    "- `security-policies`: auth patterns, data handling, secrets management",
    "- `business-rules`: domain constraints, validation rules, invariants",
    "- `project-conventions`: commit style, PR process, branching strategy",
    "",
    "## Rules",
    "",
    "- Keep rules in Markdown with frontmatter.",
    "- Each rule file maps to a single category.",
    "- Rules are procedural: agents read them before producing outputs.",
    "- Update rules when project conventions change.",
    "",
    "## Structure",
    "",
    "- `rules-index.md`: canonical index of registered rules",
    "- `<category>.md`: individual rule file per category",
    "- `templates/rule.template.md`: template for new rule files"
  ].join("\n");
}

function renderRulesIndex(input: RuleDocsInput): string {
  return [
    "---",
    "schema: looply/rules-index@v1",
    "name: rules-index",
    "status: draft",
    "coverage: low",
    `project_mode: ${input.projectMode}`,
    `inference_policy: ${input.inferencePolicy}`,
    `output_locale: ${input.outputLocale}`,
    `interaction_mode: ${input.interactionMode}`,
    "last_validated_at:",
    "---",
    "",
    "# Rules Index",
    "",
    "## How Hosts Should Use This",
    "",
    "- Before starting any workflow, scan relevant rule categories based on the task.",
    "- When a rule conflicts with the real codebase, the codebase wins.",
    "- Rules marked as `draft` should be validated and refined.",
    "- Treat rules as procedural constraints, not as optional hints.",
    "",
    "## Registered Rules",
    "",
    ...ruleCategories.map((cat) => {
      const label = ruleCategoryLabels[cat].label;
      const fileName = `${cat}.md`;
      const exists = (input.rules ?? []).some((r) => r.category === cat);
      return `- [${exists ? "x" : " "}] **${label}**: \`${fileName}\` ${exists ? "(active)" : "(not configured)"}`;
    }),
    "",
    "## Suggested Entry Format",
    "",
    "- `schema`: looply/rule@v1",
    "- `name`: short rule identifier within the category",
    "- `category`: one of the six rule categories",
    "- `summary`: one-line description of what this rule enforces",
    "- `priority`: high, medium, low",
    "- `applies_to`: list of agents, tasks or workflow stages this rule affects"
  ].join("\n");
}

function renderRuleTemplate(input: RuleDocsInput): string {
  return [
    "---",
    "schema: looply/rule@v1",
    "name: example-rule",
    "category: coding-standards",
    "summary: Describe what this rule enforces or guides",
    "priority: high",
    "applies_to:",
    "  - all",
    "tags:",
    "  - example",
    `project_mode: ${input.projectMode}`,
    "---",
    "",
    "# Rule",
    "",
    "## Purpose",
    "",
    "Describe the purpose of this rule and why it exists.",
    "",
    "## Rules",
    "",
    "- List each constraint or convention as a bullet point.",
    "- Use imperative language: 'Use', 'Avoid', 'Prefer', 'Never'.",
    "",
    "## Examples",
    "",
    "Provide positive and negative examples.",
    "",
    "## Enforcement",
    "",
    "Describe how this rule is enforced (linting, code review, automated checks)."
  ].join("\n");
}

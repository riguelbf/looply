import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { globby } from "globby";

const docsRoot = new URL("..", import.meta.url);
const repoRoot = new URL("../..", import.meta.url);
const generatedRoot = path.join(fileURLToPath(docsRoot), "reference", "generated");
const commandsRoot = path.join(fileURLToPath(repoRoot), "src", "commands");
const packRoot = path.join(fileURLToPath(repoRoot), "packs", "engineering-base");

const generatedFiles = {
  commands: path.join(generatedRoot, "commands.md"),
  agents: path.join(generatedRoot, "agents.md"),
  tasks: path.join(generatedRoot, "tasks.md"),
  workflows: path.join(generatedRoot, "workflows.md"),
  slashCommands: path.join(generatedRoot, "slash-commands.md"),
  knowledge: path.join(generatedRoot, "knowledge.md"),
  templates: path.join(generatedRoot, "templates.md"),
  checklists: path.join(generatedRoot, "checklists.md"),
  integrations: path.join(generatedRoot, "integrations.md")
};

for (const file of Object.values(generatedFiles)) {
  await assertFileExists(file);
}

const commandFiles = await globby("*.ts", { cwd: commandsRoot, absolute: true });
const agentFiles = await globby(path.join(packRoot, "agents", "*.md"), { absolute: true });
const taskFiles = await globby(path.join(packRoot, "tasks", "*.md"), { absolute: true });
const workflowFiles = await globby(path.join(packRoot, "workflows", "*.md"), { absolute: true });
const knowledgeFiles = await globby(path.join(packRoot, "knowledge", "*.md"), { absolute: true });
const templateFiles = await globby(path.join(packRoot, "templates", "*.md"), { absolute: true });
const checklistFiles = await globby(path.join(packRoot, "checklists", "*.md"), { absolute: true });

const commandsDoc = await fs.readFile(generatedFiles.commands, "utf8");
const agentsDoc = await fs.readFile(generatedFiles.agents, "utf8");
const tasksDoc = await fs.readFile(generatedFiles.tasks, "utf8");
const workflowsDoc = await fs.readFile(generatedFiles.workflows, "utf8");
const slashCommandsDoc = await fs.readFile(generatedFiles.slashCommands, "utf8");
const knowledgeDoc = await fs.readFile(generatedFiles.knowledge, "utf8");
const templatesDoc = await fs.readFile(generatedFiles.templates, "utf8");
const checklistsDoc = await fs.readFile(generatedFiles.checklists, "utf8");
const integrationsDoc = await fs.readFile(generatedFiles.integrations, "utf8");

for (const file of commandFiles) {
  const name = path.basename(file, ".ts");
  assertContainsHeading(commandsDoc, name, generatedFiles.commands);
}

for (const file of agentFiles) {
  const name = await readArtifactName(file);
  assertContainsHeading(agentsDoc, name, generatedFiles.agents);
}

for (const file of taskFiles) {
  const name = await readArtifactName(file);
  assertContainsHeading(tasksDoc, name, generatedFiles.tasks);
}

for (const file of workflowFiles) {
  const name = await readArtifactName(file);
  assertContainsHeading(workflowsDoc, name, generatedFiles.workflows);
}

for (const file of workflowFiles) {
  const source = await fs.readFile(file, "utf8");
  const parsed = matter(source);
  const commandName = parsed.data.command?.name;
  if (typeof commandName === "string") {
    assertContainsHeading(slashCommandsDoc, `/looply:${commandName}`, generatedFiles.slashCommands);
  }
}

for (const file of knowledgeFiles) {
  const name = await readArtifactName(file);
  assertContainsHeading(knowledgeDoc, name, generatedFiles.knowledge);
}

for (const file of templateFiles) {
  const name = await readArtifactName(file);
  assertContainsHeading(templatesDoc, name, generatedFiles.templates);
}

for (const file of checklistFiles) {
  const name = await readArtifactName(file);
  assertContainsHeading(checklistsDoc, name, generatedFiles.checklists);
}

if (!integrationsDoc.includes("looply integrations add")) {
  throw new Error(`Generated integrations reference is missing CLI usage in ${generatedFiles.integrations}`);
}

console.log("Docs reference is up to date.");

async function assertFileExists(file) {
  try {
    await fs.access(file);
  } catch {
    throw new Error(`Generated documentation file is missing: ${file}`);
  }
}

function assertContainsHeading(document, name, file) {
  const escaped = escapeRegex(name);
  const headingPattern = new RegExp(`^##\\s+(?:\\[)?${escaped}(?:\\]\\([^\\)]+\\))?$`, "m");
  if (!headingPattern.test(document)) {
    throw new Error(`Generated reference ${file} is missing heading for ${name}`);
  }
}

async function readArtifactName(file) {
  const source = await fs.readFile(file, "utf8");
  const parsed = matter(source);
  return String(parsed.data.name ?? path.basename(file, ".md"));
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

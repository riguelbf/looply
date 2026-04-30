import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { globby } from "globby";

const docsRoot = new URL("..", import.meta.url);
const repoRoot = new URL("../..", import.meta.url);
const docsRootPath = fileURLToPath(docsRoot);
const repoRootPath = fileURLToPath(repoRoot);
const generatedRoot = path.join(docsRootPath, "reference", "generated");
const commandsRoot = path.join(repoRootPath, "src", "commands");
const rootPackName = "software-delivery-suite";
const packRoots = await resolvePackRoots(rootPackName);

await resetGeneratedRoot();

const commandFiles = await globby("*.ts", { cwd: commandsRoot, absolute: true });
const commandSources = new Map(
  await Promise.all(commandFiles.map(async (file) => [file, await fs.readFile(file, "utf8")]))
);
const agents = await loadArtifactsFromPackRoots(packRoots, "agents/*.md");
const tasks = await loadArtifactsFromPackRoots(packRoots, "tasks/*.md");
const workflows = await loadArtifactsFromPackRoots(packRoots, "workflows/*.md");
const knowledge = await loadArtifactsFromPackRoots(packRoots, "knowledge/**/*.md");
const templates = await loadArtifactsFromPackRoots(packRoots, "templates/*.md");
const checklists = await loadArtifactsFromPackRoots(packRoots, "checklists/*.md");
const rules = await loadArtifactsFromPackRoots(packRoots, "rules/*.md");
const slashCommands = workflows
  .filter((artifact) => typeof artifact.frontmatter.command?.name === "string")
  .map((artifact) => buildSlashCommandEntry(artifact));

await writeGenerated("commands.md", renderCommandsIndex(commandFiles, commandSources));
await writeGenerated("agents.md", renderArtifactsIndex("Agents", "agents", agents));
await writeGenerated("tasks.md", renderArtifactsIndex("Tasks", "tasks", tasks));
await writeGenerated("workflows.md", renderWorkflowsIndex(workflows));
await writeGenerated("slash-commands.md", renderSlashCommandsIndex(slashCommands));
await writeGenerated("knowledge.md", renderArtifactsIndex("Knowledge", "knowledge", knowledge));
await writeGenerated("templates.md", renderArtifactsIndex("Templates", "templates", templates));
await writeGenerated("checklists.md", renderArtifactsIndex("Checklists", "checklists", checklists));
await writeGenerated("rules.md", renderArtifactsIndex("Rules", "rules", rules));
await writeGenerated("integrations.md", renderIntegrationsReference());

for (const file of commandFiles) {
  const entry = buildCommandEntry(file, commandSources);
  await writeGenerated(path.join("commands", `${entry.name}.md`), renderCommandDetail(entry));
}

for (const artifact of agents) {
  await writeGenerated(path.join("agents", `${artifact.name}.md`), renderAgentDetail(artifact));
}

for (const artifact of tasks) {
  await writeGenerated(path.join("tasks", `${artifact.name}.md`), renderTaskDetail(artifact));
}

for (const artifact of workflows) {
  await writeGenerated(path.join("workflows", `${artifact.name}.md`), renderWorkflowDetail(artifact));
}

for (const command of slashCommands) {
  await writeGenerated(path.join("slash-commands", `${command.name}.md`), renderSlashCommandDetail(command));
}

for (const artifact of knowledge) {
  await writeGenerated(path.join("knowledge", `${artifact.name}.md`), renderSimpleArtifactDetail("Knowledge", "knowledge", artifact));
}

for (const artifact of templates) {
  await writeGenerated(path.join("templates", `${artifact.name}.md`), renderSimpleArtifactDetail("Templates", "templates", artifact));
}

for (const artifact of checklists) {
  await writeGenerated(path.join("checklists", `${artifact.name}.md`), renderSimpleArtifactDetail("Checklists", "checklists", artifact));
}

for (const artifact of rules) {
  await writeGenerated(path.join("rules", `${artifact.name}.md`), renderRuleDetail(artifact));
}

async function resetGeneratedRoot() {
  await fs.rm(generatedRoot, { recursive: true, force: true });
  await fs.mkdir(generatedRoot, { recursive: true });
}

async function loadArtifacts(pattern) {
  const files = await globby(pattern, { absolute: true });
  const entries = [];

  for (const file of files.sort()) {
    const source = await fs.readFile(file, "utf8");
    const parsed = matter(source);
    entries.push({
      file,
      name: String(parsed.data.name ?? path.basename(file, ".md")),
      summary: typeof parsed.data.summary === "string" ? parsed.data.summary : "",
      frontmatter: parsed.data,
      body: parsed.content.trim()
    });
  }

  return entries;
}

async function loadArtifactsFromPackRoots(packRoots, relativePattern) {
  const entries = [];
  const seen = new Set();

  for (const packRoot of packRoots) {
    const packEntries = await loadArtifacts(path.join(packRoot, relativePattern));
    for (const entry of packEntries) {
      const key = `${entry.frontmatter.schema ?? "unknown"}:${entry.name}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      entries.push(entry);
    }
  }

  return entries.sort((left, right) => left.name.localeCompare(right.name));
}

async function resolvePackRoots(rootPackName) {
  const definitions = await globby("packs/*/pack.md", { cwd: repoRootPath, absolute: true });
  const definitionMap = new Map();

  for (const definitionFile of definitions) {
    const source = await fs.readFile(definitionFile, "utf8");
    const parsed = matter(source);
    const packName = String(parsed.data.name ?? path.basename(path.dirname(definitionFile)));
    definitionMap.set(packName, {
      name: packName,
      root: path.dirname(definitionFile),
      includes: Array.isArray(parsed.data.includes?.packs) ? parsed.data.includes.packs : []
    });
  }

  const resolved = [];
  const visited = new Set();

  const visit = (packName) => {
    if (visited.has(packName)) {
      return;
    }

    const definition = definitionMap.get(packName);
    if (!definition) {
      throw new Error(`Unknown pack in docs reference generation: ${packName}`);
    }

    visited.add(packName);
    resolved.push(definition.root);

    for (const includedPack of definition.includes) {
      visit(String(includedPack));
    }
  };

  visit(rootPackName);
  return resolved;
}

function renderCommandsIndex(files, commandSources) {
  const entries = files
    .map((file) => buildCommandEntry(file, commandSources))
    .sort((left, right) => left.name.localeCompare(right.name));

  return [
    "# Comandos CLI",
    "",
    "Referencia gerada a partir de `src/commands/`.",
    "",
    ...entries.flatMap((entry) => [
      `## [${entry.name}](./commands/${entry.name})`,
      "",
      entry.description,
      "",
      `- options: ${entry.options.length}`,
      ""
    ])
  ].join("\n");
}

function renderArtifactsIndex(title, folder, entries) {
  return [
    `# ${title}`,
    "",
    "Referencia gerada a partir do pack `engineering-base`.",
    "",
    ...entries.flatMap((entry) => [
      `## [${entry.name}](./${folder}/${entry.name})`,
      "",
      entry.summary || "Sem summary declarada.",
      "",
      `- arquivo: \`${toRepoRelative(entry.file)}\``,
      ""
    ])
  ].join("\n");
}

function renderWorkflowsIndex(entries) {
  return [
    "# Workflows",
    "",
    "Referencia gerada a partir do pack `engineering-base`.",
    "",
    ...entries.flatMap((entry) => {
      const phase = typeof entry.frontmatter.phase === "string" ? entry.frontmatter.phase : "n/a";
      const commandName = typeof entry.frontmatter.command?.name === "string" ? entry.frontmatter.command.name : null;

      return [
        `## [${entry.name}](./workflows/${entry.name})`,
        "",
        entry.summary || "Sem summary declarada.",
        "",
        `- phase: \`${phase}\``,
        ...(commandName ? [`- alias principal: \`/looply:${commandName}\``] : []),
        ""
      ];
    })
  ].join("\n");
}

function renderSlashCommandsIndex(entries) {
  return [
    "# Slash Commands",
    "",
    "Referencia gerada a partir dos workflows publicados para os hosts suportados.",
    "",
    ...entries.flatMap((entry) => [
      `## [/${entry.name}](./slash-commands/${entry.name})`,
      "",
      entry.description,
      "",
      `- workflow: \`${entry.workflow}\``,
      `- hosts: ${entry.hosts.map((host) => `\`${host}\``).join(", ")}`,
      ...(entry.aliases.length > 0 ? [`- aliases: ${entry.aliases.map((alias) => `\`/${alias}\``).join(", ")}`] : []),
      ""
    ])
  ].join("\n");
}

function renderCommandDetail(entry) {
  return [
    `# ${entry.name}`,
    "",
    entry.description,
    "",
    "## Arquivo de origem",
    "",
    `- \`${entry.file}\``,
    "",
    "## Options",
    "",
    ...(entry.options.length > 0
      ? entry.options.map((option) => `- \`${option.flag}\`: ${option.description}`)
      : ["- Nenhuma option detectada nesta versao."]),
    "",
    "[Voltar para comandos](../commands)"
  ].join("\n");
}

function renderAgentDetail(artifact) {
  return [
    `# ${artifact.name}`,
    "",
    artifact.summary || "Sem summary declarada.",
    "",
    "## Papel",
    "",
    `- role: \`${String(artifact.frontmatter.role ?? "n/a")}\``,
    `- mission: ${String(artifact.frontmatter.mission ?? "n/a")}`,
    "",
    "## Tasks suportadas",
    "",
    ...renderList(artifact.frontmatter.supported_tasks),
    "",
    "## Knowledge sources",
    "",
    ...renderList(artifact.frontmatter.knowledge_sources),
    "",
    "## Constraints",
    "",
    ...renderList(artifact.frontmatter.constraints),
    "",
    "## Escalation rules",
    "",
    ...renderList(artifact.frontmatter.escalation_rules),
    "",
    "## Conteudo do artefato",
    "",
    artifact.body,
    "",
    `## Arquivo`,
    "",
    `- \`${toRepoRelative(artifact.file)}\``,
    "",
    "[Voltar para agents](../agents)"
  ].join("\n");
}

function renderTaskDetail(artifact) {
  return [
    `# ${artifact.name}`,
    "",
    artifact.summary || "Sem summary declarada.",
    "",
    "## Ownership",
    "",
    `- agent: \`${String(artifact.frontmatter.agent ?? "n/a")}\``,
    "",
    "## Inputs",
    "",
    ...renderList(artifact.frontmatter.inputs),
    "",
    "## Context",
    "",
    ...renderList(artifact.frontmatter.context),
    "",
    "## Outputs",
    "",
    ...renderList(artifact.frontmatter.outputs),
    "",
    "## Templates",
    "",
    ...renderList(artifact.frontmatter.templates),
    "",
    "## Checklists",
    "",
    ...renderList(artifact.frontmatter.checklists),
    "",
    "## Dependencies",
    "",
    ...renderList(artifact.frontmatter.dependencies),
    "",
    "## Conteudo do artefato",
    "",
    artifact.body,
    "",
    "## Arquivo",
    "",
    `- \`${toRepoRelative(artifact.file)}\``,
    "",
    "[Voltar para tasks](../tasks)"
  ].join("\n");
}

function renderSimpleArtifactDetail(title, folder, artifact) {
  return [
    `# ${artifact.name}`,
    "",
    artifact.summary || "Sem summary declarada.",
    "",
    "## Metadados",
    "",
    ...renderFrontmatterFields(artifact.frontmatter),
    "",
    "## Conteudo do artefato",
    "",
    artifact.body,
    "",
    "## Arquivo",
    "",
    `- \`${toRepoRelative(artifact.file)}\``,
    "",
    `[Voltar para ${folder}](../${folder})`
  ].join("\n");
}

function renderRuleDetail(artifact) {
  return [
    `# ${artifact.name}`,
    "",
    artifact.summary || "Sem summary declarada.",
    "",
    "## Metadados",
    "",
    `- category: \`${String(artifact.frontmatter.category ?? "n/a")}\``,
    `- priority: \`${String(artifact.frontmatter.priority ?? "n/a")}\``,
    "",
    "## Aplica-se a",
    "",
    ...renderList(artifact.frontmatter.applies_to),
    "",
    "## Tags",
    "",
    ...renderList(artifact.frontmatter.tags),
    "",
    "## Conteudo do artefato",
    "",
    artifact.body,
    "",
    "## Arquivo",
    "",
    `- \`${toRepoRelative(artifact.file)}\``,
    "",
    "[Voltar para rules](../rules)"
  ].join("\n");
}

function renderWorkflowDetail(artifact) {
  const frontmatter = artifact.frontmatter;
  const stages = Array.isArray(frontmatter.stages) ? frontmatter.stages : [];
  const handoffs = Array.isArray(frontmatter.handoffs) ? frontmatter.handoffs : [];
  const gates = Array.isArray(frontmatter.gates) ? frontmatter.gates : [];
  const command = typeof frontmatter.command === "object" && frontmatter.command !== null ? frontmatter.command : null;

  return [
    `# ${artifact.name}`,
    "",
    artifact.summary || "Sem summary declarada.",
    "",
    "## Metadados",
    "",
    `- phase: \`${String(frontmatter.phase ?? "n/a")}\``,
    `- orchestrator: \`${String(frontmatter.orchestrator ?? "n/a")}\``,
    ...(command && typeof command.name === "string" ? [`- alias principal: \`/looply:${command.name}\``] : []),
    ...(command && Array.isArray(command.aliases) && command.aliases.length > 0
      ? [`- aliases: ${command.aliases.map((alias) => `\`/looply:${String(alias)}\``).join(", ")}`]
      : []),
    "",
    ...(command ? renderWorkflowCommandSection(command, frontmatter.execution) : []),
    "## Inputs",
    "",
    ...renderList(frontmatter.inputs),
    "",
    "## Outputs",
    "",
    ...renderList(frontmatter.outputs),
    "",
    "## Stages",
    "",
    ...(stages.length > 0
      ? stages.flatMap((stage) => [
          `### ${String(stage.name ?? "unnamed-stage")}`,
          "",
          `- task: \`${String(stage.task ?? "n/a")}\``,
          `- agent: \`${String(stage.agent ?? "n/a")}\``,
          ...renderListWithPrefix("depends_on", stage.depends_on),
          ...renderListWithPrefix("inputs", stage.inputs),
          ...renderListWithPrefix("outputs", stage.outputs),
          ""
        ])
      : ["- Nenhum stage declarado.", ""]),
    "## Handoffs",
    "",
    ...(handoffs.length > 0
      ? handoffs.map((handoff) => `- \`${String(handoff.from ?? "n/a")}\` -> \`${String(handoff.to ?? "n/a")}\` via \`${String(handoff.artifact ?? "n/a")}\``)
      : ["- Nenhum handoff declarado."]),
    "",
    "## Gates",
    "",
    ...(gates.length > 0
      ? gates.map((gate) => `- \`${String(gate.name ?? "n/a")}\` after \`${String(gate.after_stage ?? "n/a")}\` owner \`${String(gate.owner ?? "n/a")}\``)
      : ["- Nenhum gate declarado."]),
    "",
    "## Conteudo do artefato",
    "",
    artifact.body,
    "",
    "## Arquivo",
    "",
    `- \`${toRepoRelative(artifact.file)}\``,
    "",
    "[Voltar para workflows](../workflows)"
  ].join("\n");
}

function renderSlashCommandDetail(entry) {
  return [
    `# /${entry.name}`,
    "",
    entry.description,
    "",
    "## Uso",
    "",
    `\`/${entry.name} ${entry.argumentHint}\``,
    "",
    "## Workflow associado",
    "",
    `- workflow: [${entry.workflow}](../workflows/${entry.workflow})`,
    `- fase: \`${entry.phase}\``,
    `- orchestrator: \`${entry.orchestrator}\``,
    "",
    "## Hosts suportados",
    "",
    ...entry.hosts.map((host) => `- \`${host}\``),
    "",
    "## Aliases",
    "",
    ...(entry.aliases.length > 0 ? entry.aliases.map((alias) => `- \`/${alias}\``) : ["- Nenhum alias declarado."]),
    "",
    "## Argumentos",
    "",
    ...(entry.arguments.length > 0
      ? entry.arguments.map((argument) => {
          const suffix = argument.variadic ? " variadic" : "";
          return `- \`${argument.name}\`${argument.required ? " required" : " optional"}${suffix}: ${argument.description}`;
        })
      : ["- Nenhum argumento declarado."]),
    "",
    "## Quando usar",
    "",
    ...entry.whenToUse.map((item) => `- ${item}`),
    "",
    "## Outputs esperados",
    "",
    ...entry.outputs.map((item) => `- \`${item}\``),
    "",
    "## Exemplo",
    "",
    "```text",
    entry.example,
    "```",
    "",
    "[Voltar para slash commands](../slash-commands)"
  ].join("\n");
}

function renderIntegrationsReference() {
  return [
    "# Integracoes",
    "",
    "Esta secao documenta o modelo de `integration context` do looply.",
    "",
    "## Estrutura esperada",
    "",
    "- `.looply/custom/integrations/integrations-index.md`",
    "- `.looply/custom/integrations/<integration>.md`",
    "- `.looply/custom/integrations/templates/integration-context.template.md`",
    "- `.looply/custom/integrations/adapters/README.md`",
    "- `.looply/custom/integrations/secrets/README.md`",
    "",
    "## Responsabilidades",
    "",
    "- `integration context`: contexto para raciocinio do host",
    "- `integration adapter`: reservado para execucao futura",
    "- `integration secrets/config`: reservado para operacao segura futura",
    "",
    "## CLI",
    "",
    "- `looply integrations list`",
    "- `looply integrations add [name]`",
    "- `looply integrations configure <name>`",
    "",
    "## Como o host deve consumir",
    "",
    "- abrir primeiro o `integrations-index.md`",
    "- localizar a integracao citada na feature",
    "- abrir o arquivo da integracao",
    "- validar no codebase se o contexto estiver `draft`, `stale` ou incompleto"
  ].join("\n");
}

function renderWorkflowCommandSection(command, execution) {
  const hosts = Array.isArray(execution?.preferred_hosts) ? execution.preferred_hosts : ["codex", "claude"];
  const aliases = Array.isArray(command.aliases) ? command.aliases : [];
  const argumentsList = Array.isArray(command.arguments) ? command.arguments : [];

  return [
    "## Slash Command",
    "",
    `- command: \`/looply:${String(command.name ?? "n/a")}\``,
    `- argument hint: \`${String(command.argument_hint ?? "")}\``,
    `- hosts: ${hosts.map((host) => `\`${String(host)}\``).join(", ")}`,
    ...(aliases.length > 0 ? [`- aliases: ${aliases.map((alias) => `\`/looply:${String(alias)}\``).join(", ")}`] : []),
    "",
    "### Argumentos",
    "",
    ...(argumentsList.length > 0
      ? argumentsList.map((argument) => {
          const required = argument.required ? "required" : "optional";
          const variadic = argument.variadic ? ", variadic" : "";
          return `- \`${String(argument.name ?? "unnamed")}\` ${required}${variadic}: ${String(argument.description ?? "Sem descricao")}`;
        })
      : ["- Nenhum argumento declarado."]),
    ""
  ];
}

async function writeGenerated(fileName, content) {
  const file = path.join(generatedRoot, fileName);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${content}\n`, "utf8");
}

function toRepoRelative(file) {
  return path.relative(repoRootPath, file).replaceAll("\\", "/");
}

function buildCommandEntry(file, commandSources) {
  const source = commandSources.get(file) ?? "";
  const name = path.basename(file, ".ts");
  const descriptionMatch = source.match(/\.description\("([^"]+)"\)/);
  const optionMatches = [...source.matchAll(/\.option\("([^"]+)",\s*"([^"]+)"/g)];
  const uniqueOptions = new Map();
  for (const match of optionMatches) {
    uniqueOptions.set(match[1], match[2]);
  }

  return {
    name,
    file: toRepoRelative(file),
    description: descriptionMatch?.[1] ?? "No description found.",
    options: [...uniqueOptions.entries()].map(([flag, description]) => ({ flag, description }))
  };
}

function buildSlashCommandEntry(artifact) {
  const command = artifact.frontmatter.command ?? {};
  const execution = artifact.frontmatter.execution ?? {};
  const hosts = Array.isArray(execution.preferred_hosts) && execution.preferred_hosts.length > 0
    ? execution.preferred_hosts.map((host) => String(host))
    : ["codex", "claude"];
  const aliases = Array.isArray(command.aliases) ? command.aliases.map((alias) => `looply:${String(alias)}`) : [];
  const argumentsList = Array.isArray(command.arguments)
    ? command.arguments.map((argument) => ({
        name: String(argument.name ?? "unnamed"),
        description: String(argument.description ?? "Sem descricao"),
        required: Boolean(argument.required),
        variadic: Boolean(argument.variadic)
      }))
    : [];
  const outputs = Array.isArray(artifact.frontmatter.outputs)
    ? artifact.frontmatter.outputs.map((item) => String(item))
    : [];

  return {
    name: `looply:${String(command.name)}`,
    workflow: artifact.name,
    phase: String(artifact.frontmatter.phase ?? "n/a"),
    orchestrator: String(artifact.frontmatter.orchestrator ?? "n/a"),
    description: String(command.description ?? artifact.summary ?? "Sem descricao declarada."),
    argumentHint: String(command.argument_hint ?? ""),
    aliases,
    arguments: argumentsList,
    outputs,
    hosts,
    whenToUse: buildWhenToUse(artifact.name),
    example: buildSlashExample(String(command.name), String(command.argument_hint ?? ""))
  };
}

function buildWhenToUse(workflowName) {
  switch (workflowName) {
    case "idea-to-prd":
      return [
        "quando voce tem uma ideia bruta ou problema de negocio e quer abrir discovery",
        "quando ainda nao existe PRD aprovado para a feature"
      ];
    case "prd-to-stories":
      return [
        "quando o PRD ja esta consolidado e voce quer quebrar em backlog acionavel",
        "quando discovery terminou e planning vai começar"
      ];
    case "story-to-production":
      return [
        "quando uma story ja foi selecionada e voce quer avancar em design tecnico, implementacao e release",
        "quando planning ja gerou backlog e a feature entrou em delivery"
      ];
    case "workflow-status":
      return [
        "quando precisa retomar uma sessao, descobrir onde o trabalho parou ou ver o proximo passo",
        "quando ha varias sessoes abertas e voce precisa reconciliar a certa"
      ];
    default:
      return ["quando o workflow associado deve ser invocado manualmente no host"];
  }
}

function buildSlashExample(commandName, argumentHint) {
  switch (commandName) {
    case "idea-to-prd":
      return `/looply:idea-to-prd pix-webhook-retry "falhas transientes no webhook PIX geram reconciliacao manual" "manter compatibilidade com contrato atual"`;
    case "prd-to-stories":
      return `/looply:prd-to-stories pix-webhook-retry prd-pix-webhook-retry`;
    case "story-to-production":
      return `/looply:story-to-production pix-webhook-retry story-01-retry-automatico`;
    case "workflow-status":
      return `/looply:workflow-status pix-webhook-retry backend-afternoon`;
    default:
      return `/${commandName} ${argumentHint}`.trim();
  }
}

function renderList(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return ["- Nenhum item declarado."];
  }

  return value.map((item) => `- \`${String(item)}\``);
}

function renderListWithPrefix(label, value) {
  if (!Array.isArray(value) || value.length === 0) {
    return [];
  }

  return [`- ${label}: ${value.map((item) => `\`${String(item)}\``).join(", ")}`];
}

function renderFrontmatterFields(frontmatter) {
  const entries = Object.entries(frontmatter ?? {}).filter(([key]) => key !== "schema" && key !== "name");
  if (entries.length === 0) {
    return ["- Nenhum metadado adicional declarado."];
  }

  return entries.map(([key, value]) => {
    if (Array.isArray(value)) {
      return `- ${key}: ${value.map((item) => `\`${String(item)}\``).join(", ")}`;
    }

    if (value && typeof value === "object") {
      return `- ${key}: \`${JSON.stringify(value)}\``;
    }

    return `- ${key}: \`${String(value)}\``;
  });
}

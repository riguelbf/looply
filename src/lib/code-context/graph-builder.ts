import type { CodeContextDocument } from "./schema.js";
import {
  KNOWLEDGE_GRAPH_VERSION,
  type KnowledgeGraph,
  type KnowledgeNode,
  type KnowledgeEdge,
  type KnowledgeGraphSummary,
  type KnowledgeNodeKind
} from "./graph-schema.js";

export function buildKnowledgeGraph(
  document: CodeContextDocument,
  projectRoot: string
): KnowledgeGraph {
  const nodes: KnowledgeNode[] = [];
  const edges: KnowledgeEdge[] = [];

  const moduleNodes = new Map<string, KnowledgeNode>();
  const fileNodes = new Map<string, KnowledgeNode>();
  const symbolNodes = new Map<string, KnowledgeNode>();

  for (const module of document.modules) {
    const moduleNode: KnowledgeNode = {
      id: module.id,
      kind: "module",
      label: module.label,
      provider: module.providerId,
      file: undefined
    };
    nodes.push(moduleNode);
    moduleNodes.set(module.id, moduleNode);

    for (const relModuleId of module.dependsOnModules) {
      edges.push({
        type: "imports",
        from: module.id,
        to: relModuleId
      });
    }
  }

  for (const module of document.modules) {
    const moduleNode = moduleNodes.get(module.id);
    if (!moduleNode) continue;

    for (const file of module.files) {
      const fileNode: KnowledgeNode = {
        id: `file:${module.providerId}:${file}`,
        kind: "file",
        label: file,
        provider: module.providerId,
        file
      };
      nodes.push(fileNode);
      fileNodes.set(file, fileNode);

      edges.push({
        type: "contains",
        from: module.id,
        to: fileNode.id
      });
      edges.push({
        type: "belongs_to",
        from: fileNode.id,
        to: module.id
      });
    }
  }

  for (const symbol of document.symbols) {
    const kind = mapSymbolKind(symbol.kind);
    if (!kind) continue;

    const symbolId = `symbol:${symbol.providerId}:${symbol.file}:${symbol.name}`;
    const fileId = `file:${symbol.providerId}:${symbol.file}`;

    const symbolNode: KnowledgeNode = {
      id: symbolId,
      kind,
      label: symbol.name,
      provider: symbol.providerId,
      file: symbol.file,
      metadata: {
        exported: symbol.exported,
        references: symbol.references
      }
    };
    nodes.push(symbolNode);
    symbolNodes.set(symbolId, symbolNode);

    edges.push({
      type: "belongs_to",
      from: symbolId,
      to: fileId
    });

    if (fileNodes.has(fileId)) {
      edges.push({
        type: "contains",
        from: fileId,
        to: symbolId
      });
    }
  }

  for (const relation of document.relations) {
    if (relation.type === "imports") {
      const fromModule = findModuleForFile(relation.from, document);
      const toModule = findModuleForFile(relation.to, document);
      if (fromModule && toModule) {
        edges.push({
          type: "imports",
          from: fromModule,
          to: toModule
        });
      }
    }
  }

  const summary = buildSummary(nodes, edges);

  return {
    version: KNOWLEDGE_GRAPH_VERSION,
    generatedAt: new Date().toISOString(),
    projectRoot,
    nodes,
    edges,
    summary
  };
}

function mapSymbolKind(kind: string): KnowledgeNodeKind | null {
  switch (kind) {
    case "class":
      return "class";
    case "function":
    case "method":
      return "function";
    case "interface":
      return "interface";
    case "type":
      return "type";
    case "enum":
      return "enum";
    case "variable":
    case "key":
    case "workflow":
    case "job":
    case "service":
    case "resource":
      return "variable";
    default:
      return null;
  }
}

function findModuleForFile(
  file: string,
  document: CodeContextDocument
): string | null {
  for (const module of document.modules) {
    if (module.files.includes(file)) {
      return module.id;
    }
  }
  return null;
}

function buildSummary(
  nodes: KnowledgeNode[],
  edges: KnowledgeEdge[]
): KnowledgeGraphSummary {
  const byKind: Record<string, number> = {};
  const byProvider: Record<string, number> = {};

  for (const node of nodes) {
    byKind[node.kind] = (byKind[node.kind] ?? 0) + 1;
    byProvider[node.provider] = (byProvider[node.provider] ?? 0) + 1;
  }

  return {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    byKind,
    byProvider
  };
}

export function mergeNodes(
  graph: KnowledgeGraph,
  newNodes: KnowledgeNode[],
  newEdges: KnowledgeEdge[]
): KnowledgeGraph {
  const existingNodeIds = new Set(graph.nodes.map((n) => n.id));
  const existingEdgeKeys = new Set(graph.edges.map((e) => `${e.type}:${e.from}:${e.to}`));

  const uniqueNodes = newNodes.filter((n) => !existingNodeIds.has(n.id));
  const uniqueEdges = newEdges.filter(
    (e) => !existingEdgeKeys.has(`${e.type}:${e.from}:${e.to}`)
  );

  graph.nodes.push(...uniqueNodes);
  graph.edges.push(...uniqueEdges);
  graph.summary = buildSummary(graph.nodes, graph.edges);

  return graph;
}

export const KNOWLEDGE_GRAPH_VERSION = 1 as const;

export type KnowledgeNodeKind =
  | "module"
  | "file"
  | "class"
  | "function"
  | "interface"
  | "type"
  | "enum"
  | "variable"
  | "endpoint"
  | "table"
  | "column"
  | "feature"
  | "story";

export interface KnowledgeNode {
  id: string;
  kind: KnowledgeNodeKind;
  label: string;
  provider: string;
  file?: string;
  metadata?: Record<string, unknown>;
}

export type KnowledgeEdgeType =
  | "imports"
  | "calls"
  | "extends"
  | "implements"
  | "contains"
  | "belongs_to"
  | "has_column"
  | "references_col"
  | "maps_to"
  | "uses_table"
  | "depends_on"
  | "impacts";

export interface KnowledgeEdge {
  type: KnowledgeEdgeType;
  from: string;
  to: string;
}

export interface KnowledgeGraphSummary {
  totalNodes: number;
  totalEdges: number;
  byKind: Record<string, number>;
  byProvider: Record<string, number>;
}

export interface KnowledgeSubgraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export interface KnowledgeGraph {
  version: typeof KNOWLEDGE_GRAPH_VERSION;
  generatedAt: string;
  projectRoot: string;
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  summary: KnowledgeGraphSummary;
}

import type {
  KnowledgeGraph,
  KnowledgeNode,
  KnowledgeEdge,
  KnowledgeSubgraph
} from "./graph-schema.js";

export interface GraphQuery {
  node(id: string): KnowledgeNode | undefined;
  neighbors(id: string): KnowledgeNode[];
  neighborhood(id: string, hops: number): KnowledgeSubgraph;
  dependentsOf(id: string): KnowledgeNode[];
  dependenciesOf(id: string): KnowledgeNode[];
  path(from: string, to: string): KnowledgeEdge[];
  impactedBy(storyId: string): KnowledgeNode[];
  tablesUsedBy(moduleId: string): KnowledgeNode[];
  search(query: string): KnowledgeNode[];
}

export function createGraphQuery(graph: KnowledgeGraph): GraphQuery {
  const nodeMap = new Map<string, KnowledgeNode>();
  const outEdges = new Map<string, KnowledgeEdge[]>();
  const inEdges = new Map<string, KnowledgeEdge[]>();

  for (const node of graph.nodes) {
    nodeMap.set(node.id, node);
  }

  const getOut = (id: string): KnowledgeEdge[] => {
    if (!outEdges.has(id)) {
      outEdges.set(id, graph.edges.filter((e) => e.from === id));
    }
    return outEdges.get(id)!;
  };

  const getIn = (id: string): KnowledgeEdge[] => {
    if (!inEdges.has(id)) {
      inEdges.set(id, graph.edges.filter((e) => e.to === id));
    }
    return inEdges.get(id)!;
  };

  return {
    node(id: string): KnowledgeNode | undefined {
      return nodeMap.get(id);
    },

    neighbors(id: string): KnowledgeNode[] {
      const neighborIds = new Set<string>();
      for (const edge of getOut(id)) {
        neighborIds.add(edge.to);
      }
      for (const edge of getIn(id)) {
        neighborIds.add(edge.from);
      }
      return Array.from(neighborIds)
        .map((nid) => nodeMap.get(nid)!)
        .filter(Boolean);
    },

    neighborhood(id: string, hops: number): KnowledgeSubgraph {
      const visited = new Set<string>();
      const subNodes: KnowledgeNode[] = [];
      const subEdges: KnowledgeEdge[] = [];

      const startNode = nodeMap.get(id);
      if (!startNode) return { nodes: [], edges: [] };

      const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId: id, depth: 0 }];
      visited.add(id);
      subNodes.push(startNode);

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (current.depth >= hops) continue;

        for (const edge of [...getOut(current.nodeId), ...getIn(current.nodeId)]) {
          const neighborId = edge.from === current.nodeId ? edge.to : edge.from;

          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            const neighborNode = nodeMap.get(neighborId);
            if (neighborNode) {
              subNodes.push(neighborNode);
              queue.push({ nodeId: neighborId, depth: current.depth + 1 });
            }
          }

          const edgeKey = `${edge.type}:${edge.from}:${edge.to}`;
          if (!subEdges.some((e) => `${e.type}:${e.from}:${e.to}` === edgeKey)) {
            subEdges.push(edge);
          }
        }
      }

      return { nodes: subNodes, edges: subEdges };
    },

    dependentsOf(id: string): KnowledgeNode[] {
      return getIn(id)
        .map((e) => nodeMap.get(e.from)!)
        .filter(Boolean);
    },

    dependenciesOf(id: string): KnowledgeNode[] {
      return getOut(id)
        .map((e) => nodeMap.get(e.to)!)
        .filter(Boolean);
    },

    path(from: string, to: string): KnowledgeEdge[] {
      if (from === to) return [];
      if (!nodeMap.has(from) || !nodeMap.has(to)) return [];

      const visited = new Set<string>();
      const queue: Array<{ nodeId: string; path: KnowledgeEdge[] }> = [{ nodeId: from, path: [] }];
      visited.add(from);

      while (queue.length > 0) {
        const current = queue.shift()!;

        for (const edge of getOut(current.nodeId)) {
          if (visited.has(edge.to)) continue;
          visited.add(edge.to);
          const newPath = [...current.path, edge];

          if (edge.to === to) {
            return newPath;
          }

          queue.push({ nodeId: edge.to, path: newPath });
        }
      }

      return [];
    },

    impactedBy(storyId: string): KnowledgeNode[] {
      const storyNode = nodeMap.get(storyId);
      if (!storyNode) return [];

      const impacted = new Set<string>();
      const visited = new Set<string>();

      function traverse(nodeId: string) {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);

        for (const edge of getOut(nodeId)) {
          if (edge.type === "impacts") {
            impacted.add(edge.to);
            traverse(edge.to);
          }
        }
      }

      traverse(storyId);
      return Array.from(impacted)
        .map((nid) => nodeMap.get(nid)!)
        .filter(Boolean);
    },

    tablesUsedBy(moduleId: string): KnowledgeNode[] {
      const tables = new Set<string>();

      const filesInModule = graph.edges
        .filter((e) => e.type === "contains" && e.from === moduleId)
        .map((e) => e.to);

      for (const fileId of filesInModule) {
        const usesEdges = getOut(fileId).filter((e) => e.type === "uses_table");
        for (const edge of usesEdges) {
          tables.add(edge.to);
        }
      }

      return Array.from(tables)
        .map((tid) => nodeMap.get(tid)!)
        .filter(Boolean);
    },

    search(query: string): KnowledgeNode[] {
      const normalized = query.toLowerCase();
      return graph.nodes.filter(
        (n) =>
          n.label.toLowerCase().includes(normalized) ||
          n.id.toLowerCase().includes(normalized)
      );
    }
  };
}

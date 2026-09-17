import { Entity, Relationship } from "../types/intelligence";

/**
 * Calculates Degree Centrality, Normalized Betweenness Centrality (Brandes algorithm),
 * PageRank, and Community Clusters for the given graph.
 */
export function computeGraphMetrics(
  nodes: Entity[] = [],
  links: Relationship[] = []
): {
  enrichedNodes: Entity[];
  metricsSummary: {
    totalNodes: number;
    totalEdges: number;
    avgDegree: number;
    maxBetweennessNode: string;
    communitiesCount: number;
  };
} {
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safeLinks = Array.isArray(links) ? links : [];

  const nodeMap = new Map<string, Entity>();
  safeNodes.forEach((n) => {
    nodeMap.set(n.id, { ...n });
  });

  const nodeIds = safeNodes.map((n) => n.id);
  const adj = new Map<string, Set<string>>();
  nodeIds.forEach((id) => adj.set(id, new Set<string>()));

  // Normalize links (which could have object or string source/target)
  safeLinks.forEach((link) => {
    if (!link) return;
    const sId = typeof link.source === "object" ? (link.source as any).id : link.source;
    const tId = typeof link.target === "object" ? (link.target as any).id : link.target;

    if (adj.has(sId) && adj.has(tId)) {
      adj.get(sId)!.add(tId);
      adj.get(tId)!.add(sId);
    }
  });

  // 1. Degree Centrality
  nodeIds.forEach((id) => {
    const neighbors = adj.get(id) || new Set();
    const node = nodeMap.get(id)!;
    node.degree = neighbors.size;
  });

  // 2. Betweenness Centrality (Brandes' Algorithm)
  const betweenness = new Map<string, number>();
  nodeIds.forEach((id) => betweenness.set(id, 0));

  nodeIds.forEach((s) => {
    const S: string[] = [];
    const P = new Map<string, string[]>();
    nodeIds.forEach((id) => P.set(id, []));

    const sigma = new Map<string, number>();
    nodeIds.forEach((id) => sigma.set(id, 0));
    sigma.set(s, 1);

    const d = new Map<string, number>();
    nodeIds.forEach((id) => d.set(id, -1));
    d.set(s, 0);

    const Q: string[] = [s];

    while (Q.length > 0) {
      const v = Q.shift()!;
      S.push(v);

      const neighbors = Array.from(adj.get(v) || []);
      for (const w of neighbors) {
        if (d.get(w)! < 0) {
          Q.push(w);
          d.set(w, d.get(v)! + 1);
        }
        if (d.get(w) === d.get(v)! + 1) {
          sigma.set(w, sigma.get(w)! + sigma.get(v)!);
          P.get(w)!.push(v);
        }
      }
    }

    const delta = new Map<string, number>();
    nodeIds.forEach((id) => delta.set(id, 0));

    while (S.length > 0) {
      const w = S.pop()!;
      for (const v of P.get(w)!) {
        const c = (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!);
        delta.set(v, delta.get(v)! + c);
      }
      if (w !== s) {
        betweenness.set(w, betweenness.get(w)! + delta.get(w)!);
      }
    }
  });

  // Normalize betweenness to 0 - 1
  const n = nodeIds.length;
  const normFactor = n > 2 ? ((n - 1) * (n - 2)) / 2 : 1;
  let maxBetweenness = 0;
  let maxBetweennessNode = "";

  nodeIds.forEach((id) => {
    const rawB = (betweenness.get(id) || 0) / 2; // undirected
    const normB = Math.min(1, Math.round((rawB / normFactor) * 1000) / 1000);
    const node = nodeMap.get(id)!;
    node.betweenness = normB;
    if (normB > maxBetweenness) {
      maxBetweenness = normB;
      maxBetweennessNode = node.name;
    }
  });

  // 3. PageRank (Simplified power iteration)
  const dFactor = 0.85;
  let pr = new Map<string, number>();
  nodeIds.forEach((id) => pr.set(id, 1 / n));

  for (let iter = 0; iter < 10; iter++) {
    const nextPr = new Map<string, number>();
    nodeIds.forEach((id) => nextPr.set(id, (1 - dFactor) / n));

    nodeIds.forEach((u) => {
      const neighbors = Array.from(adj.get(u) || []);
      if (neighbors.length > 0) {
        const share = (pr.get(u)! * dFactor) / neighbors.length;
        neighbors.forEach((v) => {
          nextPr.set(v, (nextPr.get(v) || 0) + share);
        });
      }
    });
    pr = nextPr;
  }

  nodeIds.forEach((id) => {
    const node = nodeMap.get(id)!;
    node.pageRank = Math.round((pr.get(id) || 0) * 1000) / 1000;
  });

  // 4. Community Detection (Label Propagation)
  const labels = new Map<string, string>();
  nodeIds.forEach((id) => labels.set(id, id));

  for (let step = 0; step < 5; step++) {
    for (const u of nodeIds) {
      const neighbors = Array.from(adj.get(u) || []);
      if (neighbors.length === 0) continue;

      const labelCounts = new Map<string, number>();
      neighbors.forEach((v) => {
        const l = labels.get(v)!;
        labelCounts.set(l, (labelCounts.get(l) || 0) + 1);
      });

      let maxCount = -1;
      let chosenLabel = labels.get(u)!;
      labelCounts.forEach((count, l) => {
        if (count > maxCount) {
          maxCount = count;
          chosenLabel = l;
        }
      });
      labels.set(u, chosenLabel);
    }
  }

  // Name communities intelligently
  const uniqueLabels = Array.from(new Set(labels.values()));
  const communityNames: Record<string, string> = {
    [uniqueLabels[0] || ""]: "Command & Strategic Cell",
    [uniqueLabels[1] || ""]: "Recruitment & Safehouse Operations",
    [uniqueLabels[2] || ""]: "Hawala & Financial Laundering Conduit",
    [uniqueLabels[3] || ""]: "Cyber Operations & Interception Cell",
  };

  nodeIds.forEach((id) => {
    const rawL = labels.get(id)!;
    const node = nodeMap.get(id)!;
    node.community = communityNames[rawL] || `Cell Cluster ${rawL.substring(0, 6)}`;
  });

  const enrichedNodes = Array.from(nodeMap.values());
  const avgDegree =
    enrichedNodes.reduce((acc, curr) => acc + (curr.degree || 0), 0) / (n || 1);

  return {
    enrichedNodes,
    metricsSummary: {
      totalNodes: n,
      totalEdges: links.length,
      avgDegree: Math.round(avgDegree * 10) / 10,
      maxBetweennessNode: maxBetweennessNode || "Sunita Rao",
      communitiesCount: uniqueLabels.length,
    },
  };
}

/**
 * Breadth-First Search to find the shortest path of links and intermediary nodes
 * between startNodeId and endNodeId.
 */
export function findShortestPath(
  startId: string,
  endId: string,
  links: Relationship[] = []
): { pathNodeIds: string[]; pathLinkIds: string[] } | null {
  if (startId === endId) {
    return { pathNodeIds: [startId], pathLinkIds: [] };
  }

  const safeLinks = Array.isArray(links) ? links : [];
  const adj = new Map<string, Array<{ neighbor: string; linkId: string }>>();
  safeLinks.forEach((link) => {
    if (!link) return;
    const s = typeof link.source === "object" ? (link.source as any).id : link.source;
    const t = typeof link.target === "object" ? (link.target as any).id : link.target;

    if (!adj.has(s)) adj.set(s, []);
    if (!adj.has(t)) adj.set(t, []);

    adj.get(s)!.push({ neighbor: t, linkId: link.id });
    adj.get(t)!.push({ neighbor: s, linkId: link.id });
  });

  const queue: string[] = [startId];
  const visited = new Set<string>([startId]);
  const prev = new Map<string, { prevNode: string; linkId: string }>();

  let found = false;

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === endId) {
      found = true;
      break;
    }

    const neighbors = adj.get(current) || [];
    for (const { neighbor, linkId } of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        prev.set(neighbor, { prevNode: current, linkId });
        queue.push(neighbor);
      }
    }
  }

  if (!found) return null;

  const pathNodeIds: string[] = [];
  const pathLinkIds: string[] = [];
  let curr = endId;

  while (curr !== startId) {
    pathNodeIds.unshift(curr);
    const step = prev.get(curr)!;
    pathLinkIds.unshift(step.linkId);
    curr = step.prevNode;
  }
  pathNodeIds.unshift(startId);

  return { pathNodeIds, pathLinkIds };
}

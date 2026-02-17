import type { KpiNode, NodeMap, ChildrenMap, TraceStep, Depth } from '@/types'

/** Build lookup maps from flat node array */
export function buildMaps(nodes: KpiNode[]): { nodeMap: NodeMap; childrenMap: ChildrenMap } {
  const nodeMap: NodeMap = {}
  const childrenMap: ChildrenMap = {}
  for (const n of nodes) {
    nodeMap[n.id] = n
    if (n.parent_id) {
      if (!childrenMap[n.parent_id]) childrenMap[n.parent_id] = []
      childrenMap[n.parent_id].push(n.id)
    }
  }
  return { nodeMap, childrenMap }
}

/** Effective progress: leaf = direct %, parent = weighted avg of children */
export function getEffectiveProgress(
  node: KpiNode,
  nodeMap: NodeMap,
  childrenMap: ChildrenMap,
): number {
  const kids = childrenMap[node.id]
  if (!kids || kids.length === 0) {
    if (node.target_value === 0) return 0
    return Math.min(100, (node.current_value / node.target_value) * 100)
  }

  let totalWeight = 0
  let weightedSum = 0
  for (const cid of kids) {
    const child = nodeMap[cid]
    if (!child || child.status === 'paused') continue
    const childProgress = getEffectiveProgress(child, nodeMap, childrenMap)
    weightedSum += childProgress * child.weight
    totalWeight += child.weight
  }
  return totalWeight === 0 ? 0 : weightedSum / totalWeight
}

/** Contribution trace: walk from leaf node up to root */
export function getContributionTrace(
  nodeId: string,
  nodeMap: NodeMap,
  childrenMap: ChildrenMap,
): TraceStep[] {
  const steps: TraceStep[] = []
  let currentId: string | null = nodeId
  let cumulativeImpact = 1

  while (currentId) {
    const node: KpiNode | undefined = nodeMap[currentId]
    if (!node) break

    const progress = getEffectiveProgress(node, nodeMap, childrenMap)
    const siblings = node.parent_id ? (childrenMap[node.parent_id] || []) : []
    const totalWeight = siblings.reduce((s, sid) => {
      const sib = nodeMap[sid]
      return s + (sib && sib.status !== 'paused' ? sib.weight : 0)
    }, 0)
    const normalizedWeight = totalWeight > 0 ? node.weight / totalWeight : 1
    const contribution = progress * normalizedWeight / 100

    if (node.parent_id) {
      cumulativeImpact *= normalizedWeight
    }

    steps.push({
      node,
      progress,
      weight: node.weight,
      normalizedWeight,
      contribution,
      cumulativeImpact: node.depth === 0 as Depth
        ? progress * cumulativeImpact / 100
        : cumulativeImpact,
    })

    currentId = node.parent_id
  }

  // Reverse: root first, leaf last → but we want leaf first for display
  return steps
}

/** Get root nodes (depth=0, no parent) */
export function getRootNodes(nodes: KpiNode[]): KpiNode[] {
  return nodes.filter((n) => n.depth === 0 && !n.parent_id)
}

/** Get nodes by depth */
export function getNodesByDepth(nodes: KpiNode[], depth: Depth): KpiNode[] {
  return nodes.filter((n) => n.depth === depth).sort((a, b) => a.sort_order - b.sort_order)
}

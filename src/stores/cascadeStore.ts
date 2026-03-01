import { create } from 'zustand'
import { supabase, isDemoMode } from '@/lib/supabase'
import { buildMaps, getEffectiveProgress, getContributionTrace } from '@/lib/cascade'
import { SEED_NODES } from '@/data/seed'
import { useUIStore } from '@/stores/uiStore'
import type { KpiNode, Milestone, NodeMap, ChildrenMap, TraceStep, Depth } from '@/types'

interface CascadeState {
  nodes: KpiNode[]
  nodeMap: NodeMap
  childrenMap: ChildrenMap
  selectedNodeId: string | null
  expandedIds: Set<string>
  loading: boolean

  // Actions
  fetchNodes: (orgId: string) => Promise<void>
  addNode: (node: Partial<KpiNode> & { org_id: string; title: string; depth: Depth }) => Promise<void>
  updateNode: (id: string, updates: Partial<KpiNode>) => Promise<void>
  batchUpdateWeights: (updates: Record<string, number>) => Promise<void>
  deleteNode: (id: string) => Promise<void>
  updateProgress: (id: string, newValue: number, note?: string) => Promise<void>

  // Milestone actions
  toggleMilestone: (nodeId: string, milestoneId: string) => Promise<void>
  addMilestone: (nodeId: string, label: string) => Promise<void>
  removeMilestone: (nodeId: string, milestoneId: string) => Promise<void>

  // Derived
  selectNode: (id: string | null) => void
  toggleExpand: (id: string) => void
  getProgress: (id: string) => number
  getTrace: (id: string) => TraceStep[]
  getChildren: (id: string) => KpiNode[]
  getNodesByDepth: (depth: Depth) => KpiNode[]
}

function rebuildMaps(nodes: KpiNode[]) {
  return buildMaps(nodes)
}

export const useCascadeStore = create<CascadeState>((set, get) => ({
  nodes: [],
  nodeMap: {},
  childrenMap: {},
  selectedNodeId: null,
  expandedIds: new Set(),
  loading: false,

  fetchNodes: async (orgId) => {
    if (!orgId) { set({ loading: false }); return }
    set({ loading: true })
    if (isDemoMode) {
      const maps = rebuildMaps(SEED_NODES)
      set({ nodes: SEED_NODES, ...maps, loading: false })
      return
    }
    try {
      const { data, error } = await supabase
        .from('kpi_nodes')
        .select('*')
        .eq('org_id', orgId)
        .order('sort_order')
      if (error) throw error
      // Normalize corrupted weights (>1 stored as percentages)
      const nodes = ((data || []) as KpiNode[]).map((n) =>
        n.weight > 1 ? { ...n, weight: n.weight / 100 } : n,
      )
      const maps = rebuildMaps(nodes)
      set({ nodes, ...maps, loading: false })
    } catch (err) {
      set({ loading: false })
      console.error('[cascadeStore] fetchNodes failed:', err)
      useUIStore.getState().toast('KPI 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.', 'error')
    }
  },

  addNode: async (partial) => {
    const milestones = (partial as { milestones?: KpiNode['milestones'] }).milestones ?? null
    const newNode: KpiNode = {
      id: crypto.randomUUID(),
      org_id: partial.org_id,
      parent_id: partial.parent_id ?? null,
      depth: partial.depth,
      title: partial.title,
      description: partial.description ?? null,
      emoji: partial.emoji ?? '🎯',
      owner_id: partial.owner_id ?? null,
      target_value: partial.target_value ?? 100,
      current_value: partial.current_value ?? 0,
      unit: partial.unit ?? '%',
      weight: partial.weight ?? 1.0,
      milestones,
      status: partial.status ?? 'active',
      priority: partial.priority ?? 'medium',
      start_date: partial.start_date ?? null,
      due_date: partial.due_date ?? null,
      sort_order: partial.sort_order ?? get().nodes.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (!isDemoMode) {
      const { error } = await supabase.from('kpi_nodes').insert(newNode)
      if (error) {
        console.error('[cascadeStore] addNode failed:', error)
        useUIStore.getState().toast('항목 추가에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error')
        throw error
      }
    }

    const nodes = [...get().nodes, newNode]
    set({ nodes, ...rebuildMaps(nodes) })
  },

  updateNode: async (id, updates) => {
    if (!isDemoMode) {
      const { error } = await supabase.from('kpi_nodes').update(updates).eq('id', id)
      if (error) {
        console.error('[cascadeStore] updateNode failed:', error)
        useUIStore.getState().toast('항목 수정에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error')
        throw error
      }
    }
    const nodes = get().nodes.map((n) => n.id === id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n)
    set({ nodes, ...rebuildMaps(nodes) })
  },

  batchUpdateWeights: async (updates) => {
    const now = new Date().toISOString()
    if (!isDemoMode) {
      const results = await Promise.all(
        Object.entries(updates).map(([id, weight]) =>
          supabase.from('kpi_nodes').update({ weight }).eq('id', id),
        ),
      )
      const failed = results.filter((r) => r.error)
      if (failed.length > 0) {
        console.error('[cascadeStore] batchUpdateWeights partial failure:', failed.map((r) => r.error))
        useUIStore.getState().toast('일부 가중치 저장에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error')
      }
    }
    const nodes = get().nodes.map((n) =>
      updates[n.id] !== undefined ? { ...n, weight: updates[n.id], updated_at: now } : n,
    )
    set({ nodes, ...rebuildMaps(nodes) })
  },

  deleteNode: async (id) => {
    if (!isDemoMode) {
      const { error } = await supabase.from('kpi_nodes').delete().eq('id', id)
      if (error) {
        console.error('[cascadeStore] deleteNode failed:', error)
        useUIStore.getState().toast('항목 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error')
        throw error
      }
    }
    // Remove node and all descendants
    const toRemove = new Set<string>()
    const collect = (nid: string) => {
      toRemove.add(nid)
      const kids = get().childrenMap[nid] || []
      kids.forEach(collect)
    }
    collect(id)
    const nodes = get().nodes.filter((n) => !toRemove.has(n.id))
    // Clean up expandedIds for all removed nodes
    const expandedIds = new Set(
      [...get().expandedIds].filter((eid) => !toRemove.has(eid)),
    )
    set({ nodes, ...rebuildMaps(nodes), selectedNodeId: null, expandedIds })
  },

  updateProgress: async (id, newValue, note) => {
    const node = get().nodeMap[id]
    if (!node) return
    const prevValue = node.current_value

    if (!isDemoMode) {
      const { error: updateError } = await supabase.from('kpi_nodes').update({ current_value: newValue }).eq('id', id)
      if (updateError) {
        console.error('[cascadeStore] updateProgress failed:', updateError)
        useUIStore.getState().toast('진행률 업데이트에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error')
        throw updateError
      }
      const { error: logError } = await supabase.from('progress_logs').insert({
        node_id: id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        previous_value: prevValue,
        new_value: newValue,
        note: note || null,
      })
      if (logError) {
        // Log insertion failure is non-critical — warn but don't block
        console.warn('[cascadeStore] progress_logs insert failed:', logError)
      }
    }

    const nodes = get().nodes.map((n) =>
      n.id === id ? { ...n, current_value: newValue, updated_at: new Date().toISOString() } : n,
    )
    set({ nodes, ...rebuildMaps(nodes) })
  },

  toggleMilestone: async (nodeId, milestoneId) => {
    const node = get().nodeMap[nodeId]
    if (!node || !node.milestones) return
    const milestones = node.milestones.map((m) =>
      m.id === milestoneId ? { ...m, done: !m.done } : m,
    )
    const doneCount = milestones.filter((m) => m.done).length
    const updates = { milestones, current_value: doneCount, target_value: milestones.length }

    if (!isDemoMode) {
      const { error } = await supabase.from('kpi_nodes').update(updates).eq('id', nodeId)
      if (error) {
        console.error('[cascadeStore] toggleMilestone failed:', error)
        useUIStore.getState().toast('마일스톤 업데이트에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error')
        throw error
      }
    }
    const nodes = get().nodes.map((n) =>
      n.id === nodeId ? { ...n, ...updates, updated_at: new Date().toISOString() } : n,
    )
    set({ nodes, ...rebuildMaps(nodes) })
  },

  addMilestone: async (nodeId, label) => {
    const node = get().nodeMap[nodeId]
    if (!node) return
    const newMilestone: Milestone = { id: crypto.randomUUID(), label, done: false }
    const milestones = [...(node.milestones || []), newMilestone]
    const doneCount = milestones.filter((m) => m.done).length
    const updates = { milestones, current_value: doneCount, target_value: milestones.length }

    if (!isDemoMode) {
      const { error } = await supabase.from('kpi_nodes').update(updates).eq('id', nodeId)
      if (error) {
        console.error('[cascadeStore] addMilestone failed:', error)
        useUIStore.getState().toast('마일스톤 추가에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error')
        throw error
      }
    }
    const nodes = get().nodes.map((n) =>
      n.id === nodeId ? { ...n, ...updates, updated_at: new Date().toISOString() } : n,
    )
    set({ nodes, ...rebuildMaps(nodes) })
  },

  removeMilestone: async (nodeId, milestoneId) => {
    const node = get().nodeMap[nodeId]
    if (!node || !node.milestones) return
    const milestones = node.milestones.filter((m) => m.id !== milestoneId)
    const doneCount = milestones.filter((m) => m.done).length
    const updates = {
      milestones: milestones.length > 0 ? milestones : null,
      current_value: doneCount,
      target_value: milestones.length || node.target_value,
    }

    if (!isDemoMode) {
      const { error } = await supabase.from('kpi_nodes').update(updates).eq('id', nodeId)
      if (error) {
        console.error('[cascadeStore] removeMilestone failed:', error)
        useUIStore.getState().toast('마일스톤 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error')
        throw error
      }
    }
    const nodes = get().nodes.map((n) =>
      n.id === nodeId ? { ...n, ...updates, updated_at: new Date().toISOString() } : n,
    )
    set({ nodes, ...rebuildMaps(nodes) })
  },

  selectNode: (id) => set({ selectedNodeId: id }),
  toggleExpand: (id) => {
    const expanded = new Set(get().expandedIds)
    if (expanded.has(id)) expanded.delete(id)
    else expanded.add(id)
    set({ expandedIds: expanded })
  },

  getProgress: (id) => {
    const { nodeMap, childrenMap } = get()
    const node = nodeMap[id]
    return node ? getEffectiveProgress(node, nodeMap, childrenMap) : 0
  },

  getTrace: (id) => {
    const { nodeMap, childrenMap } = get()
    return getContributionTrace(id, nodeMap, childrenMap)
  },

  getChildren: (id) => {
    const { childrenMap, nodeMap } = get()
    return (childrenMap[id] || []).map((cid) => nodeMap[cid]).filter(Boolean)
  },

  getNodesByDepth: (depth) => {
    return get().nodes.filter((n) => n.depth === depth).sort((a, b) => a.sort_order - b.sort_order)
  },
}))

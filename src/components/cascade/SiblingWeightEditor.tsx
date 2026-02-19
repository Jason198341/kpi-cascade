import { useMemo, useState, useEffect } from 'react'
import { useCascadeStore } from '@/stores/cascadeStore'
import { useUIStore } from '@/stores/uiStore'
import { Button } from '@/components/common/Button'
import type { KpiNode } from '@/types'

interface Props {
  nodeId: string | null       // null when creating a new node
  parentId: string | null
  depth: number
  currentWeight: number
  onWeightChange: (weight: number) => void
  siblingOverrides: Record<string, number>
  onSiblingOverridesChange: (overrides: Record<string, number>) => void
}

export function SiblingWeightEditor({
  nodeId, parentId, depth, currentWeight,
  onWeightChange, siblingOverrides, onSiblingOverridesChange,
}: Props) {
  const getChildren = useCascadeStore((s) => s.getChildren)
  const getNodesByDepth = useCascadeStore((s) => s.getNodesByDepth)
  const t = useUIStore((s) => s.t)

  // Get sibling nodes (excluding the current node being edited)
  const siblings = useMemo((): KpiNode[] => {
    const all = depth === 0
      ? getNodesByDepth(0)
      : parentId ? getChildren(parentId) : []
    return all.filter((n) => n.id !== nodeId)
  }, [depth, parentId, nodeId, getChildren, getNodesByDepth])

  // If no siblings and creating a new node, or sole node
  const isOnlyNode = siblings.length === 0 && nodeId !== null
  const isNewWithNoSiblings = siblings.length === 0 && nodeId === null

  // Compute effective weight for each sibling (override or original)
  const siblingWeights = useMemo(() =>
    siblings.map((s) => ({
      node: s,
      weight: siblingOverrides[s.id] ?? s.weight,
    })),
    [siblings, siblingOverrides],
  )

  const sum = currentWeight + siblingWeights.reduce((acc, s) => acc + s.weight, 0)
  const isBalanced = Math.abs(sum - 1.0) < 0.005

  // Auto-balance: keep current node's weight fixed, distribute rest equally
  const handleAutoBalance = () => {
    if (siblings.length === 0) return
    const remaining = Math.max(0, 1.0 - currentWeight)
    const each = remaining / siblings.length
    const overrides: Record<string, number> = {}
    siblings.forEach((s, i) => {
      if (i < siblings.length - 1) {
        overrides[s.id] = +each.toFixed(2)
      } else {
        // Last sibling absorbs rounding error
        const allocated = +each.toFixed(2) * (siblings.length - 1)
        overrides[s.id] = +(remaining - allocated).toFixed(2)
      }
    })
    onSiblingOverridesChange(overrides)
  }

  // Local text state for the weight input — allows intermediate typing like "0." or ""
  const [weightText, setWeightText] = useState(currentWeight.toFixed(2))
  useEffect(() => { setWeightText(currentWeight.toFixed(2)) }, [currentWeight])

  const commitWeight = (text: string) => {
    const v = parseFloat(text)
    if (!isNaN(v) && v >= 0.01 && v <= 0.99) {
      onWeightChange(+v.toFixed(2))
    }
    setWeightText(currentWeight.toFixed(2))
  }

  if (isOnlyNode || isNewWithNoSiblings) {
    return (
      <div className="text-xs text-text-muted bg-surface-light rounded-lg p-3">
        {t('node.weight')}: <span className="font-mono font-semibold">1.00</span>
        <span className="ml-2">({t('node.onlyItem')})</span>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-surface-border bg-surface-light/50 p-3">
      <div className="text-xs text-text-muted font-medium mb-2">{t('node.weightBalance')}</div>

      {/* Current node weight slider */}
      <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-primary/5 border border-primary/20">
        <span className="text-sm font-semibold flex-1 truncate">{t('node.currentItem')}</span>
        <input
          type="range"
          min={0.01}
          max={0.99}
          step={0.01}
          value={currentWeight}
          onChange={(e) => onWeightChange(+e.target.value)}
          className="w-24 accent-primary"
        />
        <input
          type="text"
          inputMode="decimal"
          value={weightText}
          onChange={(e) => setWeightText(e.target.value)}
          onBlur={(e) => commitWeight(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commitWeight(weightText) }}
          className="w-16 text-center text-sm font-mono bg-bg border border-surface-border rounded px-1 py-0.5"
        />
      </div>

      {/* Sibling weights (read-only display) */}
      {siblingWeights.map(({ node, weight }) => (
        <div key={node.id} className="flex items-center gap-3 px-2 py-1.5 text-sm">
          <span className="text-base">{node.emoji}</span>
          <span className="flex-1 truncate text-text-muted">{node.title}</span>
          <span className="font-mono text-xs w-12 text-right">{weight.toFixed(2)}</span>
        </div>
      ))}

      {/* Sum indicator */}
      <div className={`flex items-center justify-between mt-3 pt-2 border-t border-surface-border text-sm ${isBalanced ? 'text-depth-2' : 'text-danger'}`}>
        <span className="font-mono font-semibold">
          {isBalanced ? '\u2713' : '\u26A0'} {'\u03A3'} = {sum.toFixed(2)}
        </span>
        {!isBalanced && (
          <span className="text-xs text-danger">
            {t('node.weightError')}
          </span>
        )}
      </div>

      {/* Auto-balance button */}
      {siblings.length > 0 && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleAutoBalance}
          className="w-full mt-2"
        >
          {t('node.autoBalance')}
        </Button>
      )}
    </div>
  )
}

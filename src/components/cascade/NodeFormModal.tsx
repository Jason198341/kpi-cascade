import { useState, useEffect, useMemo } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { Input, Textarea } from '@/components/common/Input'
import { SiblingWeightEditor } from './SiblingWeightEditor'
import { useCascadeStore } from '@/stores/cascadeStore'
import { useAuthStore } from '@/stores/authStore'
import { useOrgStore } from '@/stores/orgStore'
import { useUIStore } from '@/stores/uiStore'
import type { KpiNode, Depth, Milestone } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  editNode?: KpiNode | null
  parentId?: string | null
  depth?: Depth
}

const EMOJIS = ['🎯', '📈', '💰', '🚀', '⭐', '🔬', '📊', '🤝', '⚡', '🔧', '📝', '🎨', '💎', '⚙️', '🧪', '🗣️']

export function NodeFormModal({ open, onClose, editNode, parentId, depth = 0 }: Props) {
  const addNode = useCascadeStore((s) => s.addNode)
  const updateNode = useCascadeStore((s) => s.updateNode)
  const batchUpdateWeights = useCascadeStore((s) => s.batchUpdateWeights)
  const getChildren = useCascadeStore((s) => s.getChildren)
  const getNodesByDepth = useCascadeStore((s) => s.getNodesByDepth)
  const profile = useAuthStore((s) => s.profile)
  const members = useOrgStore((s) => s.members)
  const toast = useUIStore((s) => s.toast)
  const t = useUIStore((s) => s.t)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('🎯')
  const [targetValue, setTargetValue] = useState(100)
  const [unit, setUnit] = useState('%')
  const [weight, setWeight] = useState(1.0)
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [ownerId, setOwnerId] = useState<string | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [newMilestone, setNewMilestone] = useState('')
  const [siblingOverrides, setSiblingOverrides] = useState<Record<string, number>>({})

  const isActionPlan = depth === 2
  const effectiveParentId = editNode ? editNode.parent_id : (parentId ?? null)

  // Compute siblings for weight sum validation
  const siblings = useMemo((): KpiNode[] => {
    const all = depth === 0
      ? getNodesByDepth(0)
      : effectiveParentId ? getChildren(effectiveParentId) : []
    return all.filter((n) => n.id !== (editNode?.id ?? null))
  }, [depth, effectiveParentId, editNode?.id, getChildren, getNodesByDepth])

  const siblingWeightSum = siblings.reduce(
    (acc, s) => acc + (siblingOverrides[s.id] ?? s.weight), 0,
  )
  const totalWeightSum = weight + siblingWeightSum
  const isWeightBalanced = siblings.length === 0 || Math.abs(totalWeightSum - 1.0) < 0.005

  // Selected owner's department
  const selectedOwner = ownerId ? members.find((m) => m.id === ownerId) : null

  useEffect(() => {
    if (editNode) {
      setTitle(editNode.title)
      setDescription(editNode.description || '')
      setEmoji(editNode.emoji)
      setTargetValue(editNode.target_value)
      setUnit(editNode.unit)
      setWeight(editNode.weight)
      setStartDate(editNode.start_date || '')
      setDueDate(editNode.due_date || '')
      setOwnerId(editNode.owner_id)
      setMilestones(editNode.milestones || [])
    } else {
      setTitle('')
      setDescription('')
      setEmoji('🎯')
      setTargetValue(100)
      setUnit('%')
      setWeight(1.0)
      setStartDate('')
      setDueDate('')
      setOwnerId(profile?.id || null)
      setMilestones([])
    }
    setNewMilestone('')
    setSiblingOverrides({})
  }, [editNode, open, profile?.id])

  const handleAddMilestone = () => {
    const label = newMilestone.trim()
    if (!label) return
    setMilestones((prev) => [...prev, { id: crypto.randomUUID(), label, done: false }])
    setNewMilestone('')
  }

  const handleRemoveMilestone = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id))
  }

  const handleMilestoneDate = (id: string, field: 'start_date' | 'end_date', value: string) => {
    setMilestones((prev) => prev.map((m) => m.id === id ? { ...m, [field]: value || null } : m))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.org_id) {
      toast(t('form.orgNotSet'), 'error')
      return
    }
    try {
      const milestonesData = isActionPlan && milestones.length > 0 ? milestones : null
      const effectiveTarget = milestonesData ? milestones.length : targetValue
      const effectiveCurrent = milestonesData ? milestones.filter((m) => m.done).length : 0

      // Batch update sibling weights if any changed
      if (Object.keys(siblingOverrides).length > 0) {
        await batchUpdateWeights(siblingOverrides)
      }

      if (editNode) {
        await updateNode(editNode.id, {
          title,
          description: description || null,
          emoji,
          target_value: effectiveTarget,
          unit: milestonesData ? '건' : unit,
          weight,
          start_date: startDate || null,
          due_date: dueDate || null,
          owner_id: ownerId,
          milestones: milestonesData,
        })
      } else {
        await addNode({
          org_id: profile.org_id,
          parent_id: parentId || null,
          depth,
          title,
          description: description || null,
          emoji,
          target_value: effectiveTarget,
          current_value: effectiveCurrent,
          unit: milestonesData ? '건' : unit,
          weight,
          start_date: startDate || null,
          due_date: dueDate || null,
          owner_id: ownerId,
          milestones: milestonesData,
        } as Parameters<typeof addNode>[0])
      }
      toast(editNode ? t('form.updated') : t('form.created'), 'success')
      onClose()
    } catch (err) {
      toast(`${err}`, 'error')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editNode ? t('node.edit') : t('node.create')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Emoji picker */}
        <div>
          <label className="text-sm text-text-muted mb-1.5 block">{t('node.icon')}</label>
          <div className="flex flex-wrap gap-1">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center cursor-pointer transition-colors
                  ${emoji === e ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-surface-light'}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <Input label={t('node.title')} value={title} onChange={(e) => setTitle(e.target.value)} required />
        <Textarea label={t('node.description')} value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />

        {/* Target/Unit for non-action-plans */}
        {!isActionPlan && (
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('node.target')} type="number" value={targetValue} onChange={(e) => setTargetValue(+e.target.value)} min={0} />
            <Input label={t('node.unit')} value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
        )}

        {/* Action plan milestone info */}
        {isActionPlan && (
          <div className="text-xs text-text-muted bg-surface-light rounded-lg p-2">
            {t('milestone.autoCalcHint')}
          </div>
        )}

        {/* Weight balancing — shown for ALL depths */}
        <SiblingWeightEditor
          nodeId={editNode?.id ?? null}
          parentId={effectiveParentId}
          depth={depth}
          currentWeight={weight}
          onWeightChange={setWeight}
          siblingOverrides={siblingOverrides}
          onSiblingOverridesChange={setSiblingOverrides}
        />

        {/* Owner selector for action plans */}
        {isActionPlan && members.length > 0 && (
          <div>
            <label className="text-sm text-text-muted mb-1.5 block">{t('people.owner')}</label>
            <select
              value={ownerId || ''}
              onChange={(e) => setOwnerId(e.target.value || null)}
              className="w-full rounded-lg border border-surface-border bg-bg px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
            >
              <option value="">{t('node.unassigned')}</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name}{m.department ? ` · ${m.department}` : ''}
                </option>
              ))}
            </select>
            {selectedOwner?.department && (
              <div className="text-xs text-text-muted mt-1.5 px-1">
                {t('node.department')}: <span className="font-semibold text-text">{selectedOwner.department}</span>
              </div>
            )}
          </div>
        )}

        {/* Milestone editor for action plans */}
        {isActionPlan && (
          <div>
            <label className="text-sm text-text-muted mb-1.5 block">{t('milestone.add')}</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddMilestone() } }}
                placeholder={t('milestone.placeholder')}
                className="flex-1 rounded-lg border border-surface-border bg-bg px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-depth-2/30 focus-visible:border-depth-2"
              />
              <Button type="button" size="sm" onClick={handleAddMilestone}>+</Button>
            </div>
            {milestones.length > 0 && (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {milestones.map((m, i) => (
                  <div key={m.id} className="bg-surface-light rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-text-muted text-xs">{i + 1}</span>
                      <span className="flex-1 truncate">{m.label}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(m.id)}
                        className="text-text-muted hover:text-danger cursor-pointer text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex gap-2 mt-1.5">
                      <input
                        type="date"
                        value={m.start_date || ''}
                        onChange={(e) => handleMilestoneDate(m.id, 'start_date', e.target.value)}
                        className="flex-1 rounded border border-surface-border bg-bg px-2 py-1 text-xs focus-visible:ring-1 focus-visible:ring-depth-2/30"
                        title={t('node.startDate')}
                      />
                      <span className="text-text-muted text-xs self-center">~</span>
                      <input
                        type="date"
                        value={m.end_date || ''}
                        onChange={(e) => handleMilestoneDate(m.id, 'end_date', e.target.value)}
                        className="flex-1 rounded border border-surface-border bg-bg px-2 py-1 text-xs focus-visible:ring-1 focus-visible:ring-depth-2/30"
                        title={t('node.dueDate')}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Start / Due dates */}
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('node.startDate')} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label={t('node.dueDate')} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>

        {/* Weight imbalance warning (non-blocking) */}
        {!isWeightBalanced && (
          <div className="text-xs text-warning bg-warning/10 rounded-lg px-3 py-2">
            {t('node.weightError')} ({totalWeightSum.toFixed(2)})
          </div>
        )}

        <div className="flex justify-end gap-3 mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit">
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

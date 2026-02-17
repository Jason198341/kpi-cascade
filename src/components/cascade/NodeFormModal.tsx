import { useState, useEffect } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { Input, Textarea } from '@/components/common/Input'
import { useCascadeStore } from '@/stores/cascadeStore'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import type { KpiNode, Depth } from '@/types'

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
  const profile = useAuthStore((s) => s.profile)
  const toast = useUIStore((s) => s.toast)
  const t = useUIStore((s) => s.t)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('🎯')
  const [targetValue, setTargetValue] = useState(100)
  const [unit, setUnit] = useState('%')
  const [weight, setWeight] = useState(1.0)
  const [dueDate, setDueDate] = useState('')

  useEffect(() => {
    if (editNode) {
      setTitle(editNode.title)
      setDescription(editNode.description || '')
      setEmoji(editNode.emoji)
      setTargetValue(editNode.target_value)
      setUnit(editNode.unit)
      setWeight(editNode.weight)
      setDueDate(editNode.due_date || '')
    } else {
      setTitle('')
      setDescription('')
      setEmoji('🎯')
      setTargetValue(100)
      setUnit('%')
      setWeight(1.0)
      setDueDate('')
    }
  }, [editNode, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.org_id) {
      toast('조직이 설정되지 않았습니다. 잠시 후 다시 시도해주세요.', 'error')
      return
    }
    try {
      if (editNode) {
        await updateNode(editNode.id, { title, description: description || null, emoji, target_value: targetValue, unit, weight, due_date: dueDate || null })
      } else {
        await addNode({
          org_id: profile.org_id,
          parent_id: parentId || null,
          depth,
          title,
          description: description || null,
          emoji,
          target_value: targetValue,
          unit,
          weight,
          due_date: dueDate || null,
          owner_id: profile?.id || null,
        })
      }
      toast(editNode ? '수정되었습니다' : '생성되었습니다', 'success')
      onClose()
    } catch (err) {
      toast(`오류: ${err}`, 'error')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editNode ? t('node.edit') : t('node.create')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Emoji picker */}
        <div>
          <label className="text-sm text-text-muted mb-1.5 block">아이콘</label>
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

        <div className="grid grid-cols-3 gap-3">
          <Input label={t('node.target')} type="number" value={targetValue} onChange={(e) => setTargetValue(+e.target.value)} min={0} />
          <Input label="단위" value={unit} onChange={(e) => setUnit(e.target.value)} />
          <Input label={t('node.weight')} type="number" value={weight} onChange={(e) => setWeight(+e.target.value)} min={0} max={10} step={0.1} />
        </div>

        <Input label={t('node.dueDate')} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />

        <div className="flex justify-end gap-3 mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit">{t('common.save')}</Button>
        </div>
      </form>
    </Modal>
  )
}

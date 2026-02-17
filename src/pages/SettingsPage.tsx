import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { useAuthStore } from '@/stores/authStore'
import { useOrgStore } from '@/stores/orgStore'
import { useUIStore } from '@/stores/uiStore'
import type { Profile } from '@/types'

const ROLES: Profile['role'][] = ['executive', 'manager', 'member']
const ROLE_LABELS: Record<string, string> = { executive: '임원', manager: '팀장', member: '팀원' }

export default function SettingsPage() {
  const profile = useAuthStore((s) => s.profile)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const org = useOrgStore((s) => s.org)
  const members = useOrgStore((s) => s.members)
  const addMember = useOrgStore((s) => s.addMember)
  const updateMember = useOrgStore((s) => s.updateMember)
  const removeMember = useOrgStore((s) => s.removeMember)
  const t = useUIStore((s) => s.t)
  const lang = useUIStore((s) => s.lang)
  const setLang = useUIStore((s) => s.setLang)
  const toast = useUIStore((s) => s.toast)

  const [displayName, setDisplayName] = useState(profile?.display_name || '')

  // Add member form
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<Profile['role']>('member')
  const [newDept, setNewDept] = useState('')
  const [newHireYear, setNewHireYear] = useState('')

  // Edit department inline
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDept, setEditDept] = useState('')

  const handleSave = async () => {
    await updateProfile({ display_name: displayName })
    toast('프로필이 업데이트되었습니다', 'success')
  }

  const handleAddMember = async () => {
    if (!newName.trim()) { toast('이름을 입력하세요', 'error'); return }
    try {
      await addMember({
        email: newEmail.trim() || `${newName.trim().toLowerCase().replace(/\s+/g, '')}@team.local`,
        display_name: newName.trim(),
        avatar_url: null,
        role: newRole,
        org_id: org?.id || null,
        department: newDept.trim() || null,
        hire_year: newHireYear ? parseInt(newHireYear, 10) : null,
      })
      toast(`${newName.trim()} 추가됨`, 'success')
      setNewName(''); setNewEmail(''); setNewDept(''); setNewRole('member'); setNewHireYear('')
      setShowAddForm(false)
    } catch (err) {
      toast(`오류: ${err}`, 'error')
    }
  }

  const handleUpdateDept = async (id: string) => {
    await updateMember(id, { department: editDept.trim() || null })
    toast('파트가 업데이트되었습니다', 'success')
    setEditingId(null)
  }

  const handleRemove = async (m: Profile) => {
    if (m.id === profile?.id) { toast('본인은 제거할 수 없습니다', 'error'); return }
    if (!confirm(`${m.display_name}을(를) 조직에서 제거하시겠습니까?`)) return
    await removeMember(m.id)
    toast('제거되었습니다', 'info')
  }

  return (
    <>
      <Header title={t('nav.settings')} />
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-lg mx-auto space-y-6 sm:space-y-8">
          {/* Profile */}
          <section className="glass rounded-xl p-4 sm:p-6">
            <h3 className="text-sm font-medium text-text-muted mb-4">프로필</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-primary/20 text-primary flex items-center justify-center text-2xl font-bold">
                {(profile?.display_name || '?')[0]}
              </div>
              <div>
                <div className="font-semibold">{profile?.display_name}</div>
                <div className="text-sm text-text-muted">{profile?.email}</div>
                <div className="text-xs text-primary capitalize">{profile?.role}</div>
              </div>
            </div>
            <Input
              label="표시 이름"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <Button size="sm" className="mt-3" onClick={handleSave}>{t('common.save')}</Button>
          </section>

          {/* Organization */}
          <section className="glass rounded-xl p-4 sm:p-6">
            <h3 className="text-sm font-medium text-text-muted mb-4">조직</h3>
            {org ? (
              <div className="text-lg font-semibold">{org.name}</div>
            ) : (
              <p className="text-sm text-text-muted">조직에 속해있지 않습니다</p>
            )}
          </section>

          {/* Team Members */}
          {org && (
            <section className="glass rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-text-muted">
                  팀원 관리 <span className="text-text">({members.length}명)</span>
                </h3>
                <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
                  {showAddForm ? '취소' : '+ 팀원 추가'}
                </Button>
              </div>

              {/* Add member form */}
              {showAddForm && (
                <div className="mb-4 p-4 rounded-lg bg-surface-light border border-surface-border space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input label="이름 *" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="홍길동" />
                    <Input label="이메일" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="hong@company.com" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm text-text-muted mb-1.5 block">역할</label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as Profile['role'])}
                        className="w-full rounded-lg border border-surface-border bg-bg px-3 py-2 text-sm"
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                    </div>
                    <Input label="파트/부서" value={newDept} onChange={(e) => setNewDept(e.target.value)} placeholder="영업팀" />
                    <Input label="입사년도" value={newHireYear} onChange={(e) => setNewHireYear(e.target.value)} placeholder="2020" />
                  </div>
                  <Button size="sm" onClick={handleAddMember} className="w-full">추가</Button>
                </div>
              )}

              {/* Members list */}
              <div className="flex flex-col gap-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-light">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                      {m.display_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">{m.display_name}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">{ROLE_LABELS[m.role] || m.role}</span>
                        {m.id === profile?.id && <span className="text-xs text-text-muted">(나)</span>}
                      </div>
                      {/* Department - editable */}
                      {editingId === m.id ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            value={editDept}
                            onChange={(e) => setEditDept(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateDept(m.id) }}
                            placeholder="파트 입력..."
                            className="flex-1 rounded border border-surface-border bg-bg px-2 py-1 text-xs"
                            autoFocus
                          />
                          <button onClick={() => handleUpdateDept(m.id)} className="text-xs text-primary cursor-pointer">저장</button>
                          <button onClick={() => setEditingId(null)} className="text-xs text-text-muted cursor-pointer">취소</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs text-text-muted">
                            {m.department || '파트 미지정'}
                          </span>
                          {m.hire_year && (
                            <span className="text-xs text-text-muted">
                              · {new Date().getFullYear() - m.hire_year}년차
                            </span>
                          )}
                          <button
                            onClick={() => { setEditingId(m.id); setEditDept(m.department || '') }}
                            className="text-xs text-primary/60 hover:text-primary cursor-pointer"
                          >
                            편집
                          </button>
                        </div>
                      )}
                    </div>
                    {m.id !== profile?.id && (
                      <button
                        onClick={() => handleRemove(m)}
                        className="text-xs text-text-muted hover:text-danger cursor-pointer shrink-0"
                      >
                        제거
                      </button>
                    )}
                  </div>
                ))}
                {members.length === 0 && (
                  <p className="text-sm text-text-muted text-center py-4">팀원이 없습니다. 위에서 추가하세요.</p>
                )}
              </div>
            </section>
          )}

          {/* Language */}
          <section className="glass rounded-xl p-4 sm:p-6">
            <h3 className="text-sm font-medium text-text-muted mb-4">언어</h3>
            <div className="flex gap-2">
              {(['ko', 'en'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors
                    ${lang === l ? 'bg-primary/15 text-primary font-medium' : 'bg-surface-light text-text-muted'}`}
                >
                  {l === 'ko' ? '한국어' : 'English'}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

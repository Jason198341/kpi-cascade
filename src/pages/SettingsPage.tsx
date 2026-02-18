import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { useAuthStore } from '@/stores/authStore'
import { useOrgStore } from '@/stores/orgStore'
import { useUIStore } from '@/stores/uiStore'
import type { Profile } from '@/types'

const ROLES: Profile['role'][] = ['executive', 'manager', 'member']

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
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)
  const toast = useUIStore((s) => s.toast)

  const ROLE_LABELS: Record<string, string> = {
    executive: t('settings.roleExecutive'),
    manager: t('settings.roleManager'),
    member: t('settings.roleMember'),
  }

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
    toast(t('settings.profileUpdated'), 'success')
  }

  const handleAddMember = async () => {
    if (!newName.trim()) { toast(t('settings.nameError'), 'error'); return }
    try {
      await addMember({
        email: newEmail.trim() || `${newName.trim().toLowerCase().replace(/\s+/g, '')}@team.local`,
        display_name: newName.trim(),
        avatar_url: null,
        role: newRole,
        org_id: org?.id || null,
        department: newDept.trim() || null,
        hire_year: newHireYear ? parseInt(newHireYear, 10) : null,
        position_title: null,
        onboarding_completed: true,
      })
      toast(t('settings.memberAdded').replace('{name}', newName.trim()), 'success')
      setNewName(''); setNewEmail(''); setNewDept(''); setNewRole('member'); setNewHireYear('')
      setShowAddForm(false)
    } catch (err) {
      toast(`${err}`, 'error')
    }
  }

  const handleUpdateDept = async (id: string) => {
    await updateMember(id, { department: editDept.trim() || null })
    toast(t('settings.deptUpdated'), 'success')
    setEditingId(null)
  }

  const handleRemove = async (m: Profile) => {
    if (m.id === profile?.id) { toast(t('settings.removeSelf'), 'error'); return }
    if (!confirm(t('settings.confirmRemove').replace('{name}', m.display_name))) return
    await removeMember(m.id)
    toast(t('settings.removed'), 'info')
  }

  return (
    <>
      <Header title={t('nav.settings')} />
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-lg mx-auto space-y-6 sm:space-y-8">
          {/* Profile */}
          <section className="glass rounded-xl p-4 sm:p-6">
            <h3 className="text-sm font-medium text-text-muted mb-4">{t('settings.profile')}</h3>
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
              label={t('settings.displayName')}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <Button size="sm" className="mt-3" onClick={handleSave}>{t('common.save')}</Button>
          </section>

          {/* Organization */}
          <section className="glass rounded-xl p-4 sm:p-6">
            <h3 className="text-sm font-medium text-text-muted mb-4">{t('settings.organization')}</h3>
            {org ? (
              <div className="text-lg font-semibold">{org.name}</div>
            ) : (
              <p className="text-sm text-text-muted">{t('settings.noOrg')}</p>
            )}
          </section>

          {/* Team Members */}
          {org && (
            <section className="glass rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-text-muted">
                  {t('settings.teamManagement')} <span className="text-text">({members.length})</span>
                </h3>
                <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
                  {showAddForm ? t('common.cancel') : t('settings.addMember')}
                </Button>
              </div>

              {/* Add member form */}
              {showAddForm && (
                <div className="mb-4 p-4 rounded-lg bg-surface-light border border-surface-border space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input label={t('settings.nameRequired')} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={lang === 'ko' ? '홍길동' : 'John Doe'} />
                    <Input label={t('auth.email')} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="hong@company.com" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm text-text-muted mb-1.5 block">{t('settings.role')}</label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as Profile['role'])}
                        className="w-full rounded-lg border border-surface-border bg-bg px-3 py-2 text-sm"
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                    </div>
                    <Input label={t('settings.deptTeam')} value={newDept} onChange={(e) => setNewDept(e.target.value)} placeholder={lang === 'ko' ? '영업팀' : 'Sales'} />
                    <Input label={t('settings.hireYear')} value={newHireYear} onChange={(e) => setNewHireYear(e.target.value)} placeholder="2020" />
                  </div>
                  <Button size="sm" onClick={handleAddMember} className="w-full">{t('common.add')}</Button>
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
                        {m.id === profile?.id && <span className="text-xs text-text-muted">({t('settings.me')})</span>}
                      </div>
                      {/* Department - editable */}
                      {editingId === m.id ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            value={editDept}
                            onChange={(e) => setEditDept(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateDept(m.id) }}
                            placeholder={t('settings.deptPlaceholder')}
                            className="flex-1 rounded border border-surface-border bg-bg px-2 py-1 text-xs"
                            autoFocus
                          />
                          <button onClick={() => handleUpdateDept(m.id)} className="text-xs text-primary cursor-pointer">{t('common.save')}</button>
                          <button onClick={() => setEditingId(null)} className="text-xs text-text-muted cursor-pointer">{t('common.cancel')}</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs text-text-muted">
                            {m.department || t('settings.deptNotSet')}
                          </span>
                          {m.hire_year && (
                            <span className="text-xs text-text-muted">
                              · {new Date().getFullYear() - m.hire_year}{t('people.yearExp')}
                            </span>
                          )}
                          <button
                            onClick={() => { setEditingId(m.id); setEditDept(m.department || '') }}
                            className="text-xs text-primary/60 hover:text-primary cursor-pointer"
                          >
                            {t('common.edit')}
                          </button>
                        </div>
                      )}
                    </div>
                    {m.id !== profile?.id && (
                      <button
                        onClick={() => handleRemove(m)}
                        className="text-xs text-text-muted hover:text-danger cursor-pointer shrink-0"
                      >
                        {t('common.remove')}
                      </button>
                    )}
                  </div>
                ))}
                {members.length === 0 && (
                  <p className="text-sm text-text-muted text-center py-4">{t('settings.noMembers')}</p>
                )}
              </div>
            </section>
          )}

          {/* Theme */}
          <section className="glass rounded-xl p-4 sm:p-6">
            <h3 className="text-sm font-medium text-text-muted mb-4">{t('settings.theme')}</h3>
            <div className="flex gap-2">
              {(['dark', 'light'] as const).map((th) => (
                <button
                  key={th}
                  onClick={() => setTheme(th)}
                  className={`px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors
                    ${theme === th ? 'bg-primary/15 text-primary font-medium' : 'bg-surface-light text-text-muted'}`}
                >
                  {th === 'dark' ? `🌙 ${t('settings.themeDark')}` : `☀️ ${t('settings.themeLight')}`}
                </button>
              ))}
            </div>
          </section>

          {/* Language */}
          <section className="glass rounded-xl p-4 sm:p-6">
            <h3 className="text-sm font-medium text-text-muted mb-4">{t('settings.language')}</h3>
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

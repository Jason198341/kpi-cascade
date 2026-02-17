import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { useAuthStore } from '@/stores/authStore'
import { useOrgStore } from '@/stores/orgStore'
import { useUIStore } from '@/stores/uiStore'

export default function SettingsPage() {
  const profile = useAuthStore((s) => s.profile)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const org = useOrgStore((s) => s.org)
  const t = useUIStore((s) => s.t)
  const lang = useUIStore((s) => s.lang)
  const setLang = useUIStore((s) => s.setLang)
  const toast = useUIStore((s) => s.toast)

  const [displayName, setDisplayName] = useState(profile?.display_name || '')

  const handleSave = async () => {
    await updateProfile({ display_name: displayName })
    toast('프로필이 업데이트되었습니다', 'success')
  }

  return (
    <>
      <Header title={t('nav.settings')} />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-lg mx-auto space-y-8">
          {/* Profile */}
          <section className="glass rounded-xl p-6">
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
          <section className="glass rounded-xl p-6">
            <h3 className="text-sm font-medium text-text-muted mb-4">조직</h3>
            {org ? (
              <div>
                <div className="text-lg font-semibold">{org.name}</div>
                <div className="text-sm text-text-muted">slug: {org.slug}</div>
              </div>
            ) : (
              <p className="text-sm text-text-muted">조직에 속해있지 않습니다</p>
            )}
          </section>

          {/* Language */}
          <section className="glass rounded-xl p-6">
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

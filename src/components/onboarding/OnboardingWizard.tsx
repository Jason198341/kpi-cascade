import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useOrgStore } from '@/stores/orgStore'
import { useUIStore } from '@/stores/uiStore'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'

export function OnboardingWizard() {
  const profile = useAuthStore((s) => s.profile)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const org = useOrgStore((s) => s.org)
  const updateOrg = useOrgStore((s) => s.updateOrg)
  const toast = useUIStore((s) => s.toast)
  const t = useUIStore((s) => s.t)
  const lang = useUIStore((s) => s.lang)

  const STEPS = [
    { title: t('onboarding.welcome'), subtitle: t('onboarding.welcomeSubtitle') },
    { title: t('onboarding.orgStructure'), subtitle: t('onboarding.orgStructureSubtitle') },
    { title: t('onboarding.reportFeedback'), subtitle: t('onboarding.reportFeedbackSubtitle') },
  ]

  const POSITION_PRESETS = t('onboarding.positions').split(',')

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Step 1: Basic info
  const [companyName, setCompanyName] = useState(org?.name || '')
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [positionTitle, setPositionTitle] = useState(profile?.position_title || '')

  // Step 2: Org structure
  const [orgLevels, setOrgLevels] = useState([
    { name: lang === 'ko' ? '실' : 'Division', depth: 0 },
    { name: lang === 'ko' ? '팀' : 'Team', depth: 1 },
    { name: lang === 'ko' ? '파트' : 'Unit', depth: 2 },
  ])

  // Step 3: Report/Feedback config
  const [reportStages, setReportStages] = useState(org?.report_stages || 3)
  const [feedbackRounds, setFeedbackRounds] = useState(org?.feedback_rounds || 3)

  const canNext = () => {
    if (step === 0) return companyName.trim() && displayName.trim() && positionTitle.trim()
    if (step === 1) return orgLevels.length > 0 && orgLevels.every((l) => l.name.trim())
    return true
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1)
    else handleFinish()
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      // Save org settings
      await updateOrg({
        name: companyName.trim(),
        report_stages: reportStages,
        feedback_rounds: feedbackRounds,
        org_levels: orgLevels,
      })
      // Save profile
      await updateProfile({
        display_name: displayName.trim(),
        position_title: positionTitle.trim(),
        onboarding_completed: true,
      })
      toast(t('onboarding.setupComplete'), 'success')
    } catch (err) {
      toast(`${err}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const addLevel = () => {
    if (orgLevels.length >= 5) return
    setOrgLevels([...orgLevels, { name: '', depth: orgLevels.length }])
  }

  const removeLevel = (i: number) => {
    const next = orgLevels.filter((_, idx) => idx !== i).map((l, idx) => ({ ...l, depth: idx }))
    setOrgLevels(next)
  }

  const updateLevel = (i: number, name: string) => {
    setOrgLevels(orgLevels.map((l, idx) => idx === i ? { ...l, name } : l))
  }

  return (
    <div className="fixed inset-0 z-[100] bg-bg flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, var(--color-text) 1px, transparent 0)',
        backgroundSize: '40px 40px',
      }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-5xl">🎯</span>
          <h1 className="text-2xl font-bold mt-3">KPI Cascade</h1>
          <p className="text-sm text-text-muted mt-1">{t('onboarding.setupDesc')}</p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-primary' : i < step ? 'w-4 bg-primary/40' : 'w-4 bg-surface-border'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-6 sm:p-8 border border-surface-border">
          {/* Step title */}
          <div className="mb-6">
            <div className="text-[10px] text-primary font-semibold uppercase tracking-widest mb-1">
              Step {step + 1}/{STEPS.length}
            </div>
            <h2 className="text-lg font-bold">{STEPS[step].title}</h2>
            <p className="text-sm text-text-muted">{STEPS[step].subtitle}</p>
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <div className="space-y-4">
                  <Input
                    label={t('onboarding.companyName')}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={t('onboarding.companyPlaceholder')}
                  />
                  <Input
                    label={t('auth.name')}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t('onboarding.namePlaceholder')}
                  />
                  <div>
                    <label className="text-sm text-text-muted mb-1.5 block">{t('onboarding.positionTitle')}</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {POSITION_PRESETS.map((p) => (
                        <button
                          key={p}
                          onClick={() => setPositionTitle(p)}
                          className={`text-xs px-2.5 py-1 rounded-md cursor-pointer transition-colors border
                            ${positionTitle === p
                              ? 'border-primary bg-primary/15 text-primary'
                              : 'border-surface-border text-text-muted hover:text-text hover:border-text-muted/30'
                            }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <input
                      value={positionTitle}
                      onChange={(e) => setPositionTitle(e.target.value)}
                      placeholder={t('onboarding.positionPlaceholder')}
                      className="w-full rounded-lg border border-surface-border bg-bg px-3 py-2 text-sm
                        placeholder:text-text-muted/40 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="p-3 rounded-lg bg-surface-light text-xs text-text-muted leading-relaxed">
                    💡 <b className="text-text">{displayName || '___'}  {positionTitle || '___'}</b>{t('onboarding.personalAssistant')}
                    {' '}{t('onboarding.kpiStructure')}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-xs text-text-muted leading-relaxed">
                    {t('onboarding.orgLevelDesc')}
                  </p>
                  <div className="flex flex-col gap-2">
                    {orgLevels.map((level, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-text-muted w-6 text-center shrink-0">L{i + 1}</span>
                        <input
                          value={level.name}
                          onChange={(e) => updateLevel(i, e.target.value)}
                          placeholder={t('onboarding.levelPlaceholder').replace('{n}', String(i + 1))}
                          className="flex-1 rounded-lg border border-surface-border bg-bg px-3 py-2 text-sm
                            placeholder:text-text-muted/40 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                        />
                        {orgLevels.length > 1 && (
                          <button
                            onClick={() => removeLevel(i)}
                            className="text-xs text-text-muted hover:text-danger cursor-pointer px-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {orgLevels.length < 5 && (
                    <button
                      onClick={addLevel}
                      className="text-xs text-primary hover:underline cursor-pointer"
                    >
                      {t('onboarding.addLevel')}
                    </button>
                  )}
                  <div className="p-3 rounded-lg bg-surface-light text-xs text-text-muted leading-relaxed">
                    📋 {t('onboarding.orgExample')}
                    <br />
                    {t('onboarding.orgNote')}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="text-sm text-text-muted mb-2 block">{t('onboarding.reportStages')}</label>
                    <div className="flex items-center gap-3">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => setReportStages(n)}
                          className={`w-10 h-10 rounded-lg text-sm font-bold cursor-pointer transition-all border
                            ${reportStages === n
                              ? 'border-depth-0 bg-depth-0/15 text-depth-0'
                              : 'border-surface-border text-text-muted hover:border-text-muted/30'
                            }`}
                        >
                          {n}
                        </button>
                      ))}
                      <span className="text-xs text-text-muted">{t('onboarding.stages')}</span>
                    </div>
                    <p className="text-[10px] text-text-muted mt-1.5">
                      {t('onboarding.defaultStages')}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm text-text-muted mb-2 block">{t('onboarding.feedbackRounds')}</label>
                    <div className="flex items-center gap-3">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => setFeedbackRounds(n)}
                          className={`w-10 h-10 rounded-lg text-sm font-bold cursor-pointer transition-all border
                            ${feedbackRounds === n
                              ? 'border-primary bg-primary/15 text-primary'
                              : 'border-surface-border text-text-muted hover:border-text-muted/30'
                            }`}
                        >
                          {n}
                        </button>
                      ))}
                      <span className="text-xs text-text-muted">{t('onboarding.rounds')}</span>
                    </div>
                    <p className="text-[10px] text-text-muted mt-1.5">
                      {t('onboarding.feedbackDesc')}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-trace/5 border border-trace/20 text-xs text-text leading-relaxed">
                    🤖 {t('onboarding.finishMsg').replace('{name}', `${displayName} ${positionTitle}`)}
                    {' '}{t('onboarding.finishDesc')}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-surface-border">
            {step > 0 ? (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
                {t('onboarding.previous')}
              </Button>
            ) : (
              <div />
            )}
            <Button
              onClick={handleNext}
              disabled={!canNext() || saving}
            >
              {saving ? t('common.saving') : step === STEPS.length - 1 ? t('onboarding.finish') : t('onboarding.nextStep')}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

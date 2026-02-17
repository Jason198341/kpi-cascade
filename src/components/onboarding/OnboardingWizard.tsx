import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useOrgStore } from '@/stores/orgStore'
import { useUIStore } from '@/stores/uiStore'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'

const STEPS = [
  { title: '환영합니다', subtitle: '기본 정보를 입력해 주세요' },
  { title: '조직 구조', subtitle: '조직도 레벨을 설정하세요' },
  { title: '보고/피드백', subtitle: '보고 단계와 피드백 횟수를 설정하세요' },
]

const POSITION_PRESETS = ['사원', '주임', '대리', '과장', '차장', '부장', '이사', '상무', '전무', '부사장', '사장']

export function OnboardingWizard() {
  const profile = useAuthStore((s) => s.profile)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const org = useOrgStore((s) => s.org)
  const updateOrg = useOrgStore((s) => s.updateOrg)
  const toast = useUIStore((s) => s.toast)

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Step 1: Basic info
  const [companyName, setCompanyName] = useState(org?.name || '')
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [positionTitle, setPositionTitle] = useState(profile?.position_title || '')

  // Step 2: Org structure
  const [orgLevels, setOrgLevels] = useState([
    { name: '실', depth: 0 },
    { name: '팀', depth: 1 },
    { name: '파트', depth: 2 },
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
      toast('설정이 완료되었습니다!', 'success')
    } catch (err) {
      toast(`오류: ${err}`, 'error')
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
          <p className="text-sm text-text-muted mt-1">당신의 개인 KPI 비서를 설정합니다</p>
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
                    label="회사/조직 이름"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="캐스케이드 Inc."
                  />
                  <Input
                    label="이름"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="홍길동"
                  />
                  <div>
                    <label className="text-sm text-text-muted mb-1.5 block">직급/직책</label>
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
                      placeholder="직접 입력..."
                      className="w-full rounded-lg border border-surface-border bg-bg px-3 py-2 text-sm
                        placeholder:text-text-muted/40 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="p-3 rounded-lg bg-surface-light text-xs text-text-muted leading-relaxed">
                    💡 <b className="text-text">{displayName || '___'}  {positionTitle || '___'}님</b>의 개인 KPI 비서가 됩니다.
                    KPI 체계는 <b className="text-text">전략 목표 → KPI → 액션 플랜</b> 3단계로 고정됩니다.
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-xs text-text-muted leading-relaxed">
                    조직의 레벨 구조를 설정하세요. 이 정보는 팀원 관리와 레포트 생성에 활용됩니다.
                  </p>
                  <div className="flex flex-col gap-2">
                    {orgLevels.map((level, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-text-muted w-6 text-center shrink-0">L{i + 1}</span>
                        <input
                          value={level.name}
                          onChange={(e) => updateLevel(i, e.target.value)}
                          placeholder={`레벨 ${i + 1} 이름 (예: 실, 팀, 파트)`}
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
                      + 레벨 추가
                    </button>
                  )}
                  <div className="p-3 rounded-lg bg-surface-light text-xs text-text-muted leading-relaxed">
                    📋 예시: <b className="text-text">본부 → 실 → 팀 → 파트</b> 또는 <b className="text-text">사업부 → 팀</b>
                    <br />
                    KPI 트리 뎁스(전략-KPI-액션)와는 별개로, 조직 구조는 인사/보고 라인입니다.
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="text-sm text-text-muted mb-2 block">경영층 보고 단계</label>
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
                      <span className="text-xs text-text-muted">단계</span>
                    </div>
                    <p className="text-[10px] text-text-muted mt-1.5">
                      기본 3단계: 계획 보고 → 중간 보고 → 결과 보고
                    </p>
                  </div>

                  <div>
                    <label className="text-sm text-text-muted mb-2 block">피드백 횟수</label>
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
                      <span className="text-xs text-text-muted">회</span>
                    </div>
                    <p className="text-[10px] text-text-muted mt-1.5">
                      각 KPI 항목에 대한 피드백 기록 횟수. 피드백에 메모를 남기면 연말 레포트에 반영됩니다.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-trace/5 border border-trace/20 text-xs text-text leading-relaxed">
                    🤖 설정 완료 후 <b>{displayName} {positionTitle}님</b>의 개인 KPI 비서가 활성화됩니다.
                    보고/피드백 데이터는 연말 개인 KPI 레포트 생성에 활용되니 수시로 기록해 주세요.
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-surface-border">
            {step > 0 ? (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
                ← 이전
              </Button>
            ) : (
              <div />
            )}
            <Button
              onClick={handleNext}
              disabled={!canNext() || saving}
            >
              {saving ? '저장중...' : step === STEPS.length - 1 ? '완료 ✓' : '다음 →'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

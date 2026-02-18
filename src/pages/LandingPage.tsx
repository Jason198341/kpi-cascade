import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/common/Button'
import { useUIStore } from '@/stores/uiStore'

export default function LandingPage() {
  const navigate = useNavigate()
  const t = useUIStore((s) => s.t)

  const FEATURES = [
    { emoji: '🔗', title: t('landing.feature1Title'), desc: t('landing.feature1Desc') },
    { emoji: '✦', title: t('landing.feature2Title'), desc: t('landing.feature2Desc') },
    { emoji: '📊', title: t('landing.feature3Title'), desc: t('landing.feature3Desc') },
    { emoji: '🤖', title: t('landing.feature4Title'), desc: t('landing.feature4Desc') },
  ]

  return (
    <div className="min-h-screen bg-bg noise">
      {/* Hero */}
      <div className="relative max-w-4xl mx-auto px-6 pt-24 pb-20 text-center overflow-hidden">
        {/* Background decorative blobs */}
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-depth-0/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-depth-2/8 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <span className="text-6xl">🎯</span>
          <h1 className="text-4xl md:text-5xl font-bold mt-6 mb-4 leading-tight">
            <span className="text-gradient-hero">{t('landing.heroTitle1')}</span>
            <br />
            {t('landing.heroTitle2')}
          </h1>
          <p className="text-text-muted text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            {t('landing.heroDesc1')}
            <br />
            {t('landing.heroDesc2')}
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')} className="glow-primary">
              {t('landing.start')}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/auth')}>
              {t('landing.demo')}
            </Button>
          </div>
        </motion.div>

        {/* Contribution trace preview */}
        <motion.div
          className="relative mt-16 p-6 rounded-2xl glass max-w-lg mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="text-xs text-text-muted mb-4 font-medium">{t('landing.tracePreview')}</div>
          <div className="flex flex-col gap-2">
            {[
              { depth: 0, emoji: '💰', title: t('landing.heroTitle1'), progress: 56, color: 'depth-0' },
              { depth: 1, emoji: '📈', title: t('depth.1'), progress: 65, color: 'depth-1' },
              { depth: 2, emoji: '📞', title: t('depth.2'), progress: 60, color: 'depth-2' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className="flex items-center gap-3 relative"
              >
                {/* Left depth bar */}
                <div
                  className="w-1 self-stretch rounded-full shrink-0"
                  style={{ backgroundColor: `var(--color-${item.color})`, opacity: 0.5 }}
                />
                <div className={`flex items-center gap-3 flex-1 p-3 rounded-lg bg-surface-light/60 border border-${item.color}/15`}>
                  <span>{item.emoji}</span>
                  <span className="text-sm flex-1 text-left">{item.title}</span>
                  <span className={`text-sm font-mono font-bold text-${item.color}`}>{item.progress}%</span>
                </div>
              </motion.div>
            ))}
            <div className="text-center mt-3">
              <span className="text-xs text-trace font-mono font-bold glow-trace inline-block px-3 py-1 rounded-full bg-trace/10">
                ✦ {t('landing.myContrib')}: 9.6%
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="glass rounded-xl p-6 hover:border-primary/20 transition-colors"
            >
              <span className="text-2xl">{f.emoji}</span>
              <h3 className="text-lg font-semibold mt-3 mb-2">{f.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-surface-border py-8 text-center text-xs text-text-muted">
        KPI Cascade — Built with React, Supabase & AI
      </div>
    </div>
  )
}

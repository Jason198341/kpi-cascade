import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const { signIn, signUp, signInWithGoogle, loading } = useAuthStore()
  const t = useUIStore((s) => s.t)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (isSignUp) await signUp(email, password, name)
      else await signIn(email, password)
    } catch (err: unknown) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg noise p-4">
      <motion.div
        className="w-full max-w-sm glass rounded-2xl p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-8">
          <span className="text-5xl">🎯</span>
          <h1 className="text-2xl font-bold mt-3">KPI Cascade</h1>
          <p className="text-text-muted text-sm mt-1">프랙탈 KPI 캐스케이드 시스템</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignUp && (
            <Input
              label={t('auth.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <Input
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label={t('auth.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {error && (
            <p className="text-danger text-sm bg-danger/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t('common.loading') : isSignUp ? t('auth.signUp') : t('auth.signIn')}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-surface-border" />
          <span className="text-xs text-text-muted">OR</span>
          <div className="flex-1 h-px bg-surface-border" />
        </div>

        <Button variant="secondary" className="w-full" onClick={signInWithGoogle}>
          {t('auth.google')}
        </Button>

        <p className="text-center text-sm text-text-muted mt-6">
          {isSignUp ? t('auth.hasAccount') : t('auth.noAccount')}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary hover:underline cursor-pointer"
          >
            {isSignUp ? t('auth.signIn') : t('auth.signUp')}
          </button>
        </p>
      </motion.div>
    </div>
  )
}

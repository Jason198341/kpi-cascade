import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'

export function AuthPage() {
  const navigate = useNavigate()
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
    <div className="min-h-screen flex flex-col bg-bg">
      {/* Mini nav */}
      <nav className="flex items-center px-6 h-14 border-b border-surface-border/50">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <span className="text-lg">🎯</span>
          <span className="font-semibold text-sm text-text">KPI Cascade</span>
        </button>
      </nav>

      {/* Auth card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          className="w-full max-w-sm rounded-xl border border-surface-border bg-surface p-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-xl font-semibold">
              {isSignUp ? t('auth.signUp') : t('auth.signIn')}
            </h1>
            <p className="text-text-muted text-sm mt-1.5">KPI Cascade</p>
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
              <p className="text-danger text-xs bg-danger/8 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button type="submit" disabled={loading} className="w-full mt-1">
              {loading ? t('common.loading') : isSignUp ? t('auth.signUp') : t('auth.signIn')}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="text-[11px] text-text-muted uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          <Button variant="secondary" className="w-full" onClick={signInWithGoogle}>
            {t('auth.google')}
          </Button>

          <p className="text-center text-sm text-text-muted mt-6">
            {isSignUp ? t('auth.hasAccount') : t('auth.noAccount')}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline cursor-pointer font-medium"
            >
              {isSignUp ? t('auth.signIn') : t('auth.signUp')}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

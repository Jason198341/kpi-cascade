import { useAuthStore } from '@/stores/authStore'

const DAILY_LIMIT = 1
const UNLIMITED_EMAILS = ['kcmmer1@naver.com', 'skypeople41@gmail.com']

function isUnlimited(): boolean {
  const email =
    useAuthStore.getState().profile?.email ||
    useAuthStore.getState().user?.email ||
    ''
  return UNLIMITED_EMAILS.includes(email)
}

export function checkDailyLimit(featureKey: string): { allowed: boolean; remaining: number } {
  if (isUnlimited()) return { allowed: true, remaining: Infinity }
  const today = new Date().toISOString().slice(0, 10)
  const storageKey = `kc_rate_${featureKey}_${today}`
  const count = parseInt(localStorage.getItem(storageKey) || '0', 10)
  return { allowed: count < DAILY_LIMIT, remaining: Math.max(0, DAILY_LIMIT - count) }
}

export function incrementDailyCount(featureKey: string): void {
  if (isUnlimited()) return
  const today = new Date().toISOString().slice(0, 10)
  const storageKey = `kc_rate_${featureKey}_${today}`
  const count = parseInt(localStorage.getItem(storageKey) || '0', 10)
  localStorage.setItem(storageKey, String(count + 1))
}

export const RATE_LIMIT_ERROR_MESSAGE =
  '일일 AI 사용 한도(1회)를 초과했습니다. 내일 다시 시도해주세요.'
